import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

/* ─── Types ─────────────────────────────────────────────────── */

export interface DispatchCard {
  id: string;
  recordNumber: string;
  dispatchCode: string;
  description: string | null;
  location: string;
  sublocation: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  officerName: string | null;
  officerId: string | null;
  reporterName: string | null;
  anonymous: boolean;
  callSource: string | null;
  createdAt: string;
}

export interface DispatchDetail {
  id: string;
  recordNumber: string;
  dispatchCode: string;
  description: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  location: { id: string; name: string } | null;
  sublocation: string | null;
  assignedStaff: { id: string; fullName: string } | null;
  reporterName: string | null;
  reporterPhone: string | null;
  anonymous: boolean;
  callSource: string | null;
  createdBy: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  propertyId: string | null;
}

export interface DispatchTimelineEntry {
  id: string;
  event: string;
  details: string | null;
  actorName: string | null;
  timestamp: string;
}

export interface OfficerOnDuty {
  id: string;
  name: string;
  status: string;
  avatarUrl: string | null;
  updatedAt: string;
}

/* ─── Fetch all dispatches for Kanban board ─────────────────── */

export async function fetchDispatches() {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("dispatches")
    .select(`
      id,
      record_number,
      dispatch_code,
      description,
      priority,
      status,
      sublocation,
      reporter_name,
      anonymous,
      call_source,
      created_at,
      assigned_staff_id,
      location:locations!location_id(id, name),
      officer:profiles!assigned_staff_id(id, full_name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    recordNumber: row.record_number,
    dispatchCode: row.dispatch_code,
    description: row.description,
    location: row.location?.name || "Unknown",
    sublocation: row.sublocation,
    priority: row.priority,
    status: row.status,
    officerName: row.officer?.full_name || null,
    officerId: row.assigned_staff_id,
    reporterName: row.reporter_name,
    anonymous: row.anonymous,
    callSource: row.call_source,
    createdAt: row.created_at,
  })) as DispatchCard[];
}

/* ─── Fetch single dispatch with full detail ────────────────── */

export async function fetchDispatchById(id: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("dispatches")
    .select(`
      *,
      location:locations!location_id(id, name),
      officer:profiles!assigned_staff_id(id, full_name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    recordNumber: data.record_number,
    dispatchCode: data.dispatch_code,
    description: data.description,
    priority: data.priority,
    status: data.status,
    location: data.location,
    sublocation: data.sublocation,
    assignedStaff: data.officer
      ? { id: data.officer.id, fullName: data.officer.full_name }
      : null,
    reporterName: data.reporter_name,
    reporterPhone: data.reporter_phone,
    anonymous: data.anonymous,
    callSource: data.call_source,
    createdBy: data.creator
      ? { id: data.creator.id, fullName: data.creator.full_name }
      : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    orgId: data.org_id,
    propertyId: data.property_id,
  } as DispatchDetail;
}

/* ─── Fetch dispatch timeline ───────────────────────────────── */

export async function fetchDispatchTimeline(dispatchId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("dispatch_timeline")
    .select(`
      id, event, details, timestamp,
      actor:profiles!actor_id(full_name)
    `)
    .eq("dispatch_id", dispatchId)
    .order("timestamp", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    event: row.event,
    details: row.details,
    actorName: row.actor?.full_name || null,
    timestamp: row.timestamp,
  })) as DispatchTimelineEntry[];
}

/* ─── Fetch on-duty officers (staff status records) ─────────── */

export async function fetchOnDutyOfficers() {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("staff_status_records")
    .select(`
      id,
      status,
      updated_at,
      profile:profiles!staff_id(id, full_name, avatar_url)
    `)
    .neq("status", "off_duty")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.profile?.id || row.id,
    name: row.profile?.full_name || "Unknown",
    status: row.status,
    avatarUrl: row.profile?.avatar_url || null,
    updatedAt: row.updated_at,
  })) as OfficerOnDuty[];
}

/* ─── Create a new dispatch ─────────────────────────────────── */

export async function createDispatch(input: {
  orgId: string;
  propertyId: string | null;
  dispatchCode: string;
  priority: string;
  locationId: string | null;
  sublocation?: string;
  description: string;
  reporterName?: string;
  reporterPhone?: string;
  anonymous?: boolean;
  callSource?: string;
}) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Atomic record number
  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: input.orgId,
    p_prefix: "DSP",
  });
  if (recNumError || !recNum) throw new Error("Failed to generate dispatch record number");

  const { data, error } = await supabase
    .from("dispatches")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recNum,
      dispatch_code: input.dispatchCode,
      priority: input.priority as Enums<"dispatch_priority">,
      location_id: input.locationId,
      sublocation: input.sublocation || null,
      description: input.description,
      reporter_name: input.reporterName || null,
      reporter_phone: input.reporterPhone || null,
      anonymous: input.anonymous ?? false,
      call_source: input.callSource || null,
      created_by: user.id,
      status: "pending",
    })
    .select("id, record_number")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update dispatch status ────────────────────────────────── */

export async function updateDispatchStatus(id: string, status: Enums<"dispatch_status">) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("dispatches")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

/* ─── Assign officer to dispatch ────────────────────────────── */

export async function assignOfficerToDispatch(
  dispatchId: string,
  officerId: string
) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("dispatches")
    .update({
      assigned_staff_id: officerId,
      status: "in_progress",
    })
    .eq("id", dispatchId);

  if (error) throw error;

  // Add timeline entry
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("dispatch_timeline").insert({
    dispatch_id: dispatchId,
    event: "officer_assigned",
    details: `Officer assigned`,
    actor_id: user?.id || null,
  });
}

/* ─── Clear / resolve a dispatch ────────────────────────────── */

export async function clearDispatch(
  dispatchId: string,
  resolution: { clearCode: string; reason: string }
) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("dispatches")
    .update({ status: "cleared" })
    .eq("id", dispatchId);

  if (error) throw error;

  // Add timeline entry
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("dispatch_timeline").insert({
    dispatch_id: dispatchId,
    event: "cleared",
    details: `${resolution.clearCode}: ${resolution.reason}`,
    actor_id: user?.id || null,
  });
}

/* ─── Fetch available officers for assignment ───────────────── */

export async function fetchAvailableOfficers() {
  const supabase = getSupabaseBrowser();

  // Get all staff with their latest status
  const { data, error } = await supabase
    .from("staff_status_records")
    .select(`
      status,
      profile:profiles!staff_id(id, full_name, avatar_url)
    `)
    .in("status", ["available", "on_break"]);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.profile?.id || "",
    name: row.profile?.full_name || "Unknown",
    status: row.status,
    avatarUrl: row.profile?.avatar_url || null,
  }));
}

/* ─── Supabase Realtime subscription helper ─────────────────── */

export function subscribeToDispatches(
  orgId: string,
  callbacks: {
    onInsert?: (record: any) => void;
    onUpdate?: (record: any) => void;
    onDelete?: (record: any) => void;
  }
) {
  const supabase = getSupabaseBrowser();

  const channel = supabase
    .channel(`dispatches:${orgId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "dispatches",
        filter: `org_id=eq.${orgId}`,
      },
      (payload) => {
        switch (payload.eventType) {
          case "INSERT":
            callbacks.onInsert?.(payload.new);
            break;
          case "UPDATE":
            callbacks.onUpdate?.(payload.new);
            break;
          case "DELETE":
            callbacks.onDelete?.(payload.old);
            break;
        }
      }
    )
    .subscribe();

  return channel;
}
