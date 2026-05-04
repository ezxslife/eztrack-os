import type { SupabaseClient } from "@supabase/supabase-js";

export interface EventRow {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  capacity: number | null;
  is_multi_day: boolean;
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

export interface CapacitySnapshot {
  event_day_id: string;
  recorded_at: string;
  sold: number;
  checked_in: number;
  reentries: number;
  capacity_pct: number;
  threshold_breached: string | null;
}

export interface ScanRow {
  id: string;
  event_day_id: string;
  result: string;
  source: string;
  entry_number: number;
  created_at: string;
  location: string | null;
  device: string | null;
}

export interface DoorFlowPoint {
  minute: string;
  count: number;
}

export interface WallBoardData {
  event: EventRow;
  days: EventDayRow[];
  snapshots: Record<string, CapacitySnapshot>;
  recentScans: ScanRow[];
  doorFlow: DoorFlowPoint[];
}

export async function fetchWallBoard(
  supabase: SupabaseClient,
  eventId: string,
): Promise<WallBoardData> {
  const event = await fetchEvent(supabase, eventId);
  const days = await fetchEventDays(supabase, eventId);
  const snapshots = await fetchLatestSnapshots(supabase, eventId);
  const activeDay = findActiveDay(days) ?? days[0] ?? null;
  const recentScans = await fetchRecentScans(supabase, eventId, activeDay?.id);
  const doorFlow = await fetchDoorFlow(supabase, eventId, activeDay?.id);

  return {
    event,
    days,
    snapshots,
    recentScans,
    doorFlow,
  };
}

async function fetchEvent(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventRow> {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status, capacity, is_multi_day")
    .eq("id", eventId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Event not found");
  }

  return data as EventRow;
}

async function fetchEventDays(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventDayRow[]> {
  const { data, error } = await supabase
    .from("event_days")
    .select("id, event_id, day_index, label, date, starts_at, ends_at, capacity")
    .eq("event_id", eventId)
    .order("day_index", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as EventDayRow[];
}

async function fetchLatestSnapshots(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Record<string, CapacitySnapshot>> {
  const { data, error } = await supabase
    .from("capacity_snapshots")
    .select("event_day_id, recorded_at, sold, checked_in, reentries, capacity_pct, threshold_breached")
    .eq("event_id", eventId)
    .order("recorded_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const latest: Record<string, CapacitySnapshot> = {};
  for (const row of data ?? []) {
    const snapshot = row as CapacitySnapshot;
    if (!latest[snapshot.event_day_id]) {
      latest[snapshot.event_day_id] = {
        ...snapshot,
        capacity_pct: Number(snapshot.capacity_pct ?? 0),
      };
    }
  }
  return latest;
}

async function fetchRecentScans(
  supabase: SupabaseClient,
  eventId: string,
  eventDayId?: string,
): Promise<ScanRow[]> {
  let query = supabase
    .from("check_ins")
    .select("id, event_day_id, result, source, entry_number, created_at, location, device")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(18);

  if (eventDayId) {
    query = query.eq("event_day_id", eventDayId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ScanRow[];
}

async function fetchDoorFlow(
  supabase: SupabaseClient,
  eventId: string,
  eventDayId?: string,
): Promise<DoorFlowPoint[]> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  let query = supabase
    .from("check_ins")
    .select("created_at")
    .eq("event_id", eventId)
    .in("result", ["success", "already_scanned"])
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(800);

  if (eventDayId) {
    query = query.eq("event_day_id", eventDayId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const buckets = new Array(12).fill(0) as number[];
  const now = Date.now();
  for (const row of data ?? []) {
    const ageMinutes = Math.floor((now - new Date((row as { created_at: string }).created_at).getTime()) / 60_000);
    const bucket = 11 - Math.floor(Math.max(0, ageMinutes) / 5);
    if (bucket >= 0 && bucket < buckets.length) {
      buckets[bucket] += 1;
    }
  }

  return buckets.map((count, index) => ({
    minute: index === buckets.length - 1 ? "now" : `-${(buckets.length - 1 - index) * 5}m`,
    count,
  }));
}

export function findActiveDay(days: EventDayRow[]) {
  const now = Date.now();
  return days.find((day) => {
    const starts = new Date(day.starts_at).getTime();
    const ends = new Date(day.ends_at).getTime();
    return starts <= now && now <= ends;
  });
}
