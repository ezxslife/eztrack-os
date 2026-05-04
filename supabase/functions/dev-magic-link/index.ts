// supabase/functions/dev-magic-link/index.ts
// Demo-only sign-in helper. Generates a magic-link action URL for one of the
// 6 hardcoded demo profiles so a developer or product reviewer can drop into
// the live UI without an SMTP account or known password.
//
// Allowlisted to the demo emails. Returns 403 for any other email. Safe to
// deploy with verify_jwt: false because the allowlist + service-role-only
// admin API is the only way the response is generated.

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';

const DEMO_EMAILS = new Set([
  'sarah.kim@eztrack.io',
  'james.reid@eztrack.io',
  'diana.torres@eztrack.io',
  'tom.walsh@eztrack.io',
  'lisa.nguyen@eztrack.io',
  'raj.patel@eztrack.io',
]);

interface RequestBody {
  email: string;
  redirect_to?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ ok: false, error: 'malformed_body' }, 400);
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!DEMO_EMAILS.has(email)) {
    return json({ ok: false, error: 'not_a_demo_email' }, 403);
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: body.redirect_to ?? 'http://localhost:54642/live',
    },
  });

  if (error) {
    console.error('[dev-magic-link] generateLink failed', error);
    return json({ ok: false, error: error.message }, 500);
  }

  return json({
    ok: true,
    action_link: data.properties?.action_link,
    email_otp: data.properties?.email_otp,
    user_id: data.user?.id ?? null,
  });
});

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
