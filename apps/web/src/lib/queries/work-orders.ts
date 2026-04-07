import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

/* ─── Types ─────────────────────────────────────── */

export interface WorkOrderRow {
  id: string;
  woNumber: string;
  title: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  assignedTo: string | null;
  dueDate: string | null;
  [key: string]: unknown;
}

export interface WorkOrderDetail {
  id: string;
  recordNumber: string;
  title: string;
  description: string | null;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  location: { id: string; name: string } | null;
  assignedStaff: { id: string; fullName: string } | null;
  creator: { id: string; fullName: string } | null;
  dueDate: string | null;
  scheduledDate: string | null;
  estimatedCost: number | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  propertyId: string | null;
}

/* ─── Fetch work orders list ─────────────────────── */

export async function fetchWorkOrders(): Promise<WorkOrderRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      id,
      record_number,
      title,
      category,
      priority,
      status,
      due_date,
      assigned:profiles!assigned_to(id, full_name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    woNumber: row.record_number,
    title: row.title,
    category: row.category,
    priority: row.priority,
    status: row.status,
    assignedTo: row.assigned?.full_name || null,
    dueDate: row.due_date,
  }));
}

/* ─── Fetch single work order by ID ──────────────── */

export async function fetchWorkOrderById(id: string): Promise<WorkOrderDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      location:locations!location_id(id, name),
      assigned:profiles!assigned_to(id, full_name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    recordNumber: data.record_number,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: data.status,
    location: data.location,
    assignedStaff: data.assigned
      ? { id: data.assigned.id, fullName: data.assigned.full_name }
      : null,
    creator: data.creator
      ? { id: data.creator.id, fullName: data.creator.full_name }
      : null,
    dueDate: data.due_date,
    scheduledDate: data.scheduled_date,
    estimatedCost: data.estimated_cost ? Number(data.estimated_cost) : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    orgId: data.org_id,
    propertyId: data.property_id,
  };
}

/* ─── Create a new work order ────────────────────── */

export async function createWorkOrder(input: {
  orgId: string;
  propertyId: string | null;
  title: string;
  description?: string;
  category: string;
  priority: string;
  locationId?: string | null;
  assignedTo?: string | null;
  dueDate?: string;
  scheduledDate?: string;
  estimatedCost?: number;
}) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: input.orgId,
    p_prefix: "WO",
  });
  if (recNumError || !recNum) throw new Error("Failed to generate work order record number");

  const { data, error } = await supabase
    .from("work_orders")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recNum,
      title: input.title,
      description: input.description || null,
      category: input.category,
      priority: input.priority as Enums<"dispatch_priority">,
      status: "open" as Enums<"work_order_status">,
      location_id: input.locationId || null,
      assigned_to: input.assignedTo || null,
      due_date: input.dueDate || null,
      scheduled_date: input.scheduledDate || null,
      estimated_cost: input.estimatedCost ?? null,
      created_by: user.id,
    })
    .select("id, record_number")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update work order status ───────────────────── */

export async function updateWorkOrderStatus(id: string, status: Enums<"work_order_status">) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("work_orders")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

/* ─── Update work order fields ───────────────────── */

export async function updateWorkOrder(
  id: string,
  updates: {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    assignedTo?: string | null;
    dueDate?: string | null;
    estimatedCost?: number | null;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
  if (updates.estimatedCost !== undefined) payload.estimated_cost = updates.estimatedCost;

  const { error } = await supabase
    .from("work_orders")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a work order ───────────────────── */

export async function deleteWorkOrder(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("work_orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
