import { DispatchStatus } from "@eztrack/shared";

import type {
  QueuedAssignDispatchInput,
  QueuedUpdateDispatchStatusInput,
} from "@/lib/offline/types";
import { getSupabase } from "@/lib/supabase";

export async function updateDispatchStatusRecord(
  input: QueuedUpdateDispatchStatusInput
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("dispatches")
    .update({
      status: input.nextStatus,
    })
    .eq("id", input.dispatchId)
    .select("id, record_number, status")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    record_number: data.record_number,
    status: (data.status ?? input.nextStatus) as DispatchStatus,
  };
}

export async function assignDispatchOfficer(
  input: QueuedAssignDispatchInput
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dispatches")
    .update({
      assigned_staff_id: input.nextOfficerId,
    })
    .eq("id", input.dispatchId)
    .select(`
      id,
      record_number,
      assigned_staff_id,
      officer:profiles!assigned_staff_id(full_name)
    `)
    .single();

  if (error) {
    throw error;
  }

  const row: any = data;

  return {
    assigned_staff_id: row.assigned_staff_id ?? input.nextOfficerId,
    id: row.id,
    officer_name: row.officer?.full_name ?? input.nextOfficerName ?? null,
    record_number: row.record_number,
  };
}

export async function createDispatchRecord(input: {
  anonymous?: boolean;
  callSource?: string;
  description: string;
  dispatchCode: string;
  locationId: null | string;
  orgId: string;
  priority: string;
  propertyId: null | string;
  reporterName?: string;
  reporterPhone?: string;
  sublocation?: string;
}) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: recNum, error: recNumError } = await supabase.rpc(
    "next_record_number",
    {
      p_org_id: input.orgId,
      p_prefix: "DSP",
    }
  );

  if (recNumError || !recNum) {
    throw new Error("Failed to generate dispatch record number");
  }

  const { data, error } = await supabase
    .from("dispatches")
    .insert({
      anonymous: input.anonymous ?? false,
      call_source: input.callSource || null,
      created_by: user.id,
      description: input.description,
      dispatch_code: input.dispatchCode,
      location_id: input.locationId,
      org_id: input.orgId,
      priority: input.priority,
      property_id: input.propertyId,
      record_number: recNum,
      reporter_name: input.reporterName || null,
      reporter_phone: input.reporterPhone || null,
      status: "pending",
      sublocation: input.sublocation || null,
    })
    .select("id, record_number")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateDispatchRecord(
  id: string,
  updates: {
    anonymous?: boolean;
    callSource?: string;
    description?: string;
    dispatchCode?: string;
    priority?: string;
    reporterName?: string;
    reporterPhone?: string;
    sublocation?: string;
  }
) {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = {};

  if (updates.anonymous !== undefined) {
    payload.anonymous = updates.anonymous;
  }

  if (updates.callSource !== undefined) {
    payload.call_source = updates.callSource;
  }

  if (updates.description !== undefined) {
    payload.description = updates.description;
  }

  if (updates.dispatchCode !== undefined) {
    payload.dispatch_code = updates.dispatchCode;
  }

  if (updates.priority !== undefined) {
    payload.priority = updates.priority;
  }

  if (updates.reporterName !== undefined) {
    payload.reporter_name = updates.reporterName;
  }

  if (updates.reporterPhone !== undefined) {
    payload.reporter_phone = updates.reporterPhone;
  }

  if (updates.sublocation !== undefined) {
    payload.sublocation = updates.sublocation;
  }

  const { error } = await supabase
    .from("dispatches")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function clearDispatchRecord(
  dispatchId: string,
  resolution: {
    clearCode: string;
    reason: string;
  }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("dispatches")
    .update({ status: DispatchStatus.Cleared })
    .eq("id", dispatchId);

  if (error) {
    throw error;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("dispatch_timeline").insert({
    actor_id: user?.id || null,
    details: `${resolution.clearCode}: ${resolution.reason}`,
    dispatch_id: dispatchId,
    event: "cleared",
  });
}
