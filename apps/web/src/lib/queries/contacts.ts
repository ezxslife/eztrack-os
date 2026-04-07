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

/* ─── Soft-delete a contact ─────────────────────── */

export async function deleteContact(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
