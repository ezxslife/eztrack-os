import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface CaseDetail {
  caseType: string;
  createdAt: string;
  creator: { fullName: string; id: string } | null;
  escalationLevel: string | null;
  id: string;
  leadInvestigator: { fullName: string; id: string } | null;
  orgId: string;
  propertyId: string | null;
  recordNumber: string;
  stage: string;
  status: string;
  synopsis: string | null;
  updatedAt: string;
}

export interface CaseEvidenceItem {
  createdAt: string;
  createdByName: string | null;
  description: string | null;
  id: string;
  itemNumber: string | null;
  status: string;
  storageFacility: string | null;
  storageLocation: string | null;
  title: string;
  type: string;
}

export interface CaseTask {
  assignedToName: string | null;
  completedAt: string | null;
  createdAt: string;
  description: string | null;
  dueDate: string | null;
  id: string;
  priority: string;
  sortOrder: number;
  status: string;
  title: string;
}

export interface CaseNarrativeItem {
  authorName: string | null;
  content: string;
  createdAt: string;
  id: string;
  title: string;
  updatedAt: string;
}

export interface CaseCostEntry {
  amount: number;
  costType: string;
  createdAt: string;
  createdByName: string | null;
  description: string;
  id: string;
  paidDate: string | null;
  vendor: string | null;
}

export interface CaseRelatedRecord {
  id: string;
  linkedAt: string;
  linkedByName: string | null;
  relatedRecordId: string;
  relatedRecordType: string;
  relationshipDescription: string | null;
}

export interface CaseAuditEntry {
  action: string;
  actorName: string | null;
  createdAt: string;
  details: string | null;
  id: string;
}

export interface CaseResource {
  alias: string | null;
  caseId: string;
  createdAt: string;
  createdBy: string | null;
  hourlyRate: number | null;
  hoursLogged: number;
  id: string;
  name: string;
  notes: string | null;
  orgId: string;
  profileId: string | null;
  role: string;
  status: string;
  updatedAt: string;
}

export interface CaseEvidenceTransfer {
  createdAt: string;
  evidenceId: string;
  evidenceItemNumber: string | null;
  evidenceTitle: string;
  id: string;
  notes: string | null;
  transferDate: string;
  transferReason: string;
  transferredFromName: string | null;
  transferredToName: string | null;
}

async function fetchCaseById(id: string): Promise<CaseDetail> {
  const supabase = getSupabase();
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

  if (error) {
    throw error;
  }

  return {
    caseType: data.case_type,
    createdAt: data.created_at,
    creator: data.creator
      ? { fullName: data.creator.full_name, id: data.creator.id }
      : null,
    escalationLevel: data.escalation_level ?? null,
    id: data.id,
    leadInvestigator: data.investigator
      ? { fullName: data.investigator.full_name, id: data.investigator.id }
      : null,
    orgId: data.org_id,
    propertyId: data.property_id,
    recordNumber: data.record_number,
    stage: data.stage ?? "assessment",
    status: data.status,
    synopsis: data.synopsis ?? null,
    updatedAt: data.updated_at,
  };
}

async function fetchCaseEvidence(caseId: string): Promise<CaseEvidenceItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("case_evidence")
    .select(`
      id, item_number, title, description, type, status,
      storage_location, storage_facility, created_at,
      creator:profiles!created_by(full_name)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    createdAt: row.created_at,
    createdByName: row.creator?.full_name ?? null,
    description: row.description,
    id: row.id,
    itemNumber: row.item_number,
    status: row.status,
    storageFacility: row.storage_facility,
    storageLocation: row.storage_location,
    title: row.title,
    type: row.type,
  }));
}

async function fetchCaseTasks(caseId: string): Promise<CaseTask[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("case_tasks")
    .select(`
      id, title, description, status, priority, due_date,
      completed_at, sort_order, created_at,
      assignee:profiles!assigned_to(full_name)
    `)
    .eq("case_id", caseId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    assignedToName: row.assignee?.full_name ?? null,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    description: row.description,
    dueDate: row.due_date,
    id: row.id,
    priority: row.priority,
    sortOrder: row.sort_order,
    status: row.status,
    title: row.title,
  }));
}

async function fetchCaseNarratives(caseId: string): Promise<CaseNarrativeItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("case_narratives")
    .select(`
      id, title, content, created_at, updated_at,
      author:profiles!author_id(full_name)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    authorName: row.author?.full_name ?? null,
    content: row.content,
    createdAt: row.created_at,
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

async function fetchCaseCosts(caseId: string): Promise<CaseCostEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("case_costs")
    .select(`
      id, cost_type, amount, description, vendor, paid_date, created_at,
      creator:profiles!created_by(full_name)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    amount: Number(row.amount ?? 0),
    costType: row.cost_type,
    createdAt: row.created_at,
    createdByName: row.creator?.full_name ?? null,
    description: row.description,
    id: row.id,
    paidDate: row.paid_date,
    vendor: row.vendor,
  }));
}

async function fetchCaseRelatedRecords(
  caseId: string
): Promise<CaseRelatedRecord[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("case_related_records")
    .select(`
      id, related_record_id, related_record_type, relationship_description, linked_at,
      linker:profiles!linked_by(full_name)
    `)
    .eq("case_id", caseId)
    .order("linked_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    linkedAt: row.linked_at,
    linkedByName: row.linker?.full_name ?? null,
    relatedRecordId: row.related_record_id,
    relatedRecordType: row.related_record_type,
    relationshipDescription: row.relationship_description,
  }));
}

async function fetchCaseAudit(caseId: string): Promise<CaseAuditEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id, action, changes, created_at,
      actor:profiles!actor_id(full_name)
    `)
    .eq("entity_type", "case")
    .eq("entity_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    action: row.action,
    actorName: row.actor?.full_name ?? null,
    createdAt: row.created_at,
    details: row.changes ? JSON.stringify(row.changes) : null,
    id: row.id,
  }));
}

async function fetchCaseResources(caseId: string): Promise<CaseResource[]> {
  const supabase = getSupabase();
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

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    alias: row.alias,
    caseId: row.case_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : null,
    hoursLogged: Number(row.hours_logged ?? 0),
    id: row.id,
    name: row.profile?.full_name || row.name,
    notes: row.notes,
    orgId: row.org_id,
    profileId: row.profile_id,
    role: row.role,
    status: row.status,
    updatedAt: row.updated_at,
  }));
}

async function fetchCaseEvidenceTransfers(
  caseId: string
): Promise<CaseEvidenceTransfer[]> {
  const supabase = getSupabase();
  const { data: evidenceRows, error: evidenceError } = await supabase
    .from("case_evidence")
    .select("id, title, item_number")
    .eq("case_id", caseId);

  if (evidenceError) {
    throw evidenceError;
  }

  if (!(evidenceRows ?? []).length) {
    return [];
  }

  const evidenceMap = new Map(
    (evidenceRows ?? []).map((row) => [
      row.id,
      {
        itemNumber: row.item_number ?? null,
        title: row.title,
      },
    ])
  );

  const { data, error } = await supabase
    .from("case_evidence_transfers")
    .select(`
      id, evidence_id, notes, transfer_date, transfer_reason, created_at,
      transferredFrom:profiles!transferred_from_id(full_name),
      transferredTo:profiles!transferred_to_id(full_name)
    `)
    .in(
      "evidence_id",
      (evidenceRows ?? []).map((row) => row.id)
    )
    .order("transfer_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const evidence = evidenceMap.get(row.evidence_id);

    return {
      createdAt: row.created_at,
      evidenceId: row.evidence_id,
      evidenceItemNumber: evidence?.itemNumber ?? null,
      evidenceTitle: evidence?.title ?? "Evidence item",
      id: row.id,
      notes: row.notes ?? null,
      transferDate: row.transfer_date,
      transferReason: row.transfer_reason,
      transferredFromName: row.transferredFrom?.full_name ?? null,
      transferredToName: row.transferredTo?.full_name ?? null,
    };
  });
}

async function createCase(input: {
  caseType: string;
  escalationLevel?: string;
  orgId: string;
  propertyId: string | null;
  synopsis?: string;
}) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: recordNumber, error: numberError } = await supabase.rpc(
    "next_record_number",
    {
      p_org_id: input.orgId,
      p_prefix: "CSE",
    }
  );

  if (numberError || !recordNumber) {
    throw new Error("Failed to generate case record number");
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      case_type: input.caseType,
      created_by: user.id,
      escalation_level: input.escalationLevel || null,
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recordNumber,
      status: "open",
      synopsis: input.synopsis || null,
    })
    .select("id, record_number")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateCase(
  id: string,
  fields: Record<string, unknown>
) {
  const supabase = getSupabase();
  const { error } = await supabase.from("cases").update(fields).eq("id", id);

  if (error) {
    throw error;
  }
}

async function updateCaseStatus(id: string, status: string) {
  return updateCase(id, { status });
}

async function deleteCase(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("cases")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function createCaseEvidence(
  caseId: string,
  payload: {
    description?: string;
    externalIdentifier?: string;
    itemNumber?: string;
    status?: string;
    storageFacility?: string;
    storageLocation?: string;
    title: string;
    type: string;
  }
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("case_evidence").insert({
    case_id: caseId,
    created_by: user?.id || null,
    description: payload.description || null,
    external_identifier: payload.externalIdentifier || null,
    item_number: payload.itemNumber || null,
    status: payload.status || "collected",
    storage_facility: payload.storageFacility || null,
    storage_location: payload.storageLocation || null,
    title: payload.title,
    type: payload.type,
  });

  if (error) {
    throw error;
  }
}

async function createCaseTask(
  caseId: string,
  orgId: string,
  payload: {
    assignedTo?: string | null;
    description?: string;
    dueDate?: string | null;
    priority?: string;
    sortOrder?: number;
    title: string;
  }
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("case_tasks").insert({
    assigned_to: payload.assignedTo || null,
    case_id: caseId,
    created_by: user.id,
    description: payload.description || null,
    due_date: payload.dueDate || null,
    org_id: orgId,
    priority: payload.priority || "medium",
    sort_order: payload.sortOrder ?? 0,
    status: "pending",
    title: payload.title,
  });

  if (error) {
    throw error;
  }
}

async function createCaseNarrative(
  caseId: string,
  payload: {
    content: string;
    title: string;
  }
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("case_narratives").insert({
    author_id: user?.id || null,
    case_id: caseId,
    content: payload.content,
    title: payload.title,
  });

  if (error) {
    throw error;
  }
}

async function createCaseCost(
  caseId: string,
  orgId: string,
  payload: {
    amount: number;
    costType: string;
    description: string;
    paidDate?: string;
    vendor?: string;
  }
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("case_costs").insert({
    amount: payload.amount,
    case_id: caseId,
    cost_type: payload.costType,
    created_by: user.id,
    description: payload.description,
    org_id: orgId,
    paid_date: payload.paidDate || null,
    vendor: payload.vendor || null,
  });

  if (error) {
    throw error;
  }
}

async function createCaseRelatedRecord(
  caseId: string,
  orgId: string,
  payload: {
    relatedRecordId: string;
    relatedRecordType: string;
    relationshipDescription?: string;
  }
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("case_related_records").insert({
    case_id: caseId,
    linked_by: user.id,
    org_id: orgId,
    related_record_id: payload.relatedRecordId,
    related_record_type: payload.relatedRecordType,
    relationship_description: payload.relationshipDescription || null,
  });

  if (error) {
    throw error;
  }
}

async function createCaseResource(
  caseId: string,
  orgId: string,
  payload: {
    alias?: string;
    hourlyRate?: number;
    name: string;
    notes?: string;
    profileId?: string | null;
    role: string;
  }
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("case_resources").insert({
    alias: payload.alias || null,
    case_id: caseId,
    created_by: user.id,
    hourly_rate: payload.hourlyRate ?? null,
    hours_logged: 0,
    name: payload.name,
    notes: payload.notes || null,
    org_id: orgId,
    profile_id: payload.profileId || null,
    role: payload.role,
    status: "active",
  });

  if (error) {
    throw error;
  }
}

async function createCaseEvidenceTransfer(
  orgId: string,
  payload: {
    evidenceId: string;
    notes?: string;
    transferReason: string;
    transferredToId: string;
  }
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("case_evidence_transfers").insert({
    evidence_id: payload.evidenceId,
    notes: payload.notes || null,
    org_id: orgId,
    signature_acknowledged: true,
    transfer_reason: payload.transferReason,
    transferred_from_id: user?.id || null,
    transferred_to_id: payload.transferredToId,
  });

  if (error) {
    throw error;
  }
}

export function useCaseDetail(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseById(id),
    queryKey: ["cases", "detail", id],
  });
}

export function useCaseEvidence(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseEvidence(id),
    queryKey: ["cases", "evidence", id],
  });
}

export function useCaseTasks(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseTasks(id),
    queryKey: ["cases", "tasks", id],
  });
}

export function useCaseNarratives(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseNarratives(id),
    queryKey: ["cases", "narratives", id],
  });
}

export function useCaseCosts(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseCosts(id),
    queryKey: ["cases", "costs", id],
  });
}

export function useCaseRelatedRecords(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseRelatedRecords(id),
    queryKey: ["cases", "related-records", id],
  });
}

export function useCaseAudit(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseAudit(id),
    queryKey: ["cases", "audit", id],
  });
}

export function useCaseResources(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseResources(id),
    queryKey: ["cases", "resources", id],
  });
}

export function useCaseEvidenceTransfers(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchCaseEvidenceTransfers(id),
    queryKey: ["cases", "evidence-transfers", id],
  });
}

export function useCreateCaseMutation() {
  const queryClient = useQueryClient();
  const { orgId, propertyId } = useSessionContext();

  return useMutation({
    mutationFn: (input: {
      caseType: string;
      escalationLevel?: string;
      synopsis?: string;
    }) =>
      createCase({
        ...input,
        orgId: orgId!,
        propertyId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      fields: Record<string, unknown>;
      id: string;
    }) => updateCase(input.id, input.fields),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await queryClient.invalidateQueries({
        queryKey: ["cases", "detail", variables.id],
      });
    },
  });
}

export function useUpdateCaseStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      status: string;
    }) => updateCaseStatus(input.id, input.status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await queryClient.invalidateQueries({
        queryKey: ["cases", "detail", variables.id],
      });
    },
  });
}

export function useDeleteCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateCaseEvidenceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      caseId: string;
      description?: string;
      externalIdentifier?: string;
      itemNumber?: string;
      status?: string;
      storageFacility?: string;
      storageLocation?: string;
      title: string;
      type: string;
    }) => createCaseEvidence(input.caseId, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["cases", "evidence", variables.caseId],
      });
    },
  });
}

export function useCreateCaseTaskMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (input: {
      assignedTo?: string | null;
      caseId: string;
      description?: string;
      dueDate?: string | null;
      priority?: string;
      sortOrder?: number;
      title: string;
    }) => createCaseTask(input.caseId, orgId!, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["cases", "tasks", variables.caseId],
      });
    },
  });
}

export function useCreateCaseNarrativeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      caseId: string;
      content: string;
      title: string;
    }) => createCaseNarrative(input.caseId, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["cases", "narratives", variables.caseId],
      });
    },
  });
}

export function useCreateCaseCostMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (input: {
      amount: number;
      caseId: string;
      costType: string;
      description: string;
      paidDate?: string;
      vendor?: string;
    }) => createCaseCost(input.caseId, orgId!, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["cases", "costs", variables.caseId],
      });
    },
  });
}

export function useCreateCaseRelatedRecordMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (input: {
      caseId: string;
      relatedRecordId: string;
      relatedRecordType: string;
      relationshipDescription?: string;
    }) => createCaseRelatedRecord(input.caseId, orgId!, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["cases", "related-records", variables.caseId],
      });
    },
  });
}

export function useCreateCaseResourceMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (input: {
      alias?: string;
      caseId: string;
      hourlyRate?: number;
      name: string;
      notes?: string;
      profileId?: string | null;
      role: string;
    }) => createCaseResource(input.caseId, orgId!, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["cases", "resources", variables.caseId],
      });
    },
  });
}

export function useCreateCaseEvidenceTransferMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (input: {
      caseId: string;
      evidenceId: string;
      notes?: string;
      transferReason: string;
      transferredToId: string;
    }) => createCaseEvidenceTransfer(orgId!, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["cases", "evidence-transfers", variables.caseId],
      });
    },
  });
}
