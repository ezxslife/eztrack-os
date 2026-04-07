import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

export interface IncidentRow {
  id: string;
  recordNumber: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  synopsis: string | null;
  assignedTo: string | null;
  reportedAt: string;
  createdBy: string | null;
}

export interface IncidentDetail {
  id: string;
  recordNumber: string;
  type: string;
  severity: string;
  status: string;
  synopsis: string | null;
  description: string | null;
  reportedBy: string | null;
  disposition: string | null;
  createdAt: string;
  updatedAt: string;
  location: { id: string; name: string } | null;
  creator: { id: string; fullName: string } | null;
  propertyId: string | null;
  orgId: string;
}

export interface IncidentNarrative {
  id: string;
  title: string;
  content: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentParticipant {
  id: string;
  personType: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  primaryRole: string;
  secondaryRole: string | null;
  description: string | null;
  policeContacted: boolean;
  medicalAttention: boolean;
}

export interface IncidentFinancial {
  id: string;
  entryType: string;
  amount: number;
  description: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** Fetch incidents list with location name joined */
export async function fetchIncidents() {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incidents")
    .select(`
      id,
      record_number,
      incident_type,
      severity,
      status,
      synopsis,
      reported_by,
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
    type: row.incident_type,
    severity: row.severity,
    status: row.status,
    location: row.location?.name || "Unknown",
    synopsis: row.synopsis,
    assignedTo: row.creator?.full_name || null,
    reportedAt: row.created_at,
    createdBy: row.creator?.full_name || null,
  })) as IncidentRow[];
}

/** Fetch a single incident by ID with full detail */
export async function fetchIncidentById(id: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incidents")
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
    type: data.incident_type,
    severity: data.severity,
    status: data.status,
    synopsis: data.synopsis,
    description: data.description,
    reportedBy: data.reported_by,
    disposition: data.disposition,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    location: data.location,
    creator: data.creator ? { id: data.creator.id, fullName: data.creator.full_name } : null,
    propertyId: data.property_id,
    orgId: data.org_id,
  } as IncidentDetail;
}

/** Fetch narratives for an incident */
export async function fetchIncidentNarratives(incidentId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incident_narratives")
    .select(`
      id, title, content, author_id, created_at, updated_at,
      author:profiles!author_id(full_name)
    `)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    authorName: row.author?.full_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) as IncidentNarrative[];
}

/** Fetch participants for an incident */
export async function fetchIncidentParticipants(incidentId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incident_participants")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    personType: row.person_type,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    primaryRole: row.primary_role,
    secondaryRole: row.secondary_role,
    description: row.description,
    policeContacted: row.police_contacted,
    medicalAttention: row.medical_attention,
  })) as IncidentParticipant[];
}

/** Fetch financials for an incident */
export async function fetchIncidentFinancials(incidentId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incident_financials")
    .select(`
      id, entry_type, amount, description, created_by, created_at,
      creator:profiles!created_by(full_name)
    `)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    entryType: row.entry_type,
    amount: Number(row.amount),
    description: row.description,
    createdBy: row.creator?.full_name || null,
    createdAt: row.created_at,
  })) as IncidentFinancial[];
}

/** Create a new incident */
export async function createIncident(input: {
  orgId: string;
  propertyId: string | null;
  incidentType: string;
  severity: string;
  locationId: string | null;
  synopsis: string;
  description?: string;
  reportedBy?: string;
}) {
  const supabase = getSupabaseBrowser();

  // Get the user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate record number
  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: input.orgId,
    p_prefix: "INC",
  });
  if (recNumError || !recNum) throw new Error("Failed to generate incident record number");

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recNum,
      incident_type: input.incidentType,
      severity: input.severity as Enums<"incident_severity">,
      location_id: input.locationId,
      synopsis: input.synopsis,
      description: input.description || null,
      reported_by: input.reportedBy || null,
      created_by: user.id,
    })
    .select("id, record_number")
    .single();

  if (error) throw error;
  return data;
}

/** Fetch locations for dropdowns */
export async function fetchLocations() {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("locations")
    .select("id, name, type, parent_id")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Update incident status */
export async function updateIncidentStatus(id: string, status: Enums<"incident_status">) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("incidents")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
