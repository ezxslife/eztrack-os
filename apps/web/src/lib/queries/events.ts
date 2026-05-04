/**
 * Events Mode queries — used by /live and (later) /pos, /run-of-show, /staff.
 *
 * Types are declared locally rather than against `Database['public']['Tables']`
 * because `types/database.ts` predates the L0 migrations and is queued for
 * regeneration. The cast on `eventsDb()` is the only ugly bit; it goes away
 * once database.ts is regenerated.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

/* eslint-disable @typescript-eslint/no-explicit-any */
function eventsDb(): SupabaseClient<any, 'public', any> {
  return getSupabaseBrowser() as unknown as SupabaseClient<any, 'public', any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ─── Types ──────────────────────────────────────── */

export interface EventRow {
  id: string;
  org_id: string;
  record_number: string | null;
  name: string;
  slug: string;
  is_multi_day: boolean;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  status: 'draft' | 'on_sale' | 'sold_out' | 'live' | 'past' | 'cancelled';
  cover_image_url: string | null;
  live_ops_config: Record<string, unknown>;
}

export interface EventDayRow {
  id: string;
  event_id: string;
  day_index: number;
  label: string;
  date: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  door_open_at: string | null;
  reentry_policy: 'count_once_per_day' | 'count_once_per_event' | 'count_every_scan' | 'no_reentry';
}

export interface CapacitySnapshotRow {
  id: string;
  org_id: string;
  event_id: string;
  event_day_id: string;
  recorded_at: string;
  sold: number;
  checked_in: number;
  reentries: number;
  on_floor_estimate: number;
  capacity_pct: number;
  threshold_breached: 'yellow' | 'red' | 'alert' | null;
}

export interface CheckInRow {
  id: string;
  org_id: string;
  event_id: string;
  event_day_id: string;
  ticket_id: string | null;
  customer_id: string | null;
  scanned_at: string;
  scanned_by: string | null;
  device: string | null;
  source:
    | 'eventbrite_webhook'
    | 'dice_csv'
    | 'posh_api'
    | 'stripe_webhook'
    | 'square_webhook'
    | 'shopify_webhook'
    | 'qr_scanner'
    | 'manual_lookup'
    | 'pos_auto_checkin';
  result: 'success' | 'already_scanned' | 'invalid' | 'expired' | 'wrong_day' | 'wrong_event';
  entry_number: number;
  location: string | null;
}

/* ─── Active event resolution ─────────────────────── */

/**
 * Returns the operator's currently-relevant event:
 *   1. An event with status='live', most recent first
 *   2. Otherwise an event whose [starts_at, ends_at] window contains now()
 *   3. Otherwise null
 *
 * RLS on `events` already scopes to the operator's org via is_org_member().
 */
export async function fetchActiveEvent(): Promise<EventRow | null> {
  const supabase = eventsDb();

  const liveRes = await supabase
    .from('events')
    .select('*')
    .eq('status', 'live')
    .is('deleted_at', null)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (liveRes.data) return liveRes.data as EventRow;

  const nowIso = new Date().toISOString();
  const inWindowRes = await supabase
    .from('events')
    .select('*')
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (inWindowRes.data as EventRow | null) ?? null;
}

/**
 * Resolve the current event_day via the `current_event_day(p_event_id)` RPC.
 * Returns null when no day is currently in progress.
 */
export async function fetchCurrentEventDay(eventId: string): Promise<EventDayRow | null> {
  const supabase = eventsDb();

  const rpcRes = await supabase.rpc('current_event_day', { p_event_id: eventId });
  const dayId = (rpcRes.data as string | null) ?? null;
  if (!dayId) return null;

  const { data } = await supabase
    .from('event_days')
    .select('*')
    .eq('id', dayId)
    .is('deleted_at', null)
    .maybeSingle();

  return (data as EventDayRow | null) ?? null;
}

/**
 * Latest capacity snapshot for an event_day. Snapshots are written by the
 * `refresh_capacity_snapshot` trigger on every successful check_in insert.
 */
export async function fetchLatestCapacitySnapshot(
  eventDayId: string,
): Promise<CapacitySnapshotRow | null> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('capacity_snapshots')
    .select('*')
    .eq('event_day_id', eventDayId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as CapacitySnapshotRow | null) ?? null;
}

/**
 * Last N successful check-ins for an event_day, ordered newest-first.
 * Used by the /live recent-scans feed.
 */
export async function fetchRecentCheckIns(
  eventDayId: string,
  limit = 20,
): Promise<CheckInRow[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('check_ins')
    .select('*')
    .eq('event_day_id', eventDayId)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  return (data as CheckInRow[] | null) ?? [];
}

/**
 * All scans within the last `windowMinutes` for an event_day.
 * Used by the door-flow chart on /live to bucket-by-minute.
 */
export async function fetchScansSince(
  eventDayId: string,
  windowMinutes = 60,
): Promise<CheckInRow[]> {
  const supabase = eventsDb();
  const sinceIso = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { data } = await supabase
    .from('check_ins')
    .select('*')
    .eq('event_day_id', eventDayId)
    .gte('scanned_at', sinceIso)
    .order('scanned_at', { ascending: true });

  return (data as CheckInRow[] | null) ?? [];
}

/**
 * All event_days for a given event, ordered by day_index. Used by the
 * multi-day day picker in /live's header.
 */
export async function fetchEventDays(eventId: string): Promise<EventDayRow[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('event_days')
    .select('*')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('day_index', { ascending: true });

  return (data as EventDayRow[] | null) ?? [];
}

export interface DayRollupRow {
  event_day_id: string;
  day_index: number;
  label: string;
  date: string;
  capacity: number;
  checked_in: number;
  capacity_pct: number;
  threshold_breached: 'yellow' | 'red' | 'alert' | null;
}

/**
 * Per-day rollup across an event — used by the multi-day rolling totals card.
 * Reads the latest capacity_snapshot per event_day; falls back to zeros if no
 * snapshot has been written yet (no scans on that day).
 */
export async function fetchEventRollup(eventId: string): Promise<DayRollupRow[]> {
  const supabase = eventsDb();
  const days = await fetchEventDays(eventId);
  if (days.length === 0) return [];

  const dayIds = days.map((d) => d.id);
  const { data } = await supabase
    .from('capacity_snapshots')
    .select('event_day_id, recorded_at, checked_in, capacity_pct, threshold_breached')
    .in('event_day_id', dayIds)
    .order('recorded_at', { ascending: false });

  type RawSnap = {
    event_day_id: string;
    recorded_at: string;
    checked_in: number;
    capacity_pct: number;
    threshold_breached: 'yellow' | 'red' | 'alert' | null;
  };
  const latestByDay = new Map<string, RawSnap>();
  for (const row of (data as RawSnap[] | null) ?? []) {
    if (!latestByDay.has(row.event_day_id)) latestByDay.set(row.event_day_id, row);
  }

  return days.map((d) => {
    const snap = latestByDay.get(d.id);
    return {
      event_day_id: d.id,
      day_index: d.day_index,
      label: d.label,
      date: d.date,
      capacity: d.capacity,
      checked_in: snap?.checked_in ?? 0,
      capacity_pct: snap?.capacity_pct ?? 0,
      threshold_breached: snap?.threshold_breached ?? null,
    };
  });
}

/* ─── Helpers ─────────────────────────────────────── */

export function thresholdColor(snapshot: CapacitySnapshotRow | null): {
  bg: string;
  fg: string;
  label: string;
} {
  const breach = snapshot?.threshold_breached ?? null;
  switch (breach) {
    case 'alert':
      return { bg: '#EF4444', fg: '#fff', label: 'AT CAPACITY' };
    case 'red':
      return { bg: '#F97316', fg: '#fff', label: 'CRITICAL' };
    case 'yellow':
      return { bg: '#F59E0B', fg: '#1f2937', label: 'WARNING' };
    default:
      return { bg: '#34C759', fg: '#fff', label: 'OK' };
  }
}

/* ─── Operator workflows (events list, create, manual scan) ─── */

/**
 * Returns the current operator's org_id by reading their profiles row.
 * Returns null if the session is anonymous or the profile row is missing.
 */
export async function fetchCurrentOrgId(): Promise<string | null> {
  const supabase = eventsDb();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle();
  return (data as { org_id: string } | null)?.org_id ?? null;
}

/**
 * List events for the operator's org. RLS scopes automatically; ordering
 * surfaces the most recent / live events first.
 */
export async function fetchEvents(): Promise<EventRow[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('events')
    .select('*')
    .is('deleted_at', null)
    .order('starts_at', { ascending: false })
    .limit(50);
  return (data as EventRow[] | null) ?? [];
}

export interface CreateEventDayInput {
  label: string;
  date: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  reentry_policy?: EventDayRow['reentry_policy'];
}

export interface CreateEventInput {
  org_id: string;
  name: string;
  slug: string;
  capacity: number;
  status?: EventRow['status'];
  /** Required: at least one event_day. The event's outer starts_at/ends_at are
   * inferred from the earliest/latest day. is_multi_day flips automatically. */
  days: CreateEventDayInput[];
}

/**
 * Insert an event + N event_days. The event's window + capacity wrap the days.
 * `is_multi_day` is set automatically by the trigger when days.length > 1.
 */
export async function createEvent(input: CreateEventInput): Promise<EventRow> {
  if (input.days.length === 0) throw new Error('event_must_have_at_least_one_day');
  const supabase = eventsDb();

  const sorted = [...input.days].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const startsAt = sorted[0].starts_at;
  const endsAt = sorted[sorted.length - 1].ends_at;

  const { data: ev, error: evErr } = await supabase
    .from('events')
    .insert({
      org_id: input.org_id,
      name: input.name,
      slug: input.slug,
      starts_at: startsAt,
      ends_at: endsAt,
      capacity: input.capacity,
      status: input.status ?? 'draft',
      is_multi_day: sorted.length > 1,
    })
    .select('*')
    .single();
  if (evErr || !ev) throw new Error(evErr?.message ?? 'event_insert_failed');

  const dayRows = sorted.map((d, i) => ({
    event_id: (ev as EventRow).id,
    day_index: i + 1,
    label: d.label,
    date: d.date,
    starts_at: d.starts_at,
    ends_at: d.ends_at,
    capacity: d.capacity,
    reentry_policy: d.reentry_policy ?? 'count_once_per_day',
  }));
  const { error: dayErr } = await supabase.from('event_days').insert(dayRows);
  if (dayErr) throw new Error(dayErr.message);

  return ev as EventRow;
}

/* ─── /live quick actions ────────────────────────── */

export async function pauseEventSales(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();
  const { error } = await supabase
    .from('events')
    .update({ status: 'sold_out' })
    .eq('id', eventId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function pageStaffBroadcast(args: {
  org_id: string;
  event_id: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();
  const { error } = await supabase.from('alerts').insert({
    org_id: args.org_id,
    alert_type: 'staff_page',
    title: 'Operator broadcast',
    message: args.message,
    severity: 'medium',
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ─── Run-of-show clone-day ──────────────────────── */

/**
 * Clone the timeline + checklist from a source run_of_show into a target day.
 * If the target day has no run_of_show row yet, one is created. Slot times are
 * shifted forward by the day-delta between source and target dates so a Day-1
 * 8pm slot becomes a Day-2 8pm slot.
 */
export async function cloneRunOfShowDay(args: {
  source_ros_id: string;
  source_event_day_id: string;
  target_event_day_id: string;
  target_event_id: string;
  org_id: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();

  const [{ data: srcDay }, { data: tgtDay }] = await Promise.all([
    supabase.from('event_days').select('starts_at, ends_at, date').eq('id', args.source_event_day_id).maybeSingle(),
    supabase.from('event_days').select('starts_at, ends_at, date').eq('id', args.target_event_day_id).maybeSingle(),
  ]);
  if (!srcDay || !tgtDay) return { ok: false, error: 'event_day_not_found' };

  const deltaMs =
    new Date((tgtDay as { date: string }).date).getTime() -
    new Date((srcDay as { date: string }).date).getTime();

  const target = await fetchOrCreateRunOfShow(args.org_id, args.target_event_id, args.target_event_day_id);

  const sourceSlots = await fetchRosSlots(args.source_ros_id);
  if (sourceSlots.length > 0) {
    const slotRows = sourceSlots.map((s) => ({
      ros_id: target.id,
      label: s.label,
      description: s.description,
      starts_at: new Date(new Date(s.starts_at).getTime() + deltaMs).toISOString(),
      ends_at: new Date(new Date(s.ends_at).getTime() + deltaMs).toISOString(),
      display_order: s.display_order,
    }));
    const { error } = await supabase.from('ros_slots').insert(slotRows);
    if (error) return { ok: false, error: error.message };
  }

  const sourceChecklist = await fetchChecklistItems(args.source_ros_id);
  if (sourceChecklist.length > 0) {
    const items = sourceChecklist.map((c) => ({
      ros_id: target.id,
      label: c.label,
      display_order: c.display_order,
    }));
    const { error } = await supabase.from('checklist_items').insert(items);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

export interface TicketSearchResult {
  ticket_id: string;
  event_id: string;
  tier: string;
  state: string;
  external_id: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_email: string | null;
}

/**
 * Search tickets within an event by external_id or customer name/email.
 * Used by the manual-scan / will-call lookup widget on /live. Two parallel
 * queries (one for external_id, one via customer-side filter) are merged
 * and de-duplicated client-side because Postgrest's foreign-table OR is
 * awkward.
 */
export async function searchTickets(
  eventId: string,
  query: string,
  limit = 10,
): Promise<TicketSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const supabase = eventsDb();

  const select = `
    id, event_id, tier, state, external_id,
    customers ( first_name, last_name, email )
  `;

  const [byExternal, byCustomer] = await Promise.all([
    supabase
      .from('tickets')
      .select(select)
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .ilike('external_id', `%${trimmed}%`)
      .limit(limit),
    supabase
      .from('tickets')
      .select(select)
      .eq('event_id', eventId)
      .is('deleted_at', null)
      .or(
        `first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`,
        { foreignTable: 'customers' },
      )
      .limit(limit),
  ]);

  type Raw = {
    id: string;
    event_id: string;
    tier: string;
    state: string;
    external_id: string | null;
    customers: { first_name: string | null; last_name: string | null; email: string | null } | null;
  };
  const merged = new Map<string, Raw>();
  for (const row of [
    ...((byExternal.data as Raw[] | null) ?? []),
    ...((byCustomer.data as Raw[] | null) ?? []),
  ]) {
    if (!merged.has(row.id)) merged.set(row.id, row);
  }
  return Array.from(merged.values()).slice(0, limit).map((t) => ({
    ticket_id: t.id,
    event_id: t.event_id,
    tier: t.tier,
    state: t.state,
    external_id: t.external_id,
    customer_first_name: t.customers?.first_name ?? null,
    customer_last_name: t.customers?.last_name ?? null,
    customer_email: t.customers?.email ?? null,
  }));
}

/**
 * Trigger a manual check-in via the canonical `checkin-router` Edge Function.
 * The router applies re-entry policy, picks the current event_day, and writes
 * the canonical check_ins row. Direct-scan path — no 3rd-party platform needed.
 */
export async function triggerManualCheckIn(args: {
  org_id: string;
  event_id: string;
  ticket_id: string;
  scanned_by?: string;
  device?: string;
  location?: string;
}): Promise<{
  ok: boolean;
  result?: 'success' | 'already_scanned' | 'invalid' | 'expired' | 'wrong_day' | 'wrong_event';
  check_in_id?: string;
  ticket?: { id: string; tier: string };
  entry_number?: number;
  error?: string;
}> {
  const supabase = eventsDb();
  const { data, error } = await supabase.functions.invoke('checkin-router', {
    body: { source: 'manual_lookup', ...args },
  });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: 'no_response' }) as {
    ok: boolean;
    result?: 'success' | 'already_scanned' | 'invalid' | 'expired' | 'wrong_day' | 'wrong_event';
    check_in_id?: string;
    ticket?: { id: string; tier: string };
    entry_number?: number;
    error?: string;
  };
}

/* ─── Wall display pairing (operator side) ──────── */

export interface WallDisplaySessionRow {
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
  created_at: string;
}

export async function fetchWallDisplaySessions(
  eventId?: string,
): Promise<WallDisplaySessionRow[]> {
  const supabase = eventsDb();
  let q = supabase
    .from('wall_display_sessions')
    .select('*')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (eventId) q = q.eq('event_id', eventId);
  const { data } = await q;
  return (data as WallDisplaySessionRow[] | null) ?? [];
}

export async function createWallDisplayCode(args: {
  event_id: string;
  device_label?: string;
  code_ttl_minutes?: number;
}): Promise<{
  ok: boolean;
  pairing_code?: string;
  expires_at?: string;
  event?: { id: string; name: string; status: string };
  error?: string;
}> {
  const supabase = eventsDb();
  const { data, error } = await supabase.functions.invoke('wall-display-pairing', {
    body: { action: 'create', ...args },
  });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: 'no_response' }) as {
    ok: boolean;
    pairing_code?: string;
    expires_at?: string;
    event?: { id: string; name: string; status: string };
    error?: string;
  };
}

export async function revokeWallDisplaySession(
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();
  const { data, error } = await supabase.functions.invoke('wall-display-pairing', {
    body: { action: 'revoke', session_id: sessionId },
  });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: 'no_response' }) as { ok: boolean; error?: string };
}

/* ─── POS (cash mode) ────────────────────────────── */

export interface PosTier {
  name: string;
  price_cents: number;
}

/**
 * Resolve the POS tier list for an event. Reads `events.live_ops_config.pos_tiers`
 * if present; otherwise falls back to a sensible default so /pos works on any
 * event without operator config first.
 */
export function tierDefinitionsFor(event: EventRow): PosTier[] {
  const cfg = (event.live_ops_config ?? {}) as { pos_tiers?: PosTier[] };
  const tiers = Array.isArray(cfg.pos_tiers) ? cfg.pos_tiers : null;
  if (tiers && tiers.length > 0) {
    return tiers.filter((t) => typeof t.name === 'string' && Number.isFinite(t.price_cents));
  }
  return [
    { name: 'GA', price_cents: 2500 },
    { name: 'VIP', price_cents: 5000 },
  ];
}

export interface PosSaleResult {
  ok: boolean;
  order_id?: string;
  ticket_id?: string;
  check_in_id?: string;
  result?:
    | 'success'
    | 'already_scanned'
    | 'invalid'
    | 'expired'
    | 'wrong_day'
    | 'wrong_event';
  error?: string;
}

/**
 * Cash-mode walk-up sale that auto-checks-in the customer. Three writes
 * happen client-side under RLS, then the canonical checkin-router writes the
 * check_in:
 *   1. tickets row (source='pos', state='valid')
 *   2. orders row (source='pos_cash', status='paid')
 *   3. order_line_items row linking order ↔ ticket
 *   4. POST /functions/v1/checkin-router source='pos_auto_checkin'
 *
 * The auto-checkin is gated by `events.live_ops_config.auto_checkin_at_pos`
 * (default true). When false, the function returns the order/ticket but
 * skips the check_in dispatch — e.g. for advance sales that shouldn't
 * count as door entries yet.
 */
export async function createPosSale(args: {
  org_id: string;
  event_id: string;
  tier: string;
  price_cents: number;
  email?: string | null;
  device?: string | null;
}): Promise<PosSaleResult> {
  const supabase = eventsDb();

  // 1. Fetch event (for live_ops_config + auto-checkin flag)
  const evRes = await supabase
    .from('events')
    .select('live_ops_config')
    .eq('id', args.event_id)
    .maybeSingle();
  const liveOpsConfig = (evRes.data as { live_ops_config?: Record<string, unknown> } | null)
    ?.live_ops_config ?? {};
  const autoCheckin =
    (liveOpsConfig as { auto_checkin_at_pos?: boolean }).auto_checkin_at_pos !== false;

  // 2. Optional customer (only if email provided)
  let customerId: string | null = null;
  if (args.email && args.email.includes('@')) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('org_id', args.org_id)
      .eq('email', args.email.trim().toLowerCase())
      .maybeSingle();
    if ((existing as { id: string } | null)?.id) {
      customerId = (existing as { id: string }).id;
    } else {
      const { data: created } = await supabase
        .from('customers')
        .insert({ org_id: args.org_id, email: args.email.trim().toLowerCase() })
        .select('id')
        .single();
      customerId = (created as { id: string } | null)?.id ?? null;
    }
  }

  // 3. Ticket
  const ticketExternalId = `pos-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .insert({
      org_id: args.org_id,
      event_id: args.event_id,
      customer_id: customerId,
      source: 'pos',
      tier: args.tier,
      state: 'valid',
      external_id: ticketExternalId,
      price_cents: args.price_cents,
    })
    .select('id')
    .single();
  if (ticketErr || !ticket) return { ok: false, error: ticketErr?.message ?? 'ticket_insert_failed' };
  const ticketId = (ticket as { id: string }).id;

  // 4. Order
  const orderExternalId = `pos-cash-${Date.now()}`;
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      org_id: args.org_id,
      event_id: args.event_id,
      customer_id: customerId,
      source: 'pos_cash',
      external_id: orderExternalId,
      status: 'paid',
      total_cents: args.price_cents,
      net_cents: args.price_cents,
      device: args.device ?? null,
    })
    .select('id')
    .single();
  if (orderErr || !order) return { ok: false, error: orderErr?.message ?? 'order_insert_failed' };
  const orderId = (order as { id: string }).id;

  // 5. Line item
  await supabase.from('order_line_items').insert({
    order_id: orderId,
    ticket_id: ticketId,
    description: `${args.tier} (cash)`,
    tier: args.tier,
    quantity: 1,
    unit_price_cents: args.price_cents,
    total_cents: args.price_cents,
  });

  if (!autoCheckin) {
    return { ok: true, order_id: orderId, ticket_id: ticketId };
  }

  // 6. Auto-checkin via canonical router
  const { data: routerRes, error: routerErr } = await supabase.functions.invoke('checkin-router', {
    body: {
      source: 'pos_auto_checkin',
      org_id: args.org_id,
      event_id: args.event_id,
      ticket_id: ticketId,
      device: args.device ?? 'POS',
      location: 'POS auto check-in',
    },
  });
  if (routerErr) {
    return {
      ok: true,
      order_id: orderId,
      ticket_id: ticketId,
      error: `auto_checkin_failed: ${routerErr.message}`,
    };
  }
  const r = (routerRes ?? {}) as {
    ok?: boolean;
    result?: PosSaleResult['result'];
    check_in_id?: string;
    error?: string;
  };
  return {
    ok: true,
    order_id: orderId,
    ticket_id: ticketId,
    check_in_id: r.check_in_id,
    result: r.result,
    error: r.error,
  };
}

/* ─── Run-of-show ────────────────────────────────── */

export interface RunOfShowRow {
  id: string;
  org_id: string;
  event_id: string;
  event_day_id: string;
  published_to_staff_at: string | null;
  briefing_id: string | null;
  notes: string | null;
}

export interface RosSlotRow {
  id: string;
  ros_id: string;
  starts_at: string;
  ends_at: string;
  label: string;
  description: string | null;
  display_order: number;
}

export interface ChecklistItemRow {
  id: string;
  ros_id: string;
  label: string;
  display_order: number;
  completed_at: string | null;
  completed_by: string | null;
}

export async function fetchOrCreateRunOfShow(
  orgId: string,
  eventId: string,
  eventDayId: string,
): Promise<RunOfShowRow> {
  const supabase = eventsDb();
  const { data: existing } = await supabase
    .from('run_of_show')
    .select('*')
    .eq('event_day_id', eventDayId)
    .is('deleted_at', null)
    .maybeSingle();
  if (existing) return existing as RunOfShowRow;

  const { data: created, error } = await supabase
    .from('run_of_show')
    .insert({ org_id: orgId, event_id: eventId, event_day_id: eventDayId })
    .select('*')
    .single();
  if (error || !created) throw new Error(error?.message ?? 'ros_create_failed');
  return created as RunOfShowRow;
}

export async function fetchRosSlots(rosId: string): Promise<RosSlotRow[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('ros_slots')
    .select('*')
    .eq('ros_id', rosId)
    .order('starts_at', { ascending: true });
  return (data as RosSlotRow[] | null) ?? [];
}

export async function addRosSlot(args: {
  ros_id: string;
  starts_at: string;
  ends_at: string;
  label: string;
  description?: string | null;
}): Promise<RosSlotRow> {
  const supabase = eventsDb();
  const { data, error } = await supabase
    .from('ros_slots')
    .insert({ ...args, description: args.description ?? null })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'slot_insert_failed');
  return data as RosSlotRow;
}

export async function deleteRosSlot(id: string): Promise<void> {
  const supabase = eventsDb();
  await supabase.from('ros_slots').delete().eq('id', id);
}

export async function fetchChecklistItems(rosId: string): Promise<ChecklistItemRow[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('ros_id', rosId)
    .order('display_order', { ascending: true });
  return (data as ChecklistItemRow[] | null) ?? [];
}

export async function addChecklistItem(rosId: string, label: string): Promise<ChecklistItemRow> {
  const supabase = eventsDb();
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({ ros_id: rosId, label })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'checklist_insert_failed');
  return data as ChecklistItemRow;
}

export async function toggleChecklistItem(
  id: string,
  complete: boolean,
  userId: string | null,
): Promise<void> {
  const supabase = eventsDb();
  await supabase
    .from('checklist_items')
    .update({
      completed_at: complete ? new Date().toISOString() : null,
      completed_by: complete ? userId : null,
    })
    .eq('id', id);
}

export async function publishRunOfShow(rosId: string): Promise<void> {
  const supabase = eventsDb();
  await supabase
    .from('run_of_show')
    .update({ published_to_staff_at: new Date().toISOString() })
    .eq('id', rosId);
}

/* ─── Staff Console ──────────────────────────────── */

export interface PersonnelLite {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
}

export interface ShiftAssignmentRow {
  id: string;
  org_id: string;
  event_day_id: string;
  personnel_id: string;
  role: string;
  starts_at: string;
  ends_at: string;
  status:
    | 'scheduled'
    | 'en_route'
    | 'on_shift'
    | 'break'
    | 'off_shift'
    | 'no_show';
  geo_verified: boolean;
}

export interface DispatchLite {
  id: string;
  priority: string;
  status: string;
  description: string | null;
  created_at: string;
}

export async function fetchPersonnel(): Promise<PersonnelLite[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, status, avatar_url')
    .is('deleted_at', null)
    .order('full_name', { ascending: true });
  return (data as PersonnelLite[] | null) ?? [];
}

export async function fetchShiftAssignments(eventDayId: string): Promise<ShiftAssignmentRow[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('shift_assignments')
    .select('*')
    .eq('event_day_id', eventDayId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });
  return (data as ShiftAssignmentRow[] | null) ?? [];
}

export async function fetchOpenDispatches(): Promise<DispatchLite[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('dispatches')
    .select('id, priority, status, description, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data as DispatchLite[] | null) ?? [];
}

/* ─── Will-call (reframed Visitors + tickets) ────── */

export interface WillCallEntry {
  ticket_id: string;
  tier: string;
  state: string;
  pickup_required: boolean;
  wristbanded_at_event_day_id: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_email: string | null;
  external_id: string | null;
}

export async function fetchWillCall(eventId: string): Promise<WillCallEntry[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('tickets')
    .select(`
      id, tier, state, pickup_required, wristbanded_at_event_day_id, external_id,
      customers ( first_name, last_name, email )
    `)
    .eq('event_id', eventId)
    .eq('pickup_required', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  type Raw = {
    id: string;
    tier: string;
    state: string;
    pickup_required: boolean;
    wristbanded_at_event_day_id: string | null;
    external_id: string | null;
    customers: { first_name: string | null; last_name: string | null; email: string | null } | null;
  };
  return ((data as Raw[] | null) ?? []).map((r) => ({
    ticket_id: r.id,
    tier: r.tier,
    state: r.state,
    pickup_required: r.pickup_required,
    wristbanded_at_event_day_id: r.wristbanded_at_event_day_id,
    external_id: r.external_id,
    customer_first_name: r.customers?.first_name ?? null,
    customer_last_name: r.customers?.last_name ?? null,
    customer_email: r.customers?.email ?? null,
  }));
}

export async function markWristbanded(ticketId: string, eventDayId: string): Promise<void> {
  const supabase = eventsDb();
  await supabase
    .from('tickets')
    .update({ wristbanded_at_event_day_id: eventDayId, state: 'used' })
    .eq('id', ticketId);
}

/* ─── VIP / Deny (reframed Patrons) ──────────────── */

export interface PatronRow {
  id: string;
  org_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  flag: string;
  notes: string | null;
  created_at: string;
}

export async function fetchPatrons(flagFilter?: string[]): Promise<PatronRow[]> {
  const supabase = eventsDb();
  let q = supabase
    .from('patrons')
    .select('id, org_id, first_name, last_name, email, phone, flag, notes, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (flagFilter && flagFilter.length > 0) q = q.in('flag', flagFilter);
  const { data } = await q;
  return (data as PatronRow[] | null) ?? [];
}

/* ─── Event detail (view + edit) ─────────────────── */

export async function fetchEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function updateEventLiveOpsConfig(
  eventId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();
  const { data: ev } = await supabase
    .from('events')
    .select('live_ops_config')
    .eq('id', eventId)
    .maybeSingle();
  const current = ((ev as { live_ops_config?: Record<string, unknown> } | null)?.live_ops_config ?? {});
  const next = { ...current, ...patch };
  const { error } = await supabase
    .from('events')
    .update({ live_ops_config: next })
    .eq('id', eventId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateEventStatus(
  eventId: string,
  status: EventRow['status'],
): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();
  const { error } = await supabase.from('events').update({ status }).eq('id', eventId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function addEventDay(args: {
  event_id: string;
  label: string;
  date: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  reentry_policy?: EventDayRow['reentry_policy'];
}): Promise<{ ok: boolean; day?: EventDayRow; error?: string }> {
  const supabase = eventsDb();
  const existing = await fetchEventDays(args.event_id);
  const nextIndex = existing.length === 0 ? 1 : Math.max(...existing.map((d) => d.day_index)) + 1;
  const { data, error } = await supabase
    .from('event_days')
    .insert({
      event_id: args.event_id,
      day_index: nextIndex,
      label: args.label,
      date: args.date,
      starts_at: args.starts_at,
      ends_at: args.ends_at,
      capacity: args.capacity,
      reentry_policy: args.reentry_policy ?? 'count_once_per_day',
    })
    .select('*')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'day_insert_failed' };
  return { ok: true, day: data as EventDayRow };
}

export async function updateEventDay(
  dayId: string,
  patch: Partial<Pick<EventDayRow, 'label' | 'capacity' | 'starts_at' | 'ends_at' | 'reentry_policy'>>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();
  const { error } = await supabase.from('event_days').update(patch).eq('id', dayId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteEventDay(
  dayId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = eventsDb();
  const { error } = await supabase
    .from('event_days')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dayId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ─── Incidents (events-mode quick create) ───────── */

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentRow {
  id: string;
  org_id: string;
  record_number: string;
  incident_type: string;
  severity: IncidentSeverity;
  status: string;
  synopsis: string | null;
  description: string | null;
  reported_by: string | null;
  event_id: string | null;
  event_day_id: string | null;
  created_at: string;
}

export const INCIDENT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'medical', label: 'Medical' },
  { value: 'security', label: 'Security' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'operations', label: 'Operations' },
  { value: 'patron_dispute', label: 'Patron dispute' },
  { value: 'lost_found', label: 'Lost & found' },
  { value: 'other', label: 'Other' },
];

export async function createEventIncident(args: {
  org_id: string;
  event_id: string;
  event_day_id: string | null;
  incident_type: string;
  severity: IncidentSeverity;
  synopsis: string;
  description?: string;
  reported_by?: string;
}): Promise<{ ok: boolean; incident_id?: string; record_number?: string; error?: string }> {
  const supabase = eventsDb();

  const { data: rec, error: recErr } = await supabase.rpc('next_record_number', {
    p_org_id: args.org_id,
    p_prefix: 'INC',
  });
  if (recErr) return { ok: false, error: recErr.message };
  const recordNumber = rec as unknown as string;

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      org_id: args.org_id,
      record_number: recordNumber,
      incident_type: args.incident_type,
      severity: args.severity,
      status: 'open',
      synopsis: args.synopsis,
      description: args.description ?? null,
      reported_by: args.reported_by ?? null,
      event_id: args.event_id,
      event_day_id: args.event_day_id,
    })
    .select('id, record_number')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'incident_insert_failed' };
  return {
    ok: true,
    incident_id: (data as { id: string }).id,
    record_number: (data as { record_number: string }).record_number,
  };
}

export async function fetchEventIncidents(eventId: string): Promise<IncidentRow[]> {
  const supabase = eventsDb();
  const { data } = await supabase
    .from('incidents')
    .select('id, org_id, record_number, incident_type, severity, status, synopsis, description, reported_by, event_id, event_day_id, created_at')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data as IncidentRow[] | null) ?? [];
}

/* ─── Post-event report (aggregator) ─────────────── */

export interface EventReport {
  totals: {
    tickets_sold: number;
    tickets_used: number;
    check_ins: number;
    re_entries: number;
    pos_revenue_cents: number;
    pos_orders: number;
    incidents_open: number;
    incidents_closed: number;
  };
  check_ins_by_source: Record<string, number>;
  incidents_by_severity: Record<string, number>;
  by_day: Array<{
    event_day_id: string;
    label: string;
    day_index: number;
    capacity: number;
    checked_in: number;
    pct: number;
  }>;
}

/**
 * Aggregator for the per-event report card. All counts come from existing
 * tables — no separate report-cache infrastructure needed in v1. Acceptable
 * latency since it's an operator-triggered view, not a hot path.
 */
export async function fetchEventReport(eventId: string): Promise<EventReport> {
  const supabase = eventsDb();

  const [
    ticketsRes,
    checkInsRes,
    ordersRes,
    incidentsRes,
    rollupRes,
  ] = await Promise.all([
    supabase
      .from('tickets')
      .select('id, state')
      .eq('event_id', eventId)
      .is('deleted_at', null),
    supabase
      .from('check_ins')
      .select('id, source, result, entry_number')
      .eq('event_id', eventId),
    supabase
      .from('orders')
      .select('id, total_cents, source, status')
      .eq('event_id', eventId)
      .is('deleted_at', null),
    supabase
      .from('incidents')
      .select('id, severity, status')
      .eq('event_id', eventId)
      .is('deleted_at', null),
    fetchEventRollup(eventId),
  ]);

  type TicketLite = { id: string; state: string };
  type CheckInLite = { id: string; source: string; result: string; entry_number: number };
  type OrderLite = { id: string; total_cents: number; source: string; status: string };
  type IncidentLite = { id: string; severity: string; status: string };

  const tickets = (ticketsRes.data as TicketLite[] | null) ?? [];
  const checkIns = (checkInsRes.data as CheckInLite[] | null) ?? [];
  const orders = (ordersRes.data as OrderLite[] | null) ?? [];
  const incidents = (incidentsRes.data as IncidentLite[] | null) ?? [];

  const ticketsSold = tickets.filter((t) => t.state === 'valid' || t.state === 'used').length;
  const ticketsUsed = tickets.filter((t) => t.state === 'used').length;

  const successfulCheckIns = checkIns.filter((c) => c.result === 'success').length;
  const reentries = checkIns.filter(
    (c) => c.result === 'already_scanned' || (c.result === 'success' && c.entry_number > 1),
  ).length;

  const checkInsBySource: Record<string, number> = {};
  for (const c of checkIns) {
    if (c.result !== 'success' && c.result !== 'already_scanned') continue;
    checkInsBySource[c.source] = (checkInsBySource[c.source] ?? 0) + 1;
  }

  const posOrders = orders.filter(
    (o) =>
      o.source.startsWith('pos_') &&
      (o.status === 'paid' || o.status === 'partial_refund'),
  );
  const posRevenueCents = posOrders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0);

  const incidentsOpen = incidents.filter(
    (i) =>
      i.status !== 'closed' && i.status !== 'completed' && i.status !== 'archived',
  ).length;
  const incidentsClosed = incidents.length - incidentsOpen;

  const incidentsBySeverity: Record<string, number> = {};
  for (const i of incidents) {
    incidentsBySeverity[i.severity] = (incidentsBySeverity[i.severity] ?? 0) + 1;
  }

  const byDay = rollupRes.map((d) => ({
    event_day_id: d.event_day_id,
    label: d.label,
    day_index: d.day_index,
    capacity: d.capacity,
    checked_in: d.checked_in,
    pct: d.capacity > 0 ? Math.round((d.checked_in / d.capacity) * 100) : 0,
  }));

  return {
    totals: {
      tickets_sold: ticketsSold,
      tickets_used: ticketsUsed,
      check_ins: successfulCheckIns,
      re_entries: reentries,
      pos_revenue_cents: posRevenueCents,
      pos_orders: posOrders.length,
      incidents_open: incidentsOpen,
      incidents_closed: incidentsClosed,
    },
    check_ins_by_source: checkInsBySource,
    incidents_by_severity: incidentsBySeverity,
    by_day: byDay,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function sourceLabel(source: CheckInRow['source']): string {
  switch (source) {
    case 'eventbrite_webhook':
      return 'EB';
    case 'dice_csv':
      return 'DICE';
    case 'posh_api':
      return 'POSH';
    case 'stripe_webhook':
      return 'STRIPE';
    case 'square_webhook':
      return 'SQ';
    case 'shopify_webhook':
      return 'SHOP';
    case 'qr_scanner':
      return 'SCAN';
    case 'manual_lookup':
      return 'MANUAL';
    case 'pos_auto_checkin':
      return 'POS';
  }
}
