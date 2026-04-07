import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

/* ─── Types ─────────────────────────────────────── */

export type PatronFlag = "none" | "watch" | "banned" | "vip" | "warning";

export interface PatronRow {
  id: string;
  firstName: string;
  lastName: string;
  flag: PatronFlag;
  notes: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface PatronDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  flag: PatronFlag;
  ticketType: string | null;
  idType: string | null;
  idNumber: string | null;
  photoUrl: string | null;
  notes: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Fetch patrons list ─────────────────────────── */

export async function fetchPatrons(): Promise<PatronRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("patrons")
    .select(`
      id, first_name, last_name, flag, notes,
      phone, email, photo_url, created_at
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    flag: row.flag,
    notes: row.notes,
    phone: row.phone,
    email: row.email,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  }));
}

/* ─── Fetch single patron by ID ──────────────────── */

export async function fetchPatronById(id: string): Promise<PatronDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("patrons")
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
    dob: data.dob,
    flag: data.flag,
    ticketType: data.ticket_type,
    idType: data.id_type,
    idNumber: data.id_number,
    photoUrl: data.photo_url,
    notes: data.notes,
    orgId: data.org_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/* ─── Create a new patron ────────────────────────── */

export async function createPatron(input: {
  orgId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dob?: string;
  flag?: PatronFlag;
  ticketType?: string;
  idType?: string;
  idNumber?: string;
  notes?: string;
}) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("patrons")
    .insert({
      org_id: input.orgId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email || null,
      phone: input.phone || null,
      dob: input.dob || null,
      flag: (input.flag || "none") as Enums<"patron_flag">,
      ticket_type: input.ticketType || null,
      id_type: input.idType || null,
      id_number: input.idNumber || null,
      notes: input.notes || null,
    })
    .select("id, first_name, last_name")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update patron flag ─────────────────────────── */

export async function updatePatronFlag(id: string, flag: Enums<"patron_flag">, notes?: string) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = { flag };
  if (notes !== undefined) payload.notes = notes;

  const { error } = await supabase
    .from("patrons")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Update patron details ──────────────────────── */

export async function updatePatron(
  id: string,
  updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dob?: string;
    ticketType?: string;
    idType?: string;
    idNumber?: string;
    notes?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.firstName !== undefined) payload.first_name = updates.firstName;
  if (updates.lastName !== undefined) payload.last_name = updates.lastName;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.dob !== undefined) payload.dob = updates.dob;
  if (updates.ticketType !== undefined) payload.ticket_type = updates.ticketType;
  if (updates.idType !== undefined) payload.id_type = updates.idType;
  if (updates.idNumber !== undefined) payload.id_number = updates.idNumber;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { error } = await supabase
    .from("patrons")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a patron ───────────────────────── */

export async function deletePatron(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("patrons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
