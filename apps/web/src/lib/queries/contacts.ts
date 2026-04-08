import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  organization: string;
  category: string;
  contactType: string;
  phone: string | null;
  email: string | null;
  title: string | null;
  [key: string]: unknown;
}

export interface ContactDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  category: string;
  contactType: string;
  title: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  email: string | null;
  address: string | null;
  idType: string | null;
  idNumber: string | null;
  notes: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Fetch contacts list ───────────────────────── */

export async function fetchContacts(): Promise<ContactRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    organization: row.organization_name || "",
    category: row.category,
    contactType: row.contact_type,
    phone: row.phone,
    email: row.email,
    title: row.title,
  }));
}

/* ─── Fetch single contact by ID ────────────────── */

export async function fetchContactById(id: string): Promise<ContactDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    organizationName: data.organization_name,
    category: data.category,
    contactType: data.contact_type,
    title: data.title,
    phone: data.phone,
    secondaryPhone: data.secondary_phone,
    email: data.email,
    address: data.address,
    idType: data.id_type,
    idNumber: data.id_number,
    notes: data.notes,
    orgId: data.org_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/* ─── Create a contact ──────────────────────────── */

export async function createContact(input: {
  orgId: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  category: string;
  contactType: string;
  title?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      org_id: input.orgId,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      organization_name: input.organizationName || null,
      category: input.category,
      contact_type: input.contactType,
      title: input.title || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update a contact ─────────────────────────── */

export async function updateContact(
  id: string,
  updates: {
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    category?: string;
    contactType?: string;
    title?: string;
    phone?: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
    idType?: string;
    idNumber?: string;
    notes?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.firstName !== undefined) payload.first_name = updates.firstName;
  if (updates.lastName !== undefined) payload.last_name = updates.lastName;
  if (updates.organizationName !== undefined) payload.organization_name = updates.organizationName;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.contactType !== undefined) payload.contact_type = updates.contactType;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.secondaryPhone !== undefined) payload.secondary_phone = updates.secondaryPhone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.idType !== undefined) payload.id_type = updates.idType;
  if (updates.idNumber !== undefined) payload.id_number = updates.idNumber;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { error } = await supabase
    .from("contacts")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a contact ─────────────────────── */

export async function deleteContact(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
