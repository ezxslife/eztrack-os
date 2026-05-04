// supabase/functions/eventbrite-webhook/index.ts
// Receives Eventbrite webhooks (attendee.checked_in, order.placed, order.refunded, event.updated).
// Logs raw payload to scan_webhooks, then dispatches to checkin-router for canonical processing.
//
// Deploy:   supabase functions deploy eventbrite-webhook --no-verify-jwt
// Secrets:  supabase secrets set EVENTBRITE_WEBHOOK_SECRET=<from Eventbrite app>
// Subscribe in Eventbrite: POST https://<project>.supabase.co/functions/v1/eventbrite-webhook
//                          actions: order.placed, order.refunded, attendee.checked_in,
//                                   attendee.updated, event.updated

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';
import { verifyEventbriteSignature } from '../_shared/signature.ts';

interface EventbriteWebhookPayload {
  api_url: string;        // e.g. https://www.eventbriteapi.com/v3/orders/12345/
  config?: {
    action: string;       // 'attendee.checked_in', etc.
    endpoint_url: string;
    user_id?: string;
    webhook_id?: string;
  };
}

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-eventbrite-signature');
  const secret = Deno.env.get('EVENTBRITE_WEBHOOK_SECRET') ?? '';

  // 1. Verify signature
  const sigValid = await verifyEventbriteSignature(rawBody, signatureHeader, secret);

  // 2. Log raw webhook (regardless of signature validity, for forensics)
  let payload: EventbriteWebhookPayload | null = null;
  try {
    payload = JSON.parse(rawBody) as EventbriteWebhookPayload;
  } catch (_) {
    // Malformed JSON — log and bail
  }

  const supabase = getServiceRoleClient();
  const action = payload?.config?.action ?? 'unknown';
  const externalEventId =
    req.headers.get('x-eventbrite-delivery') ??
    `${payload?.config?.webhook_id ?? 'unknown'}:${action}:${payload?.api_url ?? 'unknown'}`;

  let { data: logRow, error: logErr } = await supabase
    .from('scan_webhooks')
    .insert({
      provider: 'eventbrite',
      event_type: action,
      external_event_id: externalEventId,
      signature_valid: sigValid,
      raw_payload: payload ?? { _raw: rawBody.slice(0, 4096) },
      raw_headers: collectHeaders(req),
    })
    .select('id')
    .single();

  if (logErr) {
    const { data: existing } = await supabase
      .from('scan_webhooks')
      .select('id')
      .eq('provider', 'eventbrite')
      .eq('external_event_id', externalEventId)
      .maybeSingle();

    if (existing) {
      logRow = existing;
    } else {
      console.error('[eventbrite-webhook] log insert failed', logErr);
      // Still 200 — we don't want Eventbrite to retry on our internal errors
      return new Response(JSON.stringify({ ok: false, error: 'log_failed' }), {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }
  }

  if (!sigValid) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  if (!payload) {
    return new Response(JSON.stringify({ ok: false, error: 'malformed_body' }), {
      status: 400,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  // 3. Dispatch to checkin-router for canonical processing.
  //    We pass the scan_webhooks row id as idempotency key.
  try {
    const baseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const dispatchResp = await fetch(`${baseUrl}/functions/v1/checkin-router`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        source: 'eventbrite_webhook',
        scan_webhook_id: logRow.id,
        action,
        api_url: payload.api_url,
      }),
    });

    if (!dispatchResp.ok) {
      const errText = await dispatchResp.text();
      console.error('[eventbrite-webhook] checkin-router dispatch failed', errText);
      // Mark the webhook row with the error but still 200 OK to Eventbrite
      await supabase
        .from('scan_webhooks')
        .update({ processing_error: `dispatch_failed: ${errText}` })
        .eq('id', logRow.id);
    }
  } catch (e) {
    console.error('[eventbrite-webhook] dispatch threw', e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});

function collectHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    // Skip noisy / sensitive headers
    if (k.toLowerCase() === 'authorization') return;
    if (k.toLowerCase() === 'cookie') return;
    out[k] = v;
  });
  return out;
}
