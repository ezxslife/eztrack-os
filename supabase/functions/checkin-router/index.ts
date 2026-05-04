// supabase/functions/checkin-router/index.ts
// Canonical writer of check_ins + orders. Fans in from:
//   - eventbrite-webhook (action: attendee.checked_in, order.placed, order.refunded)
//   - stripe-webhook (action: charge.succeeded, charge.refunded, terminal.reader.action_succeeded)
//   - own-scanner (web/mobile POST direct)            [v1.5]
//   - manual lookup (web POST direct)
//   - POS (web POST direct)
//
// Responsibilities:
//   1. Resolve the inbound payload to (org_id, event_id, event_day_id, ticket).
//   2. Apply re-entry policy: figure out result + entry_number for this scan.
//   3. Write CheckIn row (and Order row for POS / order webhooks).
//   4. Update scan_webhooks.processed_* fields.
//   5. Return result so the caller can render the banner (own-scanner case).
//
// L0 ships the SKELETON: full ingestion logic is wired sprint-by-sprint.
// L1 adds Eventbrite attendee.checked_in handling (the killer path).
// L2 adds Stripe Terminal POS handling.
// L3 adds DICE/Posh + own-scanner. Until then, sources fall through to NOOP.

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';

type RouterPayload =
  | {
      source: 'eventbrite_webhook';
      scan_webhook_id: string;
      action: string;          // 'attendee.checked_in', 'order.placed', etc.
      api_url: string;         // e.g. https://www.eventbriteapi.com/v3/orders/12345/
    }
  | {
      source: 'stripe_webhook';
      scan_webhook_id: string;
      action: string;          // 'charge.succeeded', 'terminal.reader.action_succeeded', ...
      stripe_event_id: string;
    }
  | {
      source: 'qr_scanner' | 'manual_lookup' | 'pos_auto_checkin';
      org_id: string;
      event_id: string;
      ticket_id?: string;
      ticket_external_id?: string;
      ticket_external_source?: 'eventbrite' | 'dice' | 'posh' | 'stripe_checkout';
      scanned_by?: string;
      device?: string;
      location?: string;
    };

interface RouterResponse {
  ok: boolean;
  result?: 'success' | 'already_scanned' | 'invalid' | 'expired' | 'wrong_day' | 'wrong_event';
  check_in_id?: string;
  ticket?: {
    id: string;
    tier: string;
    customer_first_name?: string | null;
    customer_last_name?: string | null;
  };
  entry_number?: number;
  error?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  let payload: RouterPayload;
  try {
    payload = (await req.json()) as RouterPayload;
  } catch {
    return json({ ok: false, error: 'malformed_body' }, 400);
  }

  const supabase = getServiceRoleClient();

  try {
    switch (payload.source) {
      case 'eventbrite_webhook':
        return await handleEventbriteWebhook(supabase, payload);
      case 'stripe_webhook':
        return await handleStripeWebhook(supabase, payload);
      case 'qr_scanner':
      case 'manual_lookup':
      case 'pos_auto_checkin':
        return await handleDirectScan(supabase, payload);
      default:
        return json({ ok: false, error: 'unknown_source' }, 400);
    }
  } catch (e) {
    console.error('[checkin-router] unhandled', e);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
});

// ===========================================================================
// Eventbrite path
// ===========================================================================

async function handleEventbriteWebhook(
  supabase: ReturnType<typeof getServiceRoleClient>,
  p: Extract<RouterPayload, { source: 'eventbrite_webhook' }>,
): Promise<Response> {
  // L1 work — full implementation lands in L1.
  // Skeleton: mark processed with TODO note; do NOT write a check_in yet.

  await supabase
    .from('scan_webhooks')
    .update({
      processed_at: new Date().toISOString(),
      processing_error: 'L0_SKELETON_NOT_PROCESSED — full Eventbrite ingestion lands in L1',
    })
    .eq('id', p.scan_webhook_id);

  // TODO (L1):
  //   1. Look up the scan_webhooks.raw_payload to get the api_url.
  //   2. Call Eventbrite API (using OAuth access_token from connections.encrypted_tokens)
  //      to fetch the full attendee + order detail.
  //   3. Resolve to (org_id, event_id, event_day_id, ticket_id) using
  //      tickets.external_id mapping.
  //   4. Write check_ins row (or orders row for order.* events).

  return json({ ok: true, result: 'success' });
}

// ===========================================================================
// Stripe path
// ===========================================================================

async function handleStripeWebhook(
  supabase: ReturnType<typeof getServiceRoleClient>,
  p: Extract<RouterPayload, { source: 'stripe_webhook' }>,
): Promise<Response> {
  // L2 work — full implementation lands in L2.
  // Skeleton: mark processed with TODO note.

  await supabase
    .from('scan_webhooks')
    .update({
      processed_at: new Date().toISOString(),
      processing_error: 'L0_SKELETON_NOT_PROCESSED — full Stripe Terminal ingestion lands in L2',
    })
    .eq('id', p.scan_webhook_id);

  // TODO (L2):
  //   1. Read scan_webhooks.raw_payload to get the Stripe event object.
  //   2. For terminal.reader.action_succeeded: create Order + CheckIn (auto-checkin).
  //   3. For checkout.session.completed: create Order (no CheckIn until door scan).
  //   4. For charge.refunded: mark Order refunded; do NOT touch CheckIn.

  return json({ ok: true, result: 'success' });
}

// ===========================================================================
// Direct-scan path (mobile scanner / web manual-lookup / POS auto-checkin)
// ===========================================================================

async function handleDirectScan(
  supabase: ReturnType<typeof getServiceRoleClient>,
  p: Extract<RouterPayload, { source: 'qr_scanner' | 'manual_lookup' | 'pos_auto_checkin' }>,
): Promise<Response> {
  // 1. Resolve ticket
  const { data: ticket, error: ticketErr } = await resolveTicket(supabase, p);

  if (ticketErr || !ticket) {
    return json({ ok: false, result: 'invalid', error: ticketErr ?? 'ticket_not_found' });
  }

  if (ticket.event_id !== p.event_id) {
    return json({ ok: true, result: 'wrong_event' });
  }

  // 2. Determine event_day
  const { data: currentDayId, error: dayErr } = await supabase
    .rpc('current_event_day', { p_event_id: p.event_id });

  if (dayErr || !currentDayId) {
    return json({ ok: false, error: 'no_active_event_day' });
  }
  const eventDayId = currentDayId as unknown as string;

  // Validate ticket is valid for this day
  if (ticket.valid_for_days &&
      Array.isArray(ticket.valid_for_days) &&
      ticket.valid_for_days.length > 0 &&
      !ticket.valid_for_days.includes(eventDayId)) {
    // Write a wrong_day check_in row for audit; banner still red/orange
    await insertCheckIn(supabase, {
      org_id: p.org_id,
      event_id: p.event_id,
      event_day_id: eventDayId,
      ticket_id: ticket.id,
      customer_id: ticket.customer_id,
      source: p.source,
      result: 'wrong_day',
      entry_number: 0,
      scanned_by: p.scanned_by,
      device: p.device,
      location: p.location,
    });
    return json({ ok: true, result: 'wrong_day', ticket: shapeTicket(ticket) });
  }

  // 3. Apply re-entry policy
  const { data: priorScans } = await supabase
    .from('check_ins')
    .select('id, result, entry_number, scanned_at')
    .eq('ticket_id', ticket.id)
    .eq('event_day_id', eventDayId)
    .order('scanned_at', { ascending: true });

  const successScansToday = (priorScans ?? []).filter((s) => s.result === 'success').length;
  const reentryPolicy = ticket.event_day_reentry_policy ?? 'count_once_per_day';

  let result: 'success' | 'already_scanned';
  let entryNumber: number;

  if (successScansToday === 0) {
    result = 'success';
    entryNumber = 1;
  } else {
    switch (reentryPolicy) {
      case 'count_every_scan':
        result = 'success';
        entryNumber = successScansToday + 1;
        break;
      case 'no_reentry':
        result = 'already_scanned';
        entryNumber = successScansToday + 1;
        break;
      case 'count_once_per_day':
      case 'count_once_per_event':
      default:
        result = 'already_scanned';
        entryNumber = successScansToday + 1;
        break;
    }
  }

  // 4. Write the check_in
  const { data: newCheckIn, error: insertErr } = await insertCheckIn(supabase, {
    org_id: p.org_id,
    event_id: p.event_id,
    event_day_id: eventDayId,
    ticket_id: ticket.id,
    customer_id: ticket.customer_id,
    source: p.source,
    result,
    entry_number: entryNumber,
    scanned_by: p.scanned_by,
    device: p.device,
    location: p.location,
  });

  if (insertErr || !newCheckIn) {
    return json({ ok: false, error: insertErr ?? 'check_in_write_failed' });
  }

  // 5. For multi-day passes, set wristbanded_at on first success
  if (result === 'success' &&
      successScansToday === 0 &&
      (ticket.valid_for_days === null ||
       (Array.isArray(ticket.valid_for_days) && ticket.valid_for_days.length === 0))) {
    await supabase
      .from('tickets')
      .update({ wristbanded_at_event_day_id: eventDayId, state: 'used' })
      .eq('id', ticket.id);
  }

  return json({
    ok: true,
    result,
    check_in_id: newCheckIn.id,
    ticket: shapeTicket(ticket),
    entry_number: entryNumber,
  });
}

// ===========================================================================
// Helpers
// ===========================================================================

interface ResolvedTicket {
  id: string;
  event_id: string;
  customer_id: string | null;
  tier: string;
  valid_for_days: string[] | null;
  state: string;
  customer?: { first_name: string | null; last_name: string | null } | null;
  event_day_reentry_policy?: string;
}

async function resolveTicket(
  supabase: ReturnType<typeof getServiceRoleClient>,
  p: Extract<RouterPayload, { source: 'qr_scanner' | 'manual_lookup' | 'pos_auto_checkin' }>,
): Promise<{ data: ResolvedTicket | null; error: string | null }> {
  let query = supabase
    .from('tickets')
    .select(`
      id, event_id, customer_id, tier, valid_for_days, state,
      customer:customers ( first_name, last_name )
    `)
    .is('deleted_at', null)
    .limit(1);

  if (p.ticket_id) {
    query = query.eq('id', p.ticket_id);
  } else if (p.ticket_external_id && p.ticket_external_source) {
    query = query
      .eq('source', p.ticket_external_source)
      .eq('external_id', p.ticket_external_id);
  } else {
    return { data: null, error: 'must_provide_ticket_id_or_external_id' };
  }

  const { data, error } = await query.single();
  if (error || !data) return { data: null, error: error?.message ?? 'not_found' };
  return { data: data as unknown as ResolvedTicket, error: null };
}

interface CheckInInsert {
  org_id: string;
  event_id: string;
  event_day_id: string;
  ticket_id: string;
  customer_id: string | null;
  source: 'qr_scanner' | 'manual_lookup' | 'pos_auto_checkin';
  result: 'success' | 'already_scanned' | 'invalid' | 'expired' | 'wrong_day' | 'wrong_event';
  entry_number: number;
  scanned_by?: string;
  device?: string;
  location?: string;
}

async function insertCheckIn(
  supabase: ReturnType<typeof getServiceRoleClient>,
  row: CheckInInsert,
) {
  return await supabase
    .from('check_ins')
    .insert(row)
    .select('id')
    .single();
}

function shapeTicket(t: ResolvedTicket): RouterResponse['ticket'] {
  return {
    id: t.id,
    tier: t.tier,
    customer_first_name: t.customer?.first_name ?? null,
    customer_last_name: t.customer?.last_name ?? null,
  };
}

function json(body: RouterResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
