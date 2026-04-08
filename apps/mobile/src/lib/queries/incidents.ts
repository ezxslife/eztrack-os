import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
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
import {
  findQueuedIncidentDetail,
  mergePendingIncidentRows,
} from "@/lib/offline/optimistic";
import {
  queueIncidentCreate,
  shouldQueueMutationError,
  type QueuedMutationResult,
} from "@/lib/offline/queue";
import type { QueuedCreateIncidentInput } from "@/lib/offline/types";
import { createIncidentRecord } from "@/lib/services/incidents";
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

export type CreateIncidentInput = QueuedCreateIncidentInput;

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

  return useQuery({
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

  return useQuery({
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
