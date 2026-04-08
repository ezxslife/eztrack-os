import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type IncidentStatus,
  type IncidentSeverity,
} from "@eztrack/shared";

import {
  previewIncidentFinancials,
  previewIncidentNarratives,
  previewIncidentParticipants,
  previewIncidents,
} from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import { uploadIncidentMediaFile } from "@/lib/media/upload";
import {
  findQueuedIncidentDetail,
  mergePendingIncidentDetail,
  mergePendingIncidentNarratives,
  mergePendingIncidentRows,
} from "@/lib/offline/optimistic";
import {
  queueIncidentCreate,
  queueIncidentNarrativeCreate,
  queueIncidentUpdate,
  shouldQueueMutationError,
  type QueuedIncidentNarrativeResult,
  type QueuedMutationResult,
} from "@/lib/offline/queue";
import type {
  QueuedCreateIncidentInput,
  QueuedCreateIncidentNarrativeInput,
  QueuedUpdateIncidentInput,
} from "@/lib/offline/types";
import {
  createIncidentRecord,
  createIncidentNarrativeRecord,
  updateIncidentRecord,
} from "@/lib/services/incidents";
import { getSupabase } from "@/lib/supabase";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";

export interface IncidentRow {
  assignedTo: string | null;
  createdAt: string;
  id: string;
  location: string;
  recordNumber: string;
  reportedBy: string | null;
  severity: string;
  status: string;
  synopsis: string;
  type: string;
}

export interface IncidentDetail {
  createdAt: string;
  creatorName: string | null;
  description: string | null;
  disposition: string | null;
  id: string;
  location: string;
  orgId: string;
  propertyId: string | null;
  recordNumber: string;
  reportedBy: string | null;
  severity: string;
  status: string;
  synopsis: string;
  type: string;
  updatedAt: string;
}

export interface IncidentNarrative {
  authorName: string | null;
  content: string;
  createdAt: string;
  id: string;
  title: string;
}

export interface IncidentParticipant {
  description: string | null;
  firstName: string;
  id: string;
  lastName: string;
  personType: string;
  primaryRole: string;
}

export interface IncidentFinancial {
  amount: number;
  createdAt: string;
  createdBy: string | null;
  description: string | null;
  entryType: string;
  id: string;
}

export interface RelatedIncident {
  id: string;
  linkedAt: string;
  linkedBy: string | null;
  reason: string | null;
  recordNumber: string;
  relatedIncidentId: string;
  relationshipType: string;
  status: string;
  type: string;
}

export interface IncidentShare {
  expiresAt: string | null;
  id: string;
  isExpired: boolean;
  permissionLevel: string;
  sharedAt: string;
  sharedByName: string | null;
  sharedWithName: string | null;
  sharedWithRole: string | null;
  sharedWithUserId: string | null;
}

export interface IncidentMediaItem {
  createdAt: string;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  id: string;
  incidentId: string;
  mediaType: string | null;
  mimeType: string | null;
  orgId: string;
  storageBucket: string;
  title: string | null;
  updatedAt: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
}

export interface IncidentForm {
  completedAt: string | null;
  completedByName: string | null;
  createdAt: string;
  formData: unknown;
  formType: string;
  id: string;
  isOfficial: boolean;
}

export interface IncidentDocLogEntry {
  action: string;
  actorName: string | null;
  createdAt: string;
  details: string | null;
  id: string;
}

export type CreateIncidentInput = QueuedCreateIncidentInput;
export type CreateIncidentNarrativeInput = QueuedCreateIncidentNarrativeInput;
export type UpdateIncidentInput = QueuedUpdateIncidentInput;
export interface CreateIncidentParticipantInput {
  description?: string;
  firstName: string;
  incidentId: string;
  lastName: string;
  personType: string;
  primaryRole: string;
}
export interface CreateIncidentFinancialInput {
  amount: number;
  description?: string;
  entryType: string;
  incidentId: string;
}
export interface CreateIncidentShareInput {
  expiresAt?: string;
  incidentId: string;
  permissionLevel: string;
  sharedWithRole?: string | null;
  sharedWithUserId?: string | null;
}
export interface LinkRelatedIncidentInput {
  incidentId: string;
  reason?: string;
  relatedIncidentId: string;
  relationshipType: string;
}
export interface CreateIncidentMediaInput {
  description?: string;
  fileName: string;
  fileSize?: number;
  fileUri: string;
  incidentId: string;
  mediaType?: string;
  mimeType?: string;
  title?: string;
}
export interface SaveIncidentFormInput {
  formData: Record<string, unknown>;
  formId?: string;
  formType: string;
  incidentId: string;
  isOfficial?: boolean;
  markComplete?: boolean;
}

async function fetchIncidents(orgId: string): Promise<IncidentRow[]> {
  const supabase = getSupabase();
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
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    assignedTo: row.creator?.full_name ?? null,
    createdAt: row.created_at,
    id: row.id,
    location: row.location?.name ?? "Unknown",
    recordNumber: row.record_number,
    reportedBy: row.reported_by,
    severity: row.severity,
    status: row.status,
    synopsis: row.synopsis ?? "",
    type: row.incident_type,
  }));
}

async function fetchIncidentDetail(orgId: string, id: string): Promise<IncidentDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      *,
      location:locations!location_id(id, name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    createdAt: data.created_at,
    creatorName: data.creator?.full_name ?? null,
    description: data.description,
    disposition: data.disposition,
    id: data.id,
    location: data.location?.name ?? "Unknown",
    orgId: data.org_id,
    propertyId: data.property_id,
    recordNumber: data.record_number,
    reportedBy: data.reported_by,
    severity: data.severity,
    status: data.status,
    synopsis: data.synopsis ?? "",
    type: data.incident_type,
    updatedAt: data.updated_at,
  };
}

async function fetchIncidentNarratives(id: string): Promise<IncidentNarrative[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_narratives")
    .select(`
      id,
      title,
      content,
      created_at,
      author:profiles!author_id(full_name)
    `)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    authorName: row.author?.full_name ?? null,
    content: row.content,
    createdAt: row.created_at,
    id: row.id,
    title: row.title || "Narrative",
  }));
}

async function fetchIncidentParticipants(id: string): Promise<IncidentParticipant[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_participants")
    .select("id, person_type, first_name, last_name, primary_role, description")
    .eq("incident_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    description: row.description,
    firstName: row.first_name,
    id: row.id,
    lastName: row.last_name,
    personType: row.person_type,
    primaryRole: row.primary_role,
  }));
}

async function fetchIncidentFinancials(id: string): Promise<IncidentFinancial[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_financials")
    .select(`
      id,
      entry_type,
      amount,
      description,
      created_at,
      creator:profiles!created_by(full_name)
    `)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    amount: Number(row.amount ?? 0),
    createdAt: row.created_at,
    createdBy: row.creator?.full_name ?? null,
    description: row.description,
    entryType: row.entry_type,
    id: row.id,
  }));
}

async function fetchRelatedIncidents(id: string): Promise<RelatedIncident[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("related_incidents")
    .select(`
      id, incident_id_related, relationship_type, reason, linked_at,
      linker:profiles!linked_by(full_name),
      related:incidents!incident_id_related(id, record_number, incident_type, status)
    `)
    .eq("incident_id_primary", id)
    .order("linked_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    linkedAt: row.linked_at,
    linkedBy: row.linker?.full_name ?? null,
    reason: row.reason ?? null,
    recordNumber: row.related?.record_number ?? "Unknown",
    relatedIncidentId: row.incident_id_related,
    relationshipType: row.relationship_type,
    status: row.related?.status ?? "unknown",
    type: row.related?.incident_type ?? "Unknown",
  }));
}

async function fetchIncidentShares(id: string): Promise<IncidentShare[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_shares")
    .select(`
      id, shared_with_user_id, shared_with_role, permission_level, shared_at, expires_at,
      sharedBy:profiles!shared_by_id(full_name),
      sharedWithUser:profiles!shared_with_user_id(full_name)
    `)
    .eq("incident_id", id)
    .order("shared_at", { ascending: false });

  if (error) {
    throw error;
  }

  const now = new Date();

  return (data ?? []).map((row: any) => ({
    expiresAt: row.expires_at ?? null,
    id: row.id,
    isExpired: row.expires_at ? new Date(row.expires_at) < now : false,
    permissionLevel: row.permission_level,
    sharedAt: row.shared_at,
    sharedByName: row.sharedBy?.full_name ?? null,
    sharedWithName:
      row.sharedWithUser?.full_name ?? row.shared_with_role ?? "Unknown",
    sharedWithRole: row.shared_with_role ?? null,
    sharedWithUserId: row.shared_with_user_id ?? null,
  }));
}

async function fetchIncidentMedia(id: string): Promise<IncidentMediaItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_media")
    .select(`
      id, incident_id, org_id, media_type, title, description,
      file_name, file_path, file_size, mime_type, storage_bucket,
      uploaded_by, created_at, updated_at,
      uploader:profiles!uploaded_by(full_name)
    `)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    createdAt: row.created_at,
    description: row.description ?? null,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    id: row.id,
    incidentId: row.incident_id,
    mediaType: row.media_type ?? null,
    mimeType: row.mime_type ?? null,
    orgId: row.org_id,
    storageBucket: row.storage_bucket,
    title: row.title ?? null,
    updatedAt: row.updated_at,
    uploadedBy: row.uploaded_by ?? null,
    uploadedByName: row.uploader?.full_name ?? null,
  }));
}

async function fetchIncidentForms(id: string): Promise<IncidentForm[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_forms")
    .select(`
      id, form_type, form_data, completed_at, is_official, created_at,
      completedBy:profiles!completed_by(full_name)
    `)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    completedAt: row.completed_at ?? null,
    completedByName: row.completedBy?.full_name ?? null,
    createdAt: row.created_at,
    formData: row.form_data,
    formType: row.form_type,
    id: row.id,
    isOfficial: Boolean(row.is_official),
  }));
}

async function fetchIncidentDocLog(id: string): Promise<IncidentDocLogEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id, action, changes, created_at,
      actor:profiles!actor_id(full_name)
    `)
    .eq("entity_type", "incident")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

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

async function saveIncidentFormRecord(
  input: SaveIncidentFormInput,
  orgId: string
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const payload = {
    completed_at: input.markComplete ? new Date().toISOString() : null,
    completed_by: user.id,
    form_data: input.formData,
    form_type: input.formType,
    incident_id: input.incidentId,
    is_official: Boolean(input.isOfficial),
    org_id: orgId,
    updated_at: new Date().toISOString(),
  };

  if (input.formId) {
    const { error } = await supabase
      .from("incident_forms")
      .update(payload)
      .eq("id", input.formId);

    if (error) {
      throw error;
    }

    return input.formId;
  }

  const { data, error } = await supabase
    .from("incident_forms")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
      form_version: "1.0",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function createIncidentParticipantRecord(
  input: CreateIncidentParticipantInput
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("incident_participants")
    .insert({
      description: input.description || null,
      first_name: input.firstName,
      incident_id: input.incidentId,
      last_name: input.lastName,
      person_type: input.personType,
      primary_role: input.primaryRole,
    });

  if (error) {
    throw error;
  }
}

async function createIncidentFinancialRecordMobile(
  input: CreateIncidentFinancialInput,
  userId: string
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("incident_financials")
    .insert({
      amount: input.amount,
      created_by: userId,
      description: input.description || null,
      entry_type: input.entryType,
      incident_id: input.incidentId,
    });

  if (error) {
    throw error;
  }
}

async function createIncidentShareRecord(
  input: CreateIncidentShareInput,
  orgId: string
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("incident_shares").insert({
    expires_at: input.expiresAt || null,
    incident_id: input.incidentId,
    org_id: orgId,
    permission_level: input.permissionLevel,
    shared_by_id: user.id,
    shared_with_role: input.sharedWithRole || null,
    shared_with_user_id: input.sharedWithUserId || null,
  });

  if (error) {
    throw error;
  }
}

async function linkRelatedIncidentRecord(
  input: LinkRelatedIncidentInput,
  orgId: string
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("related_incidents").insert({
    incident_id_primary: input.incidentId,
    incident_id_related: input.relatedIncidentId,
    linked_by: user.id,
    org_id: orgId,
    reason: input.reason || null,
    relationship_type: input.relationshipType,
  });

  if (error) {
    throw error;
  }
}

async function createIncidentMediaRecord(
  input: CreateIncidentMediaInput,
  orgId: string
) {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const filePath = await uploadIncidentMediaFile({
    fileName: input.fileName,
    fileUri: input.fileUri,
    incidentId: input.incidentId,
    mimeType: input.mimeType ?? null,
  });

  const { error } = await supabase.from("incident_media").insert({
    description: input.description || null,
    file_name: input.fileName,
    file_path: filePath,
    file_size: input.fileSize ?? null,
    incident_id: input.incidentId,
    media_type: input.mediaType || null,
    mime_type: input.mimeType || null,
    org_id: orgId,
    storage_bucket: "incident-media",
    title: input.title || null,
    uploaded_by: user.id,
  });

  if (error) {
    throw error;
  }
}

async function deleteIncidentMediaRecord(id: string) {
  const supabase = getSupabase();
  const { data: mediaRow, error: fetchError } = await supabase
    .from("incident_media")
    .select("file_path, storage_bucket")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (mediaRow?.file_path) {
    const { error: storageError } = await supabase.storage
      .from(mediaRow.storage_bucket || "incident-media")
      .remove([mediaRow.file_path]);

    if (storageError) {
      throw storageError;
    }
  }

  const { error } = await supabase.from("incident_media").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

async function deleteIncidentShareRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("incident_shares").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

async function deleteRelatedIncidentRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("related_incidents").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

async function transferIncidentOwnershipRecord(
  id: string,
  newOwnerId: string
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("incidents")
    .update({ created_by: newOwnerId })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function setIncidentLockStateRecord(id: string, locked: boolean) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("incidents")
    .update({ status: locked ? "closed" : "open" })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function deleteIncidentRecordMobile(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("incidents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useIncidents() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "list", orgId ?? "preview"] as const;
  const cacheKey = usePreviewData || !orgId ? null : `incidents:list:${orgId}`;

  useHydrateQueryFromCache<IncidentRow[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId)
  );

  const query = useQuery<IncidentRow[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidents.map((incident) => ({ ...incident })))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchIncidents(orgId!),
            ttlMs: 5 * 60 * 1000,
          }),
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingIncidentRows(query.data, pendingActions),
  };
}

export function useIncidentDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `incidents:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentDetail>(
    queryKey,
    cacheKey,
    canAccessProtected &&
      !usePreviewData &&
      Boolean(orgId) &&
      Boolean(id)
  );

  const query = useQuery<IncidentDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: async () => {
      if (usePreviewData) {
        const match = previewIncidents.find((incident) => incident.id === id) ?? previewIncidents[0];
        return {
          createdAt: match.createdAt,
          creatorName: match.assignedTo,
          description: match.synopsis,
          disposition: null,
          id: match.id,
          location: match.location,
          orgId: "preview-org",
          propertyId: "preview-property",
          recordNumber: match.recordNumber,
          reportedBy: match.reportedBy,
          severity: match.severity,
          status: match.status,
          synopsis: match.synopsis,
          type: match.type,
          updatedAt: match.createdAt,
        } satisfies IncidentDetail;
      }

      const queuedDetail = findQueuedIncidentDetail(id, pendingActions);

      if (queuedDetail) {
        return queuedDetail;
      }

      return readThroughCachedQuery({
        cacheKey: cacheKey!,
        fetcher: () => fetchIncidentDetail(orgId!, id),
        ttlMs: 10 * 60 * 1000,
      });
    },
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingIncidentDetail(query.data, pendingActions, id),
  };
}

export function useIncidentNarratives(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "narratives", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id
      ? null
      : `incidents:narratives:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentNarrative[]>(
    queryKey,
    cacheKey,
    canAccessProtected &&
      !usePreviewData &&
      Boolean(orgId) &&
      Boolean(id)
  );

  const query = useQuery<IncidentNarrative[]>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidentNarratives[id] ?? [])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchIncidentNarratives(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingIncidentNarratives(query.data, pendingActions, id),
  };
}

export function useIncidentParticipants(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "participants", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id
      ? null
      : `incidents:participants:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentParticipant[]>(
    queryKey,
    cacheKey,
    canAccessProtected &&
      !usePreviewData &&
      Boolean(orgId) &&
      Boolean(id)
  );

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidentParticipants[id] ?? [])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchIncidentParticipants(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });
}

export function useIncidentFinancials(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "financials", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id
      ? null
      : `incidents:financials:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentFinancial[]>(
    queryKey,
    cacheKey,
    canAccessProtected &&
      !usePreviewData &&
      Boolean(orgId) &&
      Boolean(id)
  );

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidentFinancials[id] ?? [])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchIncidentFinancials(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });
}

export function useIncidentRelatedIncidents(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "related", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `incidents:related:${orgId}:${id}`;

  useHydrateQueryFromCache<RelatedIncident[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve([])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchRelatedIncidents(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });
}

export function useIncidentShares(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "shares", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `incidents:shares:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentShare[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve([])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchIncidentShares(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });
}

export function useIncidentMedia(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "media", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `incidents:media:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentMediaItem[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve([])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchIncidentMedia(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });
}

export function useIncidentForms(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "forms", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `incidents:forms:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentForm[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve([])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchIncidentForms(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });
}

export function useSaveIncidentFormMutation() {
  const queryClient = useQueryClient();
  const { orgId, profile, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: SaveIncidentFormInput) => {
      if (usePreviewData) {
        return input.formId ?? `preview-form-${Date.now()}`;
      }

      return saveIncidentFormRecord(input, orgId!);
    },
    onSuccess: async (_data, variables) => {
      if (usePreviewData) {
        queryClient.setQueryData<IncidentForm[]>(
          ["incidents", "forms", variables.incidentId, "preview"],
          (current) => {
            const nextForm: IncidentForm = {
              completedAt: variables.markComplete ? new Date().toISOString() : null,
              completedByName:
                variables.markComplete ? profile?.full_name ?? "Preview Operator" : null,
              createdAt: new Date().toISOString(),
              formData: variables.formData,
              formType: variables.formType,
              id: variables.formId ?? `preview-form-${Date.now()}`,
              isOfficial: Boolean(variables.isOfficial),
            };
            const filtered = (current ?? []).filter((form) => form.id !== nextForm.id);
            return [nextForm, ...filtered];
          }
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["incidents", "forms", variables.incidentId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "doc-log", variables.incidentId],
      });
    },
  });
}

export function useIncidentDocLog(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["incidents", "doc-log", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `incidents:doc-log:${orgId}:${id}`;

  useHydrateQueryFromCache<IncidentDocLogEntry[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve([])
        : findQueuedIncidentDetail(id, pendingActions)
          ? Promise.resolve([])
          : readThroughCachedQuery({
              cacheKey: cacheKey!,
              fetcher: () => fetchIncidentDocLog(id),
              ttlMs: 10 * 60 * 1000,
            }),
    queryKey,
  });
}

export function useCreateIncidentMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async (input: CreateIncidentInput) => {
      if (!profile) {
        throw new Error("A profile is required before creating an incident.");
      }

      if (usePreviewData) {
        return {
          id: `preview-incident-${Date.now()}`,
          record_number: "INC-PREVIEW",
          queued: false,
        };
      }

      const mutationProfile = {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      };

      if (!isOnline) {
        return queueIncidentCreate(mutationProfile, input);
      }

      try {
        const data = await createIncidentRecord(input, mutationProfile);
        return {
          ...data,
          queued: false,
        };
      } catch (error) {
        if (shouldQueueMutationError(error)) {
          return queueIncidentCreate(mutationProfile, input);
        }

        throw error;
      }
    },
    onSuccess: async (_result: { queued?: boolean } | QueuedMutationResult) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

export function useUpdateIncidentMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async (input: UpdateIncidentInput) => {
      if (!profile) {
        throw new Error("A profile is required before updating an incident.");
      }

      if (usePreviewData) {
        return {
          id: input.incidentId,
          queued: false,
          record_number: input.recordNumber,
          status: input.status,
        };
      }

      const mutationProfile = {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      };

      if (!isOnline) {
        return queueIncidentUpdate(mutationProfile, input);
      }

      try {
        const data = await updateIncidentRecord(input, mutationProfile);
        return {
          ...data,
          queued: false,
        };
      } catch (error) {
        if (shouldQueueMutationError(error)) {
          return queueIncidentUpdate(mutationProfile, input);
        }

        throw error;
      }
    },
    onSuccess: async (
      _result:
        | { queued?: boolean; record_number: string; status: IncidentStatus }
        | QueuedMutationResult
    ) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

export function useCreateIncidentNarrativeMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async (input: CreateIncidentNarrativeInput) => {
      if (!profile) {
        throw new Error("A profile is required before adding a narrative.");
      }

      if (usePreviewData) {
        return {
          id: `preview-narrative-${Date.now()}`,
          queued: false,
          title: input.title?.trim() || "Narrative",
        };
      }

      const mutationProfile = {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      };

      if (!isOnline) {
        return queueIncidentNarrativeCreate(mutationProfile, input);
      }

      try {
        const data = await createIncidentNarrativeRecord(input, mutationProfile);
        return {
          ...data,
          queued: false,
        };
      } catch (error) {
        if (shouldQueueMutationError(error)) {
          return queueIncidentNarrativeCreate(mutationProfile, input);
        }

        throw error;
      }
    },
    onSuccess: async (
      _result:
        | { queued?: boolean; title: string }
        | QueuedIncidentNarrativeResult
    ) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

export function useCreateIncidentParticipantMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateIncidentParticipantInput) => {
      if (!profile) {
        throw new Error("A profile is required before adding a participant.");
      }

      if (usePreviewData) {
        return {
          id: `preview-participant-${Date.now()}`,
          queued: false,
        };
      }

      await createIncidentParticipantRecord(input);
      return { queued: false };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

export function useCreateIncidentFinancialMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateIncidentFinancialInput) => {
      if (!profile) {
        throw new Error("A profile is required before adding a financial entry.");
      }

      if (usePreviewData) {
        return {
          id: `preview-financial-${Date.now()}`,
          queued: false,
        };
      }

      await createIncidentFinancialRecordMobile(input, profile.id);
      return { queued: false };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

export function useCreateIncidentShareMutation() {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateIncidentShareInput) => {
      if (usePreviewData) {
        return { id: `preview-share-${Date.now()}`, queued: false };
      }

      await createIncidentShareRecord(input, orgId!);
      return { queued: false };
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "shares", variables.incidentId],
      });
    },
  });
}

export function useLinkRelatedIncidentMutation() {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: LinkRelatedIncidentInput) => {
      if (usePreviewData) {
        return { id: `preview-related-${Date.now()}`, queued: false };
      }

      await linkRelatedIncidentRecord(input, orgId!);
      return { queued: false };
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "related", variables.incidentId],
      });
    },
  });
}

export function useCreateIncidentMediaMutation() {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateIncidentMediaInput) => {
      if (usePreviewData) {
        return { id: `preview-media-${Date.now()}`, queued: false };
      }

      await createIncidentMediaRecord(input, orgId!);
      return { queued: false };
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "media", variables.incidentId],
      });
    },
  });
}

export function useDeleteIncidentMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; incidentId: string }) => {
      await deleteIncidentMediaRecord(input.id);
      return input;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "media", variables.incidentId],
      });
    },
  });
}

export function useDeleteIncidentShareMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; incidentId: string }) => {
      await deleteIncidentShareRecord(input.id);
      return input;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "shares", variables.incidentId],
      });
    },
  });
}

export function useDeleteRelatedIncidentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; incidentId: string }) => {
      await deleteRelatedIncidentRecord(input.id);
      return input;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "related", variables.incidentId],
      });
    },
  });
}

export function useTransferIncidentOwnershipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; newOwnerId: string }) => {
      await transferIncidentOwnershipRecord(input.id, input.newOwnerId);
      return input;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "detail", variables.id],
      });
    },
  });
}

export function useSetIncidentLockStateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; locked: boolean }) => {
      await setIncidentLockStateRecord(input.id, input.locked);
      return input;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      await queryClient.invalidateQueries({
        queryKey: ["incidents", "detail", variables.id],
      });
    },
  });
}

export function useDeleteIncidentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteIncidentRecordMobile(id);
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
