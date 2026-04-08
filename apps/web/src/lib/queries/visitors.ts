import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface VisitorRow {
  id: string;
  firstName: string;
  lastName: string;
  purpose: string;
  status: string;
  hostName: string | null;
  company: string | null;
  expectedDate: string | null;
  expectedTime: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  [key: string]: unknown;
}

export interface VisitorDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  purpose: string;
  status: string;
  hostName: string | null;
  hostDepartment: string | null;
  expectedDate: string | null;
  expectedTime: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  idType: string | null;
  idNumber: string | null;
  vehiclePlate: string | null;
  ndaRequired: boolean;
  orgId: string;
  propertyId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ─── Fetch visitors list ───────────────────────── */

export async function fetchVisitors(): Promise<VisitorRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("visitors")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    purpose: row.purpose,
    status: row.status,
    hostName: row.host_name,
    company: row.company,
    expectedDate: row.expected_date,
    expectedTime: row.expected_time,
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
  }));
}

/* ─── Fetch single visitor by ID ────────────────── */

export async function fetchVisitorById(id: string): Promise<VisitorDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    purpose: data.purpose,
    status: data.status,
    hostName: data.host_name,
    hostDepartment: data.host_department,
    expectedDate: data.expected_date,
    expectedTime: data.expected_time,
    checkedInAt: data.checked_in_at,
    checkedOutAt: data.checked_out_at,
    idType: data.id_type,
    idNumber: data.id_number,
    vehiclePlate: data.vehicle_plate,
    ndaRequired: data.nda_required,
    orgId: data.org_id,
    propertyId: data.property_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/* ─── Create a visitor ──────────────────────────── */

export async function createVisitor(input: {
  orgId: string;
  propertyId: string | null;
  firstName: string;
  lastName: string;
  purpose: string;
  hostName?: string;
  hostDepartment?: string;
  company?: string;
  email?: string;
  phone?: string;
  expectedDate?: string;
  expectedTime?: string;
  ndaRequired?: boolean;
}) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("visitors")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      first_name: input.firstName,
      last_name: input.lastName,
      purpose: input.purpose,
      status: "pending",
      host_name: input.hostName || null,
      host_department: input.hostDepartment || null,
      company: input.company || null,
      email: input.email || null,
      phone: input.phone || null,
      expected_date: input.expectedDate || null,
      expected_time: input.expectedTime || null,
      nda_required: input.ndaRequired ?? false,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update visitor status (check-in / check-out) ─ */

export async function updateVisitorStatus(
  id: string,
  status: string,
  extras?: { checkedInAt?: string; checkedOutAt?: string }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = { status };
  if (extras?.checkedInAt) payload.checked_in_at = extras.checkedInAt;
  if (extras?.checkedOutAt) payload.checked_out_at = extras.checkedOutAt;
  if (status === "signed_in" && !extras?.checkedInAt) {
    payload.checked_in_at = new Date().toISOString();
  }
  if (status === "signed_out" && !extras?.checkedOutAt) {
    payload.checked_out_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("visitors")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Update visitor fields ────────────────────── */

export async function updateVisitor(
  id: string,
  updates: {
    firstName?: string;
    lastName?: string;
    purpose?: string;
    hostName?: string;
    hostDepartment?: string;
    company?: string;
    email?: string;
    phone?: string;
    expectedDate?: string;
    expectedTime?: string;
    idType?: string;
    idNumber?: string;
    vehiclePlate?: string;
    ndaRequired?: boolean;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.firstName !== undefined) payload.first_name = updates.firstName;
  if (updates.lastName !== undefined) payload.last_name = updates.lastName;
  if (updates.purpose !== undefined) payload.purpose = updates.purpose;
  if (updates.hostName !== undefined) payload.host_name = updates.hostName;
  if (updates.hostDepartment !== undefined) payload.host_department = updates.hostDepartment;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.expectedDate !== undefined) payload.expected_date = updates.expectedDate;
  if (updates.expectedTime !== undefined) payload.expected_time = updates.expectedTime;
  if (updates.idType !== undefined) payload.id_type = updates.idType;
  if (updates.idNumber !== undefined) payload.id_number = updates.idNumber;
  if (updates.vehiclePlate !== undefined) payload.vehicle_plate = updates.vehiclePlate;
  if (updates.ndaRequired !== undefined) payload.nda_required = updates.ndaRequired;

  const { error } = await supabase
    .from("visitors")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a visitor ─────────────────────── */

export async function deleteVisitor(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("visitors")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
