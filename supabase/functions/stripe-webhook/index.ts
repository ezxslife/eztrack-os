// supabase/functions/stripe-webhook/index.ts
// Receives Stripe webhooks (charge.succeeded, charge.refunded, terminal.reader.action_succeeded).
// Logs raw payload to scan_webhooks; dispatches to checkin-router for canonical processing.
//
// Deploy:   supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets:  supabase secrets set STRIPE_WEBHOOK_SECRET=<from Stripe dashboard>
// Subscribe in Stripe: POST https://<project>.supabase.co/functions/v1/stripe-webhook
//                      events: charge.succeeded, charge.refunded,
//                              checkout.session.completed,
//                              terminal.reader.action_succeeded

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';
import { verifyStripeSignature } from '../_shared/signature.ts';

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
  livemode: boolean;
}

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  const sigCheck = await verifyStripeSignature(rawBody, signatureHeader, secret);

  let event: StripeEvent | null = null;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch (_) {
    // Malformed body — fall through to log
  }

  const supabase = getServiceRoleClient();

  const { data: logRow, error: logErr } = await supabase
    .from('scan_webhooks')
    .insert({
      provider: 'stripe',
      event_type: event?.type ?? 'unknown',
      external_event_id: event?.id ?? `unparsable:${Date.now()}`,
      signature_valid: sigCheck.ok,
      raw_payload: event ?? { _raw: rawBody.slice(0, 4096) },
      raw_headers: collectHeaders(req),
    })
    .select('id')
    .single();

  if (logErr) {
    console.error('[stripe-webhook] log insert failed', logErr);
    return new Response(JSON.stringify({ ok: false, error: 'log_failed' }), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  if (!sigCheck.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: 'invalid_signature', reason: sigCheck.reason }),
      { status: 401, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  }

  if (!event) {
    return new Response(JSON.stringify({ ok: false, error: 'malformed_body' }), {
      status: 400,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  // Dispatch to checkin-router for processing
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
        source: 'stripe_webhook',
        scan_webhook_id: logRow.id,
        action: event.type,
        stripe_event_id: event.id,
      }),
    });

    if (!dispatchResp.ok) {
      const errText = await dispatchResp.text();
      console.error('[stripe-webhook] checkin-router dispatch failed', errText);
      await supabase
        .from('scan_webhooks')
        .update({ processing_error: `dispatch_failed: ${errText}` })
        .eq('id', logRow.id);
    }
  } catch (e) {
    console.error('[stripe-webhook] dispatch threw', e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});

function collectHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'authorization') return;
    if (k.toLowerCase() === 'cookie') return;
    out[k] = v;
  });
  return out;
}
