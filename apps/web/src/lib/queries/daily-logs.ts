import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

/* ─── Types ─────────────────────────────────────── */

export interface DailyLogRow {
  id: string;
  recordNumber: string;
  topic: string;
  location: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  synopsis: string | null;
  createdAt: string;
  createdBy: string | null;
  [key: string]: unknown;
}

export interface DailyLogDetail {
  id: string;
  recordNumber: string;
  topic: string;
  synopsis: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  location: { id: string; name: string } | null;
  creator: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  propertyId: string | null;
}

export interface DailyLogAuditEntry {
  id: string;
  action: string;
  actorName: string | null;
  createdAt: string;
}

/* ─── Fetch daily logs list ──────────────────────── */

export async function fetchDailyLogs(): Promise<DailyLogRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("daily_logs")
    .select(`
      id,
      record_number,
      topic,
      priority,
      status,
      synopsis,
      created_at,
      location:locations!location_id(id, name),
      creator:profiles!created_by(id, full_name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    recordNumber: row.record_number,
    topic: row.topic,
    location: row.location?.name || "Unknown",
    priority: row.priority,
    status: row.status,
    synopsis: row.synopsis,
    createdAt: row.created_at,
    createdBy: row.creator?.full_name || null,
  }));
}

/* ─── Fetch single daily log by ID ───────────────── */

export async function fetchDailyLogById(id: string): Promise<DailyLogDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("daily_logs")
    .select(`
      *,
      location:locations!location_id(id, name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    recordNumber: data.record_number,
    topic: data.topic,
    synopsis: data.synopsis,
    priority: data.priority,
    status: data.status,
    location: data.location,
    creator: data.creator
      ? { id: data.creator.id, fullName: data.creator.full_name }
      : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    orgId: data.org_id,
    propertyId: data.property_id,
  } as DailyLogDetail;
}

/* ─── Fetch audit trail for a daily log ──────────── */

export async function fetchDailyLogAudit(logId: string): Promise<DailyLogAuditEntry[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id, action, created_at,
      actor:profiles!actor_id(full_name)
    `)
    .eq("entity_type", "daily_log")
    .eq("entity_id", logId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    action: row.action,
    actorName: row.actor?.full_name || null,
    createdAt: row.created_at,
  }));
}

/* ─── Create a new daily log ─────────────────────── */

export async function createDailyLog(input: {
  orgId: string;
  propertyId: string | null;
  topic: string;
  synopsis?: string;
  priority: string;
  locationId: string | null;
}) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Atomic record number
  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: input.orgId,
    p_prefix: "DL",
  });
  if (recNumError || !recNum) throw new Error("Failed to generate daily log record number");

  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recNum,
      topic: input.topic,
      synopsis: input.synopsis || null,
      priority: input.priority as Enums<"dispatch_priority">,
      location_id: input.locationId,
      status: "open" as Enums<"daily_log_status">,
      created_by: user.id,
    })
    .select("id, record_number")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update daily log fields ────────────────────── */

export async function updateDailyLog(
  id: string,
  updates: {
    topic?: string;
    synopsis?: string;
    priority?: string;
    locationId?: string | null;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.topic !== undefined) payload.topic = updates.topic;
  if (updates.synopsis !== undefined) payload.synopsis = updates.synopsis;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.locationId !== undefined) payload.location_id = updates.locationId;

  const { error } = await supabase
    .from("daily_logs")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Update daily log status ────────────────────── */

export async function updateDailyLogStatus(id: string, status: Enums<"daily_log_status">) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("daily_logs")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
