import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

/* ─── Types ─────────────────────────────────────── */

export interface CaseRow {
  id: string;
  caseNumber: string;
  caseType: string;
  status: string;
  synopsis: string | null;
  leadInvestigator: string | null;
  created: string;
  priority: string | null;
  [key: string]: unknown;
}

export interface CaseDetail {
  id: string;
  recordNumber: string;
  caseType: string;
  status: string;
  stage: string;
  synopsis: string | null;
  escalationLevel: string | null;
  leadInvestigator: { id: string; fullName: string } | null;
  creator: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  propertyId: string | null;
}

/* ─── Fetch cases list ───────────────────────────── */

export async function fetchCases(): Promise<CaseRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("cases")
    .select(`
      id,
      record_number,
      case_type,
      status,
      synopsis,
      escalation_level,
      created_at,
      investigator:profiles!lead_investigator(id, full_name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    caseNumber: row.record_number,
    caseType: row.case_type,
    status: row.status,
    synopsis: row.synopsis,
    leadInvestigator: row.investigator?.full_name || null,
    created: row.created_at,
    priority: row.escalation_level,
  }));
}

/* ─── Fetch single case by ID ────────────────────── */

export async function fetchCaseById(id: string): Promise<CaseDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("cases")
    .select(`
      *,
      investigator:profiles!lead_investigator(id, full_name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    recordNumber: data.record_number,
    caseType: data.case_type,
    status: data.status,
    stage: data.stage ?? "assessment",
    synopsis: data.synopsis,
    escalationLevel: data.escalation_level,
    leadInvestigator: data.investigator
      ? { id: data.investigator.id, fullName: data.investigator.full_name }
      : null,
    creator: data.creator
      ? { id: data.creator.id, fullName: data.creator.full_name }
      : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    orgId: data.org_id,
    propertyId: data.property_id,
  };
}

/* ─── Create a new case ──────────────────────────── */

export async function createCase(input: {
  orgId: string;
  propertyId: string | null;
  caseType: string;
  synopsis?: string;
  escalationLevel?: string;
}) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: input.orgId,
    p_prefix: "CSE",
  });
  if (recNumError || !recNum) throw new Error("Failed to generate case record number");

  const { data, error } = await supabase
    .from("cases")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recNum,
      case_type: input.caseType,
      synopsis: input.synopsis || null,
      escalation_level: input.escalationLevel || null,
      status: "open" as Enums<"case_status">,
      created_by: user.id,
    })
    .select("id, record_number")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update case status ─────────────────────────── */

export async function updateCaseStatus(id: string, status: Enums<"case_status">) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("cases")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a case ─────────────────────────── */

export async function deleteCase(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("cases")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/* ─── Update case fields (generic partial update) ── */

export async function updateCase(id: string, fields: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("cases")
    .update(fields)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Create case evidence ──────────────────────── */

export async function createCaseEvidence(
  caseId: string,
  data: {
    title: string;
    description?: string;
    type: string;
    status?: string;
    storageLocation?: string;
    storageFacility?: string;
    itemNumber?: string;
    externalIdentifier?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("case_evidence").insert({
    case_id: caseId,
    title: data.title,
    description: data.description || null,
    type: data.type,
    status: data.status || "collected",
    storage_location: data.storageLocation || null,
    storage_facility: data.storageFacility || null,
    item_number: data.itemNumber || null,
    external_identifier: data.externalIdentifier || null,
    created_by: user?.id || null,
  });

  if (error) throw error;
}

/* ─── Create case task ──────────────────────────── */

export async function createCaseTask(
  caseId: string,
  orgId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    assignedTo?: string | null;
    dueDate?: string | null;
    sortOrder?: number;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("case_tasks").insert({
    case_id: caseId,
    org_id: orgId,
    title: data.title,
    description: data.description || null,
    priority: (data.priority || "medium") as Enums<"case_task_priority">,
    status: "pending" as Enums<"case_task_status">,
    assigned_to: data.assignedTo || null,
    due_date: data.dueDate || null,
    sort_order: data.sortOrder ?? 0,
    created_by: user.id,
  });

  if (error) throw error;
}

/* ─── Create case narrative ─────────────────────── */

export async function createCaseNarrative(
  caseId: string,
  data: {
    title: string;
    content: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("case_narratives").insert({
    case_id: caseId,
    title: data.title,
    content: data.content,
    author_id: user?.id || null,
  });

  if (error) throw error;
}

/* ─── Create evidence transfer ──────────────────── */

export async function createEvidenceTransfer(
  orgId: string,
  data: {
    evidenceId: string;
    transferredToId: string;
    transferReason: string;
    notes?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("case_evidence_transfers").insert({
    evidence_id: data.evidenceId,
    org_id: orgId,
    transferred_from_id: user?.id || null,
    transferred_to_id: data.transferredToId,
    transfer_reason: data.transferReason as Enums<"evidence_transfer_reason">,
    notes: data.notes || null,
    signature_acknowledged: true,
  });

  if (error) throw error;
}

/* ─── Create case related record ────────────────── */

export async function createCaseRelatedRecord(
  caseId: string,
  orgId: string,
  data: {
    relatedRecordId: string;
    relatedRecordType: string;
    relationshipDescription?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("case_related_records").insert({
    case_id: caseId,
    org_id: orgId,
    related_record_id: data.relatedRecordId,
    related_record_type: data.relatedRecordType as Enums<"case_related_record_type">,
    relationship_description: data.relationshipDescription || null,
    linked_by: user.id,
  });

  if (error) throw error;
}

/* ─── Create case cost ──────────────────────────── */

export async function createCaseCost(
  caseId: string,
  orgId: string,
  data: {
    costType: string;
    amount: number;
    description: string;
    vendor?: string;
    paidDate?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("case_costs").insert({
    case_id: caseId,
    org_id: orgId,
    cost_type: data.costType as Enums<"case_cost_type">,
    amount: data.amount,
    description: data.description,
    vendor: data.vendor || null,
    paid_date: data.paidDate || null,
    created_by: user.id,
  });

  if (error) throw error;
}

/* ─── Sub-resource types ─────────────────────── */

export interface CaseEvidenceItem {
  id: string;
  itemNumber: string | null;
  title: string;
  description: string | null;
  type: string;
  status: string;
  storageLocation: string | null;
  storageFacility: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface CaseTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedToName: string | null;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CaseNarrativeItem {
  id: string;
  title: string;
  content: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseCostEntry {
  id: string;
  costType: string;
  amount: number;
  description: string;
  vendor: string | null;
  paidDate: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface CaseRelatedRecord {
  id: string;
  relatedRecordId: string;
  relatedRecordType: string;
  relationshipDescription: string | null;
  linkedByName: string | null;
  linkedAt: string;
}

export interface CaseAuditEntry {
  id: string;
  action: string;
  details: string | null;
  actorName: string | null;
  createdAt: string;
}

/* ─── Fetch case evidence ──────────────────────── */

export async function fetchCaseEvidence(caseId: string): Promise<CaseEvidenceItem[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("case_evidence")
    .select(`
      id, item_number, title, description, type, status,
      storage_location, storage_facility, created_at,
      creator:profiles!created_by(full_name)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    itemNumber: row.item_number,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    storageLocation: row.storage_location,
    storageFacility: row.storage_facility,
    createdByName: row.creator?.full_name || null,
    createdAt: row.created_at,
  }));
}

/* ─── Fetch case tasks ─────────────────────────── */

export async function fetchCaseTasks(caseId: string): Promise<CaseTask[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("case_tasks")
    .select(`
      id, title, description, status, priority, due_date,
      completed_at, sort_order, created_at,
      assignee:profiles!assigned_to(full_name)
    `)
    .eq("case_id", caseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignedToName: row.assignee?.full_name || null,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}

/* ─── Fetch case narratives ────────────────────── */

export async function fetchCaseNarratives(caseId: string): Promise<CaseNarrativeItem[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("case_narratives")
    .select(`
      id, title, content, created_at, updated_at,
      author:profiles!author_id(full_name)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    authorName: row.author?.full_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/* ─── Fetch case costs / financials ────────────── */

export async function fetchCaseCosts(caseId: string): Promise<CaseCostEntry[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("case_costs")
    .select(`
      id, cost_type, amount, description, vendor, paid_date, created_at,
      creator:profiles!created_by(full_name)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    costType: row.cost_type,
    amount: Number(row.amount),
    description: row.description,
    vendor: row.vendor,
    paidDate: row.paid_date,
    createdByName: row.creator?.full_name || null,
    createdAt: row.created_at,
  }));
}

/* ─── Fetch case related records ───────────────── */

export async function fetchCaseRelatedRecords(caseId: string): Promise<CaseRelatedRecord[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("case_related_records")
    .select(`
      id, related_record_id, related_record_type, relationship_description, linked_at,
      linker:profiles!linked_by(full_name)
    `)
    .eq("case_id", caseId)
    .order("linked_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    relatedRecordId: row.related_record_id,
    relatedRecordType: row.related_record_type,
    relationshipDescription: row.relationship_description,
    linkedByName: row.linker?.full_name || null,
    linkedAt: row.linked_at,
  }));
}

/* ─── Fetch case audit trail from activity_log ───── */

export async function fetchCaseAudit(caseId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id, action, changes, created_at,
      actor:profiles!actor_id(full_name)
    `)
    .eq("entity_type", "case")
    .eq("entity_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    action: row.action,
    details: row.changes ? JSON.stringify(row.changes) : null,
    actorName: row.actor?.full_name || null,
    createdAt: row.created_at,
  }));
}

/* ─── Case Resource types & CRUD ─────────────── */

export interface CaseResource {
  id: string;
  caseId: string;
  orgId: string;
  profileId: string | null;
  name: string;
  alias: string | null;
  role: string;
  hourlyRate: number | null;
  hoursLogged: number;
  status: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCaseResources(caseId: string): Promise<CaseResource[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("case_resources")
    .select(`
      id, case_id, org_id, profile_id, name, alias, role,
      hourly_rate, hours_logged, status, notes, created_by,
      created_at, updated_at,
      profile:profiles!profile_id(full_name)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    caseId: row.case_id,
    orgId: row.org_id,
    profileId: row.profile_id,
    name: (row.profile as any)?.full_name || row.name,
    alias: row.alias,
    role: row.role,
    hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : null,
    hoursLogged: Number(row.hours_logged ?? 0),
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createCaseResource(
  caseId: string,
  orgId: string,
  data: {
    name: string;
    alias?: string;
    role: string;
    hourlyRate?: number;
    profileId?: string | null;
    notes?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("case_resources").insert({
    case_id: caseId,
    org_id: orgId,
    profile_id: data.profileId || null,
    name: data.name,
    alias: data.alias || null,
    role: data.role,
    hourly_rate: data.hourlyRate ?? null,
    hours_logged: 0,
    status: "active",
    notes: data.notes || null,
    created_by: user.id,
  });

  if (error) throw error;
}

export async function updateCaseResource(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("case_resources")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCaseResource(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("case_resources")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
