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
  const { data: webhook, error: webhookErr } = await supabase
    .from('scan_webhooks')
    .select('id, raw_payload, processed_at')
    .eq('id', p.scan_webhook_id)
    .single();

  if (webhookErr || !webhook) {
    return json({ ok: false, error: webhookErr?.message ?? 'scan_webhook_not_found' }, 404);
  }

  if (webhook.processed_at) {
    return json({ ok: true, result: 'success' });
  }

  const rawPayload = asRecord(webhook.raw_payload) ?? {};
  const apiUrl = asString(rawPayload.api_url) ?? p.api_url;
  const action = p.action || asString(asRecord(rawPayload.config)?.action) || 'unknown';

  try {
    switch (action) {
      case 'attendee.checked_in':
        return await handleEventbriteAttendeeCheckedIn(supabase, p.scan_webhook_id, apiUrl, rawPayload);
      case 'attendee.updated':
        return await handleEventbriteAttendeeUpdated(supabase, p.scan_webhook_id, apiUrl, rawPayload);
      case 'order.placed':
        return await handleEventbriteOrderPlaced(supabase, p.scan_webhook_id, apiUrl, rawPayload);
      case 'order.refunded':
        return await handleEventbriteOrderRefunded(supabase, p.scan_webhook_id, apiUrl, rawPayload);
      case 'event.updated':
        await markWebhookProcessed(supabase, p.scan_webhook_id, {
          processing_error: null,
        });
        return json({ ok: true, result: 'success' });
      default:
        await markWebhookProcessed(supabase, p.scan_webhook_id, {
          processing_error: `ignored_eventbrite_action:${action}`,
        });
        return json({ ok: true, result: 'success' });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'eventbrite_processing_failed';
    await markWebhookProcessed(supabase, p.scan_webhook_id, { processing_error: message });
    return json({ ok: false, error: message }, 200);
  }
}

async function handleEventbriteAttendeeCheckedIn(
  supabase: ReturnType<typeof getServiceRoleClient>,
  scanWebhookId: string,
  apiUrl: string,
  rawPayload: JsonRecord,
): Promise<Response> {
  const token = getEventbriteToken();
  const attendee = token
    ? await fetchEventbriteJson(apiUrl, token).catch((e) => {
        console.error('[checkin-router] Eventbrite attendee fetch failed', e);
        return null;
      })
    : null;
  const parsedIds = parseEventbriteApiUrl(apiUrl);
  const attendeeId = asString(attendee?.id) ?? parsedIds.attendeeId;

  if (!attendeeId) {
    await markWebhookProcessed(supabase, scanWebhookId, {
      processing_error: 'eventbrite_attendee_id_missing',
    });
    return json({ ok: false, error: 'eventbrite_attendee_id_missing' }, 200);
  }

  let ticket = await findEventbriteTicket(supabase, attendeeId);

  if (!ticket && attendee) {
    ticket = await upsertEventbriteTicketFromAttendee(supabase, attendee);
  }

  if (!ticket) {
    await markWebhookProcessed(supabase, scanWebhookId, {
      processing_error: token
        ? `eventbrite_ticket_not_mapped:${attendeeId}`
        : `eventbrite_ticket_not_mapped:${attendeeId}; configure EVENTBRITE_API_TOKEN or pre-sync tickets.external_id`,
    });
    return json({ ok: false, result: 'invalid', error: 'ticket_not_found' }, 200);
  }

  const scanResult = await writeTicketScan(supabase, {
    org_id: ticket.org_id,
    event_id: ticket.event_id,
    ticket,
    source: 'eventbrite_webhook',
    device: 'Eventbrite Organizer',
    raw_payload: { webhook: rawPayload, attendee: attendee ?? { id: attendeeId } },
  });

  await markWebhookProcessed(supabase, scanWebhookId, {
    org_id: ticket.org_id,
    processed_check_in_id: scanResult.check_in_id ?? null,
    processing_error: scanResult.ok ? null : scanResult.error ?? 'check_in_write_failed',
  });

  return json(scanResult, scanResult.ok ? 200 : 200);
}

async function handleEventbriteAttendeeUpdated(
  supabase: ReturnType<typeof getServiceRoleClient>,
  scanWebhookId: string,
  apiUrl: string,
  _rawPayload: JsonRecord,
): Promise<Response> {
  const token = getEventbriteToken();
  if (!token) {
    await markWebhookProcessed(supabase, scanWebhookId, {
      processing_error: 'eventbrite_token_missing_for_attendee_update',
    });
    return json({ ok: true, result: 'success' });
  }

  const attendee = await fetchEventbriteJson(apiUrl, token);
  const ticket = await upsertEventbriteTicketFromAttendee(supabase, attendee);
  await markWebhookProcessed(supabase, scanWebhookId, {
    org_id: ticket?.org_id ?? null,
    processing_error: ticket ? null : 'eventbrite_event_not_mapped_for_attendee_update',
  });
  return json({ ok: true, result: 'success' });
}

async function handleEventbriteOrderPlaced(
  supabase: ReturnType<typeof getServiceRoleClient>,
  scanWebhookId: string,
  apiUrl: string,
  _rawPayload: JsonRecord,
): Promise<Response> {
  const token = getEventbriteToken();
  if (!token) {
    await markWebhookProcessed(supabase, scanWebhookId, {
      processing_error: 'eventbrite_token_missing_for_order_placed',
    });
    return json({ ok: true, result: 'success' });
  }

  const order = await fetchEventbriteJson(withExpand(apiUrl, 'attendees'), token);
  const orderResult = await upsertEventbriteOrder(supabase, order);

  await markWebhookProcessed(supabase, scanWebhookId, {
    org_id: orderResult.org_id ?? null,
    processed_order_id: orderResult.order_id ?? null,
    processing_error: orderResult.error,
  });

  return json({ ok: !orderResult.error, result: 'success', error: orderResult.error ?? undefined });
}

async function handleEventbriteOrderRefunded(
  supabase: ReturnType<typeof getServiceRoleClient>,
  scanWebhookId: string,
  apiUrl: string,
  _rawPayload: JsonRecord,
): Promise<Response> {
  const parsedIds = parseEventbriteApiUrl(apiUrl);
  const token = getEventbriteToken();
  const order = token
    ? await fetchEventbriteJson(withExpand(apiUrl, 'attendees'), token).catch(() => null)
    : null;
  const orderId = asString(order?.id) ?? parsedIds.orderId;

  if (!orderId) {
    await markWebhookProcessed(supabase, scanWebhookId, {
      processing_error: 'eventbrite_order_id_missing_for_refund',
    });
    return json({ ok: false, error: 'eventbrite_order_id_missing_for_refund' }, 200);
  }

  const { data: existing } = await supabase
    .from('orders')
    .select('id, org_id')
    .eq('source', 'eventbrite')
    .eq('external_id', orderId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('orders')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', existing.id);
  }

  await markWebhookProcessed(supabase, scanWebhookId, {
    org_id: existing?.org_id ?? null,
    processed_order_id: existing?.id ?? null,
    processing_error: existing ? null : `eventbrite_order_not_found:${orderId}`,
  });

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

  const scanResult = await writeTicketScan(supabase, {
    org_id: p.org_id,
    event_id: p.event_id,
    ticket,
    source: p.source,
    scanned_by: p.scanned_by,
    device: p.device,
    location: p.location,
  });

  return json(scanResult, scanResult.ok ? 200 : 200);
}

// ===========================================================================
// Helpers
// ===========================================================================

type JsonRecord = Record<string, unknown>;
type ScanSource = 'eventbrite_webhook' | 'qr_scanner' | 'manual_lookup' | 'pos_auto_checkin';
type ReentryPolicy =
  | 'count_once_per_day'
  | 'count_once_per_event'
  | 'count_every_scan'
  | 'no_reentry';

interface ResolvedTicket {
  id: string;
  org_id: string;
  event_id: string;
  customer_id: string | null;
  tier: string;
  valid_for_days: string[] | null;
  state: string;
  customer?: { first_name: string | null; last_name: string | null } | null;
}

async function resolveTicket(
  supabase: ReturnType<typeof getServiceRoleClient>,
  p: Extract<RouterPayload, { source: 'qr_scanner' | 'manual_lookup' | 'pos_auto_checkin' }>,
): Promise<{ data: ResolvedTicket | null; error: string | null }> {
  let query = supabase
    .from('tickets')
    .select(`
      id, org_id, event_id, customer_id, tier, valid_for_days, state,
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
  source: ScanSource;
  result: 'success' | 'already_scanned' | 'invalid' | 'expired' | 'wrong_day' | 'wrong_event';
  entry_number: number;
  scanned_by?: string;
  device?: string;
  location?: string;
  raw_payload?: JsonRecord;
}

interface TicketScanInput {
  org_id: string;
  event_id: string;
  ticket: ResolvedTicket;
  source: ScanSource;
  scanned_by?: string;
  device?: string;
  location?: string;
  raw_payload?: JsonRecord;
  scanned_at?: string;
}

async function writeTicketScan(
  supabase: ReturnType<typeof getServiceRoleClient>,
  input: TicketScanInput,
): Promise<RouterResponse> {
  const ticket = input.ticket;

  if (ticket.state === 'refunded' || ticket.state === 'voided') {
    const eventDay = await resolveEventDay(supabase, input.event_id, input.scanned_at);
    if (eventDay) {
      await insertCheckIn(supabase, {
        org_id: input.org_id,
        event_id: input.event_id,
        event_day_id: eventDay.id,
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        source: input.source,
        result: 'expired',
        entry_number: 0,
        scanned_by: input.scanned_by,
        device: input.device,
        location: input.location,
        raw_payload: input.raw_payload,
      });
    }
    return { ok: true, result: 'expired', ticket: shapeTicket(ticket), entry_number: 0 };
  }

  const eventDay = await resolveEventDay(supabase, input.event_id, input.scanned_at);
  if (!eventDay) {
    return { ok: false, error: 'no_active_event_day' };
  }

  if (ticket.valid_for_days &&
      Array.isArray(ticket.valid_for_days) &&
      ticket.valid_for_days.length > 0 &&
      !ticket.valid_for_days.includes(eventDay.id)) {
    await insertCheckIn(supabase, {
      org_id: input.org_id,
      event_id: input.event_id,
      event_day_id: eventDay.id,
      ticket_id: ticket.id,
      customer_id: ticket.customer_id,
      source: input.source,
      result: 'wrong_day',
      entry_number: 0,
      scanned_by: input.scanned_by,
      device: input.device,
      location: input.location,
      raw_payload: input.raw_payload,
    });
    return { ok: true, result: 'wrong_day', ticket: shapeTicket(ticket), entry_number: 0 };
  }

  const priorQuery = supabase
    .from('check_ins')
    .select('id, result, entry_number, scanned_at')
    .eq('ticket_id', ticket.id)
    .eq('result', 'success')
    .order('scanned_at', { ascending: true });

  const { data: priorScans } = eventDay.reentry_policy === 'count_once_per_event'
    ? await priorQuery.eq('event_id', input.event_id)
    : await priorQuery.eq('event_day_id', eventDay.id);

  const successScanCount = (priorScans ?? []).length;
  const { result, entryNumber } = getReentryResult(eventDay.reentry_policy, successScanCount);

  const { data: newCheckIn, error: insertErr } = await insertCheckIn(supabase, {
    org_id: input.org_id,
    event_id: input.event_id,
    event_day_id: eventDay.id,
    ticket_id: ticket.id,
    customer_id: ticket.customer_id,
    source: input.source,
    result,
    entry_number: entryNumber,
    scanned_by: input.scanned_by,
    device: input.device,
    location: input.location,
    raw_payload: input.raw_payload,
  });

  if (insertErr || !newCheckIn) {
    return { ok: false, error: insertErr?.message ?? 'check_in_write_failed' };
  }

  if (result === 'success' &&
      successScanCount === 0 &&
      (ticket.valid_for_days === null ||
       (Array.isArray(ticket.valid_for_days) && ticket.valid_for_days.length === 0))) {
    await supabase
      .from('tickets')
      .update({ wristbanded_at_event_day_id: eventDay.id })
      .eq('id', ticket.id)
      .is('wristbanded_at_event_day_id', null);
  }

  return {
    ok: true,
    result,
    check_in_id: newCheckIn.id,
    ticket: shapeTicket(ticket),
    entry_number: entryNumber,
  };
}

function getReentryResult(
  policy: ReentryPolicy,
  successScanCount: number,
): { result: 'success' | 'already_scanned'; entryNumber: number } {
  if (successScanCount === 0) {
    return { result: 'success', entryNumber: 1 };
  }

  switch (policy) {
    case 'count_every_scan':
      return { result: 'success', entryNumber: successScanCount + 1 };
    case 'no_reentry':
    case 'count_once_per_day':
    case 'count_once_per_event':
    default:
      return { result: 'already_scanned', entryNumber: successScanCount + 1 };
  }
}

async function resolveEventDay(
  supabase: ReturnType<typeof getServiceRoleClient>,
  eventId: string,
  scanTimeIso = new Date().toISOString(),
): Promise<{ id: string; reentry_policy: ReentryPolicy } | null> {
  const { data: currentDayId } = await supabase
    .rpc('current_event_day', { p_event_id: eventId });

  if (currentDayId) {
    const { data } = await supabase
      .from('event_days')
      .select('id, reentry_policy')
      .eq('id', currentDayId as string)
      .maybeSingle();
    if (data) return data as { id: string; reentry_policy: ReentryPolicy };
  }

  const { data: byScanTime } = await supabase
    .from('event_days')
    .select('id, reentry_policy')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .lte('starts_at', scanTimeIso)
    .gte('ends_at', scanTimeIso)
    .order('day_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (byScanTime) return byScanTime as { id: string; reentry_policy: ReentryPolicy };

  const { data: fallback } = await supabase
    .from('event_days')
    .select('id, reentry_policy')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (fallback as { id: string; reentry_policy: ReentryPolicy } | null) ?? null;
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

function getEventbriteToken(): string | null {
  return (
    Deno.env.get('EVENTBRITE_API_TOKEN') ??
    Deno.env.get('EVENTBRITE_PRIVATE_TOKEN') ??
    Deno.env.get('EVENTBRITE_OAUTH_TOKEN') ??
    null
  );
}

async function fetchEventbriteJson(apiUrl: string, token: string): Promise<JsonRecord> {
  const resp = await fetch(apiUrl, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  });

  if (!resp.ok) {
    throw new Error(`eventbrite_api_${resp.status}:${await resp.text()}`);
  }

  return (await resp.json()) as JsonRecord;
}

function withExpand(apiUrl: string, expand: string): string {
  const url = new URL(apiUrl);
  if (!url.searchParams.has('expand')) {
    url.searchParams.set('expand', expand);
  }
  return url.toString();
}

function parseEventbriteApiUrl(apiUrl: string): {
  eventId: string | null;
  attendeeId: string | null;
  orderId: string | null;
} {
  const match = apiUrl.match(/\/v3\/(?:events\/([^/]+)\/)?(?:(attendees|orders)\/([^/?#]+)|orders\/([^/?#]+))/);
  const eventId = match?.[1] ?? null;
  const resource = match?.[2] ?? null;
  const id = match?.[3] ?? match?.[4] ?? null;
  return {
    eventId,
    attendeeId: resource === 'attendees' ? id : null,
    orderId: resource === 'orders' || apiUrl.includes('/orders/') ? id : null,
  };
}

async function findEventbriteTicket(
  supabase: ReturnType<typeof getServiceRoleClient>,
  attendeeId: string,
): Promise<ResolvedTicket | null> {
  const { data } = await supabase
    .from('tickets')
    .select(`
      id, org_id, event_id, customer_id, tier, valid_for_days, state,
      customer:customers ( first_name, last_name )
    `)
    .eq('source', 'eventbrite')
    .eq('external_id', attendeeId)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  return (data as unknown as ResolvedTicket | null) ?? null;
}

async function upsertEventbriteTicketFromAttendee(
  supabase: ReturnType<typeof getServiceRoleClient>,
  attendee: JsonRecord,
): Promise<ResolvedTicket | null> {
  const attendeeId = asString(attendee.id);
  const eventbriteEventId = asString(attendee.event_id) ?? asString(asRecord(attendee.event)?.id);
  if (!attendeeId || !eventbriteEventId) return null;

  const event = await resolveEventByEventbriteId(supabase, eventbriteEventId);
  if (!event) return null;

  const profile = asRecord(attendee.profile) ?? {};
  const customer = await upsertEventbriteCustomer(supabase, event.org_id, profile, attendeeId);
  const tier =
    asString(attendee.ticket_class_name) ??
    asString(asRecord(attendee.ticket_class)?.name) ??
    'Eventbrite ticket';
  const costs = asRecord(attendee.costs) ?? {};

  const { data, error } = await supabase
    .from('tickets')
    .upsert({
      org_id: event.org_id,
      event_id: event.id,
      customer_id: customer?.id ?? null,
      external_id: attendeeId,
      source: 'eventbrite',
      tier,
      state: ticketStateFromEventbrite(attendee),
      price_cents: moneyValueCents(asRecord(costs.gross)) ?? 0,
      fees_cents: moneyValueCents(asRecord(costs.eventbrite_fee)) ?? 0,
      metadata: {
        eventbrite_event_id: eventbriteEventId,
        eventbrite_order_id: asString(attendee.order_id),
        eventbrite_ticket_class_id: asString(attendee.ticket_class_id),
        barcode: firstBarcode(attendee),
      },
    }, {
      onConflict: 'event_id,source,external_id',
    })
    .select(`
      id, org_id, event_id, customer_id, tier, valid_for_days, state,
      customer:customers ( first_name, last_name )
    `)
    .single();

  if (error) {
    console.error('[checkin-router] Eventbrite ticket upsert failed', error);
    return null;
  }

  return data as unknown as ResolvedTicket;
}

async function upsertEventbriteOrder(
  supabase: ReturnType<typeof getServiceRoleClient>,
  order: JsonRecord,
): Promise<{ order_id: string | null; org_id: string | null; error: string | null }> {
  const orderId = asString(order.id);
  const eventbriteEventId =
    asString(order.event_id) ??
    asString(asRecord(order.event)?.id) ??
    asString(asRecord(asArray(order.attendees)?.[0])?.event_id);

  if (!orderId || !eventbriteEventId) {
    return { order_id: null, org_id: null, error: 'eventbrite_order_missing_id_or_event' };
  }

  const event = await resolveEventByEventbriteId(supabase, eventbriteEventId);
  if (!event) {
    return { order_id: null, org_id: null, error: `eventbrite_event_not_mapped:${eventbriteEventId}` };
  }

  const customer = await upsertEventbriteCustomer(supabase, event.org_id, order, orderId);
  const costs = asRecord(order.costs) ?? {};
  const totalCents = moneyValueCents(asRecord(costs.gross)) ?? 0;
  const feesCents =
    (moneyValueCents(asRecord(costs.eventbrite_fee)) ?? 0) +
    (moneyValueCents(asRecord(costs.payment_fee)) ?? 0);
  const taxCents = moneyValueCents(asRecord(costs.tax)) ?? 0;

  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .upsert({
      org_id: event.org_id,
      event_id: event.id,
      customer_id: customer?.id ?? null,
      source: 'eventbrite',
      external_id: orderId,
      status: orderStatusFromEventbrite(order),
      total_cents: totalCents,
      fees_cents: feesCents,
      tax_cents: taxCents,
      net_cents: Math.max(0, totalCents - feesCents - taxCents),
      currency: asString(asRecord(costs.gross)?.currency) ?? 'USD',
      placed_at: asString(order.created) ?? new Date().toISOString(),
      refunded_at: orderStatusFromEventbrite(order) === 'refunded' ? new Date().toISOString() : null,
      metadata: { eventbrite_event_id: eventbriteEventId, raw_status: asString(order.status) },
    }, {
      onConflict: 'source,external_id',
    })
    .select('id')
    .single();

  if (orderErr || !orderRow) {
    return { order_id: null, org_id: event.org_id, error: orderErr?.message ?? 'eventbrite_order_upsert_failed' };
  }

  const attendees = asArray(order.attendees).filter((row): row is JsonRecord => Boolean(asRecord(row)));
  const lineItems = [];
  for (const attendee of attendees) {
    const ticket = await upsertEventbriteTicketFromAttendee(supabase, attendee);
    if (!ticket) continue;
    const attendeeCosts = asRecord(attendee.costs) ?? {};
    const unitPrice = moneyValueCents(asRecord(attendeeCosts.gross)) ?? 0;
    lineItems.push({
      order_id: orderRow.id,
      ticket_id: ticket.id,
      description: ticket.tier,
      tier: ticket.tier,
      quantity: 1,
      unit_price_cents: unitPrice,
      total_cents: unitPrice,
    });
  }

  await supabase.from('order_line_items').delete().eq('order_id', orderRow.id);
  if (lineItems.length > 0) {
    await supabase.from('order_line_items').insert(lineItems);
  }

  return { order_id: orderRow.id, org_id: event.org_id, error: null };
}

async function resolveEventByEventbriteId(
  supabase: ReturnType<typeof getServiceRoleClient>,
  eventbriteEventId: string,
): Promise<{ id: string; org_id: string } | null> {
  const { data, error } = await supabase
    .from('events')
    .select('id, org_id')
    .filter('live_ops_config->>eventbrite_event_id', 'eq', eventbriteEventId)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[checkin-router] Eventbrite event mapping lookup failed', error);
  }

  return (data as { id: string; org_id: string } | null) ?? null;
}

async function upsertEventbriteCustomer(
  supabase: ReturnType<typeof getServiceRoleClient>,
  orgId: string,
  profile: JsonRecord,
  externalId: string,
): Promise<{ id: string } | null> {
  const email = asString(profile.email)?.toLowerCase() ?? null;
  const phone = asString(profile.cell_phone) ?? asString(profile.phone_number) ?? null;
  const firstName = asString(profile.first_name) ?? splitName(asString(profile.name)).first;
  const lastName = asString(profile.last_name) ?? splitName(asString(profile.name)).last;

  if (!email && !phone) return null;

  const existingQuery = supabase
    .from('customers')
    .select('id, external_ids')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .limit(1);

  const { data: existing } = email
    ? await existingQuery.eq('email', email).maybeSingle()
    : await existingQuery.eq('phone', phone).maybeSingle();

  const externalIds = {
    ...(asRecord(existing?.external_ids) ?? {}),
    eventbrite: externalId,
  };

  if (existing?.id) {
    const { data } = await supabase
      .from('customers')
      .update({
        email,
        phone,
        first_name: firstName,
        last_name: lastName,
        external_ids: externalIds,
        acquisition_source: 'eventbrite',
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single();
    return data as { id: string } | null;
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      org_id: orgId,
      email,
      phone,
      first_name: firstName,
      last_name: lastName,
      external_ids: externalIds,
      acquisition_source: 'eventbrite',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[checkin-router] Eventbrite customer insert failed', error);
    return null;
  }

  return data as { id: string } | null;
}

async function markWebhookProcessed(
  supabase: ReturnType<typeof getServiceRoleClient>,
  scanWebhookId: string,
  values: {
    org_id?: string | null;
    processed_check_in_id?: string | null;
    processed_order_id?: string | null;
    processing_error?: string | null;
  } = {},
) {
  await supabase
    .from('scan_webhooks')
    .update({
      processed_at: new Date().toISOString(),
      ...values,
    })
    .eq('id', scanWebhookId);
}

function ticketStateFromEventbrite(attendee: JsonRecord): 'valid' | 'used' | 'refunded' | 'transferred' | 'voided' {
  const status = asString(attendee.status)?.toLowerCase();
  if (status === 'deleted' || status === 'cancelled' || status === 'canceled') return 'voided';
  if (status === 'refunded') return 'refunded';
  if (status === 'transferred') return 'transferred';
  return 'valid';
}

function orderStatusFromEventbrite(order: JsonRecord): 'pending' | 'paid' | 'refunded' | 'partial_refund' | 'disputed' | 'failed' {
  const status = asString(order.status)?.toLowerCase();
  if (status?.includes('refund')) return status.includes('partial') ? 'partial_refund' : 'refunded';
  if (status === 'placed' || status === 'completed' || status === 'paid') return 'paid';
  if (status === 'failed' || status === 'cancelled' || status === 'canceled') return 'failed';
  return 'paid';
}

function moneyValueCents(value: JsonRecord | null): number | null {
  if (!value) return null;
  const raw = asNumber(value.value);
  if (typeof raw === 'number') return Math.round(raw);
  const major = asString(value.major_value);
  if (major) return Math.round(Number.parseFloat(major) * 100);
  return null;
}

function firstBarcode(attendee: JsonRecord): string | null {
  const barcodes = asArray(attendee.barcodes);
  const first = asRecord(barcodes[0]);
  return asString(first?.barcode) ?? asString(first?.barcode_id) ?? null;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function splitName(name: string | null): { first: string | null; last: string | null } {
  if (!name) return { first: null, last: null };
  const parts = name.trim().split(/\s+/);
  return {
    first: parts[0] ?? null,
    last: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

function json(body: RouterResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
