// supabase/functions/wall-display-pairing/index.ts
// Creates and redeems short-lived wall-display pairing codes.
//
// Deploy:   supabase functions deploy wall-display-pairing --no-verify-jwt
// Secrets:  supabase secrets set SUPABASE_JWT_SECRET=<project JWT secret>

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';

type PairingRequest =
  | {
      action: 'create';
      event_id: string;
      device_label?: string;
      code_ttl_minutes?: number;
    }
  | {
      action: 'redeem';
      pairing_code: string;
      device_label?: string;
      session_ttl_minutes?: number;
    }
  | {
      action: 'revoke';
      session_id: string;
    };

interface EventRow {
  id: string;
  org_id: string;
  name: string;
  status: string;
}

interface WallDisplaySession {
  id: string;
  org_id: string;
  event_id: string;
  pairing_code: string;
  paired_at: string | null;
  paired_device_label: string | null;
  jwt_id: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_by: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  let body: PairingRequest;
  try {
    body = (await req.json()) as PairingRequest;
  } catch {
    return json({ ok: false, error: 'malformed_body' }, 400);
  }

  const supabase = getServiceRoleClient();

  try {
    switch (body.action) {
      case 'create':
        return await createPairingCode(req, supabase, body);
      case 'redeem':
        return await redeemPairingCode(supabase, body);
      case 'revoke':
        return await revokeSession(req, supabase, body);
      default:
        return json({ ok: false, error: 'unknown_action' }, 400);
    }
  } catch (error) {
    console.error('[wall-display-pairing] unhandled', error);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
});

async function createPairingCode(
  req: Request,
  supabase: ReturnType<typeof getServiceRoleClient>,
  body: Extract<PairingRequest, { action: 'create' }>,
): Promise<Response> {
  const user = await requireUser(req, supabase);
  if (!user.ok) return user.response;

  const event = await loadEvent(supabase, body.event_id);
  if (!event) return json({ ok: false, error: 'event_not_found' }, 404);

  const member = await isOrgMember(supabase, user.id, event.org_id);
  if (!member) return json({ ok: false, error: 'forbidden' }, 403);

  const codeTtlMinutes = clamp(body.code_ttl_minutes ?? 10, 2, 30);
  const expiresAt = new Date(Date.now() + codeTtlMinutes * 60_000).toISOString();

  let session: WallDisplaySession | null = null;
  let insertError: unknown = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const pairingCode = generatePairingCode();
    const { data, error } = await supabase
      .from('wall_display_sessions')
      .insert({
        org_id: event.org_id,
        event_id: event.id,
        pairing_code: pairingCode,
        paired_device_label: body.device_label?.trim() || null,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (!error && data) {
      session = data as WallDisplaySession;
      insertError = null;
      break;
    }

    insertError = error;
  }

  if (!session) {
    console.error('[wall-display-pairing] create failed', insertError);
    return json({ ok: false, error: 'pairing_code_unavailable' }, 500);
  }

  return json({
    ok: true,
    pairing_code: session.pairing_code,
    expires_at: session.expires_at,
    event: publicEvent(event),
  });
}

async function redeemPairingCode(
  supabase: ReturnType<typeof getServiceRoleClient>,
  body: Extract<PairingRequest, { action: 'redeem' }>,
): Promise<Response> {
  const code = normalizePairingCode(body.pairing_code);
  if (!code) return json({ ok: false, error: 'invalid_pairing_code' }, 400);

  const now = new Date().toISOString();
  const { data: session, error } = await supabase
    .from('wall_display_sessions')
    .select('*')
    .eq('pairing_code', code)
    .is('paired_at', null)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .maybeSingle();

  if (error) {
    console.error('[wall-display-pairing] lookup failed', error);
    return json({ ok: false, error: 'lookup_failed' }, 500);
  }

  if (!session) {
    return json({ ok: false, error: 'pairing_code_expired' }, 404);
  }

  const event = await loadEvent(supabase, (session as WallDisplaySession).event_id);
  if (!event) return json({ ok: false, error: 'event_not_found' }, 404);

  const sessionTtlMinutes = clamp(body.session_ttl_minutes ?? 720, 15, 1440);
  const expiresAt = new Date(Date.now() + sessionTtlMinutes * 60_000).toISOString();
  const jwtId = crypto.randomUUID();

  const { data: paired, error: updateError } = await supabase
    .from('wall_display_sessions')
    .update({
      paired_at: now,
      paired_device_label: body.device_label?.trim() || 'Wall display',
      jwt_id: jwtId,
      expires_at: expiresAt,
    })
    .eq('id', (session as WallDisplaySession).id)
    .is('paired_at', null)
    .is('revoked_at', null)
    .select('*')
    .single();

  if (updateError || !paired) {
    console.error('[wall-display-pairing] redeem update failed', updateError);
    return json({ ok: false, error: 'redeem_failed' }, 409);
  }

  const accessToken = await signWallDisplayJwt(paired as WallDisplaySession, event, jwtId, expiresAt);

  return json({
    ok: true,
    access_token: accessToken,
    token_type: 'bearer',
    expires_at: expiresAt,
    session_id: (paired as WallDisplaySession).id,
    event: publicEvent(event),
  });
}

async function revokeSession(
  req: Request,
  supabase: ReturnType<typeof getServiceRoleClient>,
  body: Extract<PairingRequest, { action: 'revoke' }>,
): Promise<Response> {
  const user = await requireUser(req, supabase);
  if (!user.ok) return user.response;

  const { data: session, error } = await supabase
    .from('wall_display_sessions')
    .select('*')
    .eq('id', body.session_id)
    .maybeSingle();

  if (error) {
    console.error('[wall-display-pairing] revoke lookup failed', error);
    return json({ ok: false, error: 'lookup_failed' }, 500);
  }

  if (!session) return json({ ok: false, error: 'session_not_found' }, 404);

  const member = await isOrgMember(supabase, user.id, (session as WallDisplaySession).org_id);
  if (!member) return json({ ok: false, error: 'forbidden' }, 403);

  const { error: updateError } = await supabase
    .from('wall_display_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', body.session_id);

  if (updateError) {
    console.error('[wall-display-pairing] revoke failed', updateError);
    return json({ ok: false, error: 'revoke_failed' }, 500);
  }

  return json({ ok: true });
}

async function requireUser(
  req: Request,
  supabase: ReturnType<typeof getServiceRoleClient>,
): Promise<{ ok: true; id: string } | { ok: false; response: Response }> {
  const authorization = req.headers.get('authorization') ?? '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return { ok: false, response: json({ ok: false, error: 'missing_auth' }, 401) };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, response: json({ ok: false, error: 'invalid_auth' }, 401) };
  }

  return { ok: true, id: data.user.id };
}

async function loadEvent(
  supabase: ReturnType<typeof getServiceRoleClient>,
  eventId: string,
): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from('events')
    .select('id, org_id, name, status')
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[wall-display-pairing] event lookup failed', error);
    return null;
  }

  return data as EventRow | null;
}

async function isOrgMember(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  orgId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[wall-display-pairing] profile lookup failed', error);
    return false;
  }

  return Boolean(data);
}

async function signWallDisplayJwt(
  session: WallDisplaySession,
  event: EventRow,
  jwtId: string,
  expiresAt: string,
): Promise<string> {
  const secret = Deno.env.get('SUPABASE_JWT_SECRET');
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is required to issue wall-display tokens');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = Math.floor(new Date(expiresAt).getTime() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const payload = {
    aud: 'authenticated',
    exp,
    iat: now,
    iss: 'supabase',
    jti: jwtId,
    role: 'authenticated',
    sub: session.id,
    wall_display_session_id: session.id,
    wall_display_event_id: event.id,
    wall_display_org_id: event.org_id,
    app_metadata: {
      provider: 'wall-display',
      providers: ['wall-display'],
    },
    user_metadata: {
      display: 'wall-display',
    },
  };

  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(unsigned),
  );

  return `${unsigned}.${base64UrlBytes(new Uint8Array(signature))}`;
}

function generatePairingCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1_000_000).padStart(6, '0');
}

function normalizePairingCode(input: string) {
  const code = input.replace(/\D/g, '').slice(0, 6);
  return code.length === 6 ? code : null;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function publicEvent(event: EventRow) {
  return {
    id: event.id,
    name: event.name,
    status: event.status,
  };
}

function base64UrlJson(value: unknown) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
