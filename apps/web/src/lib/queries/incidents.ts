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

/* ─── Sub-resource types ─────────────────────── */

export interface RelatedIncident {
  id: string;
  relatedIncidentId: string;
  recordNumber: string;
  type: string;
  status: string;
  relationshipType: string;
  reason: string | null;
  linkedBy: string | null;
  linkedAt: string;
}

export interface IncidentShare {
  id: string;
  sharedWithUserId: string | null;
  sharedWithRole: string | null;
  sharedWithName: string | null;
  permissionLevel: string;
  sharedByName: string | null;
  sharedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}

export interface IncidentForm {
  id: string;
  formType: string;
  formData: unknown;
  completedAt: string | null;
  completedByName: string | null;
  isOfficial: boolean;
  createdAt: string;
}

export interface IncidentDocLogEntry {
  id: string;
  action: string;
  details: string | null;
  actorName: string | null;
  createdAt: string;
}

/** Fetch related incidents */
export async function fetchRelatedIncidents(incidentId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("related_incidents")
    .select(`
      id, incident_id_related, relationship_type, reason, linked_at,
      linker:profiles!linked_by(full_name),
      related:incidents!incident_id_related(id, record_number, incident_type, status)
    `)
    .eq("incident_id_primary", incidentId)
    .order("linked_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    relatedIncidentId: row.incident_id_related,
    recordNumber: row.related?.record_number || "—",
    type: row.related?.incident_type || "Unknown",
    status: row.related?.status || "unknown",
    relationshipType: row.relationship_type,
    reason: row.reason,
    linkedBy: row.linker?.full_name || null,
    linkedAt: row.linked_at,
  })) as RelatedIncident[];
}

/** Fetch shares for an incident */
export async function fetchIncidentShares(incidentId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incident_shares")
    .select(`
      id, shared_with_user_id, shared_with_role, permission_level, shared_at, expires_at,
      sharedBy:profiles!shared_by_id(full_name),
      sharedWithUser:profiles!shared_with_user_id(full_name)
    `)
    .eq("incident_id", incidentId)
    .order("shared_at", { ascending: false });

  if (error) throw error;

  const now = new Date();
  return (data || []).map((row: any) => ({
    id: row.id,
    sharedWithUserId: row.shared_with_user_id,
    sharedWithRole: row.shared_with_role,
    sharedWithName: row.sharedWithUser?.full_name || row.shared_with_role || "Unknown",
    permissionLevel: row.permission_level,
    sharedByName: row.sharedBy?.full_name || null,
    sharedAt: row.shared_at,
    expiresAt: row.expires_at,
    isExpired: row.expires_at ? new Date(row.expires_at) < now : false,
  })) as IncidentShare[];
}

/** Fetch forms for an incident */
export async function fetchIncidentForms(incidentId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incident_forms")
    .select(`
      id, form_type, form_data, completed_at, is_official, created_at,
      completedBy:profiles!completed_by(full_name)
    `)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    formType: row.form_type,
    formData: row.form_data,
    completedAt: row.completed_at,
    completedByName: row.completedBy?.full_name || null,
    isOfficial: row.is_official,
    createdAt: row.created_at,
  })) as IncidentForm[];
}

/** Fetch document log (activity_log) for an incident */
export async function fetchIncidentDocLog(incidentId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id, action, changes, created_at,
      actor:profiles!actor_id(full_name)
    `)
    .eq("entity_type", "incident")
    .eq("entity_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    action: row.action,
    details: row.changes ? JSON.stringify(row.changes) : null,
    actorName: row.actor?.full_name || null,
    createdAt: row.created_at,
  })) as IncidentDocLogEntry[];
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

/** Update incident fields (severity, disposition, etc.) */
export async function updateIncident(id: string, fields: {
  severity?: Enums<"incident_severity">;
  status?: Enums<"incident_status">;
  disposition?: string | null;
  description?: string | null;
  created_by?: string | null;
}) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("incidents")
    .update(fields)
    .eq("id", id);

  if (error) throw error;
}

/** Soft-delete an incident */
export async function deleteIncident(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("incidents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** Create a narrative entry */
export async function createIncidentNarrative(incidentId: string, data: {
  title: string;
  content: string;
}) {
  const supabase = getSupabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("incident_narratives")
    .insert({
      incident_id: incidentId,
      title: data.title,
      content: data.content,
      author_id: user.id,
    });

  if (error) throw error;
}

/** Update a narrative entry */
export async function updateIncidentNarrative(id: string, data: {
  title: string;
  content: string;
}) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("incident_narratives")
    .update({
      title: data.title,
      content: data.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

/** Add a participant to an incident */
export async function addIncidentParticipant(incidentId: string, data: {
  personType: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  primaryRole: string;
  secondaryRole?: string;
  description?: string;
  policeContacted?: boolean;
  policeResult?: string;
  medicalAttention?: boolean;
  medicalDetails?: string;
}) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("incident_participants")
    .insert({
      incident_id: incidentId,
      person_type: data.personType,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || null,
      email: data.email || null,
      primary_role: data.primaryRole,
      secondary_role: data.secondaryRole || null,
      description: data.description || null,
      police_contacted: data.policeContacted ?? false,
      police_result: data.policeResult || null,
      medical_attention: data.medicalAttention ?? false,
      medical_details: data.medicalDetails || null,
    });

  if (error) throw error;
}

/** Create a financial entry */
export async function createIncidentFinancial(incidentId: string, data: {
  entryType: string;
  amount: number;
  description?: string;
}) {
  const supabase = getSupabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("incident_financials")
    .insert({
      incident_id: incidentId,
      entry_type: data.entryType,
      amount: data.amount,
      description: data.description || null,
      created_by: user.id,
    });

  if (error) throw error;
}

/** Share an incident with a user or role */
export async function createIncidentShare(incidentId: string, orgId: string, data: {
  sharedWithUserId?: string | null;
  sharedWithRole?: string | null;
  permissionLevel: string;
  expiresAt?: string | null;
}) {
  const supabase = getSupabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("incident_shares")
    .insert({
      incident_id: incidentId,
      org_id: orgId,
      shared_by_id: user.id,
      shared_with_user_id: data.sharedWithUserId || null,
      shared_with_role: data.sharedWithRole || null,
      permission_level: data.permissionLevel as any,
      expires_at: data.expiresAt || null,
    });

  if (error) throw error;
}

/** Link two incidents together */
export async function linkRelatedIncident(incidentId: string, orgId: string, data: {
  relatedIncidentId: string;
  relationshipType: string;
  reason?: string;
}) {
  const supabase = getSupabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("related_incidents")
    .insert({
      incident_id_primary: incidentId,
      incident_id_related: data.relatedIncidentId,
      relationship_type: data.relationshipType as any,
      reason: data.reason || null,
      linked_by: user.id,
      org_id: orgId,
    });

  if (error) throw error;
}

/* ─── Incident Media types & CRUD ────────────── */

export interface IncidentMediaItem {
  id: string;
  incidentId: string;
  orgId: string;
  mediaType: string | null;
  title: string | null;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  storageBucket: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchIncidentMedia(incidentId: string): Promise<IncidentMediaItem[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("incident_media")
    .select(`
      id, incident_id, org_id, media_type, title, description,
      file_name, file_path, file_size, mime_type, storage_bucket,
      uploaded_by, created_at, updated_at,
      uploader:profiles!uploaded_by(full_name)
    `)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    incidentId: row.incident_id,
    orgId: row.org_id,
    mediaType: row.media_type,
    title: row.title,
    description: row.description,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    mimeType: row.mime_type,
    storageBucket: row.storage_bucket,
    uploadedBy: row.uploaded_by,
    uploadedByName: (row.uploader as any)?.full_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createIncidentMedia(
  incidentId: string,
  orgId: string,
  data: {
    mediaType?: string;
    title?: string;
    description?: string;
    fileName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("incident_media").insert({
    incident_id: incidentId,
    org_id: orgId,
    media_type: data.mediaType || null,
    title: data.title || null,
    description: data.description || null,
    file_name: data.fileName,
    file_path: data.filePath,
    file_size: data.fileSize ?? null,
    mime_type: data.mimeType || null,
    storage_bucket: "incident-media",
    uploaded_by: user.id,
  });

  if (error) throw error;
}

export async function deleteIncidentMedia(id: string) {
  const supabase = getSupabaseBrowser();

  // Fetch the media row first to get file_path for storage cleanup
  const { data: mediaRow } = await supabase
    .from("incident_media")
    .select("file_path, storage_bucket")
    .eq("id", id)
    .single();

  // Remove from storage if possible
  if (mediaRow?.file_path) {
    await supabase.storage
      .from(mediaRow.storage_bucket || "incident-media")
      .remove([mediaRow.file_path]);
  }

  const { error } = await supabase
    .from("incident_media")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadIncidentMediaFile(
  incidentId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseBrowser();
  const safeName = file.name.replace(/\s+/g, "-");
  const filePath = `${incidentId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("incident-media")
    .upload(filePath, file);

  if (error) throw error;

  return filePath;
}
