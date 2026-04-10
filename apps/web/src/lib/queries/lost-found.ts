import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

/* ─── Types ─────────────────────────────────────── */

export interface FoundItemRow {
  id: string;
  itemNumber: string;
  description: string;
  category: string;
  locationFound: string;
  status: string;
  foundDate: string;
  foundBy: string | null;
  storageLocation: string | null;
  photoUrl: string | null;
  [key: string]: unknown;
}

export interface FoundItemDetail {
  id: string;
  recordNumber: string;
  description: string;
  category: string;
  status: string;
  foundAt: string;
  foundBy: string | null;
  foundLocation: { id: string; name: string } | null;
  storageLocation: string | null;
  photoUrl: string | null;
  notes: string | null;
  returnedAt: string | null;
  returnedTo: string | null;
  orgId: string;
  propertyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LostReportRow {
  id: string;
  reportNumber: string;
  description: string;
  category: string;
  lastSeenLocation: string | null;
  reportedBy: string | null;
  reportedByContact: string | null;
  date: string;
  status: string | null;
  [key: string]: unknown;
}

/* ─── Fetch found items list ─────────────────────── */

export async function fetchFoundItems(): Promise<FoundItemRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("found_items")
    .select(`
      id,
      record_number,
      description,
      category,
      status,
      found_at,
      found_by,
      storage_location,
      photo_url,
      location:locations!found_location_id(id, name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    itemNumber: row.record_number,
    description: row.description,
    category: row.category,
    locationFound: row.location?.name || "Unknown",
    status: row.status,
    foundDate: row.found_at,
    foundBy: row.found_by,
    storageLocation: row.storage_location,
    photoUrl: row.photo_url,
  }));
}

/* ─── Fetch single found item by ID ──────────────── */

export async function fetchFoundItemById(id: string): Promise<FoundItemDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("found_items")
    .select(`
      *,
      location:locations!found_location_id(id, name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    recordNumber: data.record_number,
    description: data.description,
    category: data.category,
    status: data.status,
    foundAt: data.found_at,
    foundBy: data.found_by,
    foundLocation: data.location,
    storageLocation: data.storage_location,
    photoUrl: data.photo_url,
    notes: data.notes,
    returnedAt: data.returned_at,
    returnedTo: data.returned_to,
    orgId: data.org_id,
    propertyId: data.property_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/* ─── Fetch lost reports list ────────────────────── */

export async function fetchLostReports(): Promise<LostReportRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("lost_reports")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    reportNumber: row.record_number,
    description: row.description,
    category: row.category,
    lastSeenLocation: null,
    reportedBy: row.reported_by_name,
    reportedByContact: row.reported_by_contact,
    date: row.reported_at || row.created_at,
    status: row.status,
  }));
}

/* ─── Create a found item ────────────────────────── */

export async function createFoundItem(input: {
  orgId: string;
  propertyId: string | null;
  description: string;
  category: string;
  foundLocationId?: string | null;
  foundBy?: string;
  storageLocation?: string;
  notes?: string;
}) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: input.orgId,
    p_prefix: "FND",
  });
  if (recNumError || !recNum) throw new Error("Failed to generate found item record number");

  const { data, error } = await supabase
    .from("found_items")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recNum,
      description: input.description,
      category: input.category,
      found_location_id: input.foundLocationId || null,
      found_by: input.foundBy || null,
      found_at: new Date().toISOString(),
      storage_location: input.storageLocation || null,
      notes: input.notes || null,
      status: "stored" as Enums<"lost_found_status">,
      created_by: user.id,
    })
    .select("id, record_number")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update found item fields ──────────────────── */

export async function updateFoundItem(
  id: string,
  updates: {
    description?: string;
    category?: string;
    foundBy?: string;
    storageLocation?: string;
    notes?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.foundBy !== undefined) payload.found_by = updates.foundBy;
  if (updates.storageLocation !== undefined) payload.storage_location = updates.storageLocation;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { error } = await supabase
    .from("found_items")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Update found item status ───────────────────── */

export async function updateFoundItemStatus(
  id: string,
  status: Enums<"lost_found_status">,
  extras?: { returnedTo?: string; returnedAt?: string }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = { status };
  if (extras?.returnedTo) payload.returned_to = extras.returnedTo;
  if (extras?.returnedAt) payload.returned_at = extras.returnedAt;
  if (status === "returned" && !extras?.returnedAt) {
    payload.returned_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("found_items")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a found item ───────────────────── */

export async function deleteFoundItem(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("found_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
