/**
 * Events Mode queries for the Expo mobile shell. Mirrors apps/web/src/lib/queries/events.ts
 * read-only paths (no createEvent / no manual lookup; mobile is read-only + POS in v1).
 *
 * Types are local because the project's Database type predates the L0 migrations.
 */

import { getSupabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/* eslint-disable @typescript-eslint/no-explicit-any */
function db(): SupabaseClient<any, 'public', any> {
  return getSupabase() as unknown as SupabaseClient<any, 'public', any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface EventRow {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  is_multi_day: boolean;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  status: string;
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
}

export interface CapacitySnapshotRow {
  id: string;
  event_day_id: string;
  recorded_at: string;
  sold: number;
  checked_in: number;
  reentries: number;
  capacity_pct: number | string;
  threshold_breached: 'yellow' | 'red' | 'alert' | null;
}

export interface CheckInRow {
  id: string;
  org_id: string;
  event_id: string;
  event_day_id: string;
  scanned_at: string;
  source: string;
  result: string;
  entry_number: number;
  location: string | null;
}

export async function fetchActiveEvent(): Promise<EventRow | null> {
  const supabase = db();
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
  const inWindow = await supabase
    .from('events')
    .select('*')
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (inWindow.data as EventRow | null) ?? null;
}

export async function fetchCurrentEventDay(eventId: string): Promise<EventDayRow | null> {
  const supabase = db();
  const rpc = await supabase.rpc('current_event_day', { p_event_id: eventId });
  const dayId = (rpc.data as string | null) ?? null;
  if (!dayId) return null;
  const { data } = await supabase
    .from('event_days')
    .select('*')
    .eq('id', dayId)
    .is('deleted_at', null)
    .maybeSingle();
  return (data as EventDayRow | null) ?? null;
}

export async function fetchLatestSnapshot(eventDayId: string): Promise<CapacitySnapshotRow | null> {
  const supabase = db();
  const { data } = await supabase
    .from('capacity_snapshots')
    .select('*')
    .eq('event_day_id', eventDayId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CapacitySnapshotRow | null) ?? null;
}

export async function fetchRecentCheckIns(eventDayId: string, limit = 12): Promise<CheckInRow[]> {
  const supabase = db();
  const { data } = await supabase
    .from('check_ins')
    .select('*')
    .eq('event_day_id', eventDayId)
    .order('scanned_at', { ascending: false })
    .limit(limit);
  return (data as CheckInRow[] | null) ?? [];
}

export interface PosTier {
  name: string;
  price_cents: number;
}

export function tierDefinitionsFor(event: EventRow): PosTier[] {
  const cfg = event.live_ops_config as { pos_tiers?: PosTier[] } | undefined;
  if (cfg?.pos_tiers && Array.isArray(cfg.pos_tiers) && cfg.pos_tiers.length > 0) {
    return cfg.pos_tiers;
  }
  return [
    { name: 'GA', price_cents: 2500 },
    { name: 'VIP', price_cents: 5000 },
  ];
}

/* ─── Staff Console ──────────────────────────────── */

export interface PersonnelLite {
  id: string;
  full_name: string;
  role: string;
  status: string;
}

export interface ShiftAssignmentRow {
  id: string;
  event_day_id: string;
  personnel_id: string;
  role: string;
  starts_at: string;
  ends_at: string;
  status: string;
}

export interface DispatchLite {
  id: string;
  priority: string;
  status: string;
  description: string | null;
  created_at: string;
}

export async function fetchPersonnel(): Promise<PersonnelLite[]> {
  const supabase = db();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, status')
    .is('deleted_at', null)
    .order('full_name', { ascending: true });
  return (data as PersonnelLite[] | null) ?? [];
}

export async function fetchShiftAssignments(eventDayId: string): Promise<ShiftAssignmentRow[]> {
  const supabase = db();
  const { data } = await supabase
    .from('shift_assignments')
    .select('id, event_day_id, personnel_id, role, starts_at, ends_at, status')
    .eq('event_day_id', eventDayId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });
  return (data as ShiftAssignmentRow[] | null) ?? [];
}

export async function fetchOpenDispatches(): Promise<DispatchLite[]> {
  const supabase = db();
  const { data } = await supabase
    .from('dispatches')
    .select('id, priority, status, description, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data as DispatchLite[] | null) ?? [];
}

/* ─── Incidents (mobile log-incident) ────────────── */

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

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
}): Promise<{ ok: boolean; record_number?: string; error?: string }> {
  const supabase = db();

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
    .select('record_number')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'incident_insert_failed' };
  return { ok: true, record_number: (data as { record_number: string }).record_number };
}

/** Mobile POS sale — same orchestration as web, calls the canonical checkin-router. */
export async function createPosSale(args: {
  org_id: string;
  event_id: string;
  tier: string;
  price_cents: number;
}): Promise<{ ok: boolean; result?: string; error?: string }> {
  const supabase = db();

  const ticketExternalId = `pos-mobile-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .insert({
      org_id: args.org_id,
      event_id: args.event_id,
      source: 'pos',
      tier: args.tier,
      state: 'valid',
      external_id: ticketExternalId,
      price_cents: args.price_cents,
    })
    .select('id')
    .single();
  if (ticketErr || !ticket) return { ok: false, error: ticketErr?.message ?? 'ticket_failed' };
  const ticketId = (ticket as { id: string }).id;

  const orderExternalId = `pos-cash-mobile-${Date.now()}`;
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      org_id: args.org_id,
      event_id: args.event_id,
      source: 'pos_cash',
      external_id: orderExternalId,
      status: 'paid',
      total_cents: args.price_cents,
      net_cents: args.price_cents,
      device: 'mobile',
    })
    .select('id')
    .single();
  if (orderErr || !order) return { ok: false, error: orderErr?.message ?? 'order_failed' };
  const orderId = (order as { id: string }).id;

  await supabase.from('order_line_items').insert({
    order_id: orderId,
    ticket_id: ticketId,
    description: `${args.tier} (mobile cash)`,
    tier: args.tier,
    quantity: 1,
    unit_price_cents: args.price_cents,
    total_cents: args.price_cents,
  });

  const { data: routerRes, error: routerErr } = await supabase.functions.invoke('checkin-router', {
    body: {
      source: 'pos_auto_checkin',
      org_id: args.org_id,
      event_id: args.event_id,
      ticket_id: ticketId,
      device: 'mobile',
      location: 'POS auto check-in (mobile)',
    },
  });
  if (routerErr) return { ok: true, error: `auto_checkin_failed: ${routerErr.message}` };
  const r = (routerRes ?? {}) as { ok?: boolean; result?: string; error?: string };
  return { ok: true, result: r.result, error: r.error };
}
