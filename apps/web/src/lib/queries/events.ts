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

export interface CreateEventInput {
  org_id: string;
  name: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status?: EventRow['status'];
  reentry_policy?: EventDayRow['reentry_policy'];
}

/**
 * Insert an event + a single event_day matching the event window. Multi-day
 * editor lands in L3.
 */
export async function createEvent(input: CreateEventInput): Promise<EventRow> {
  const supabase = eventsDb();
  const { data: ev, error: evErr } = await supabase
    .from('events')
    .insert({
      org_id: input.org_id,
      name: input.name,
      slug: input.slug,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      capacity: input.capacity,
      status: input.status ?? 'draft',
      is_multi_day: false,
    })
    .select('*')
    .single();
  if (evErr || !ev) throw new Error(evErr?.message ?? 'event_insert_failed');

  const { error: dayErr } = await supabase.from('event_days').insert({
    event_id: (ev as EventRow).id,
    day_index: 1,
    label: 'Tonight',
    date: new Date(input.starts_at).toISOString().slice(0, 10),
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    capacity: input.capacity,
    reentry_policy: input.reentry_policy ?? 'count_once_per_day',
  });
  if (dayErr) throw new Error(dayErr.message);

  return ev as EventRow;
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
