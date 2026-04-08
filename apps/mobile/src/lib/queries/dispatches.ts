import {
  DispatchStatus,
} from "@eztrack/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  previewDispatches,
  previewOfficers,
} from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import { mergePendingDispatchRows } from "@/lib/offline/optimistic";
import {
  queueDispatchAssignment,
  queueDispatchStatusUpdate,
  shouldQueueMutationError,
  type QueuedDispatchAssignmentResult,
  type QueuedDispatchStatusResult,
} from "@/lib/offline/queue";
import type {
  QueuedAssignDispatchInput,
  QueuedUpdateDispatchStatusInput,
} from "@/lib/offline/types";
import {
  assignDispatchOfficer,
  clearDispatchRecord,
  createDispatchRecord,
  updateDispatchRecord,
  updateDispatchStatusRecord,
} from "@/lib/services/dispatches";
import { getSupabase } from "@/lib/supabase";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";

export interface DispatchCard {
  callSource: string | null;
  createdAt: string;
  description: string;
  dispatchCode: string;
  id: string;
  location: string;
  officerId: string | null;
  officerName: string | null;
  priority: "critical" | "high" | "medium" | "low";
  recordNumber: string;
  reporterName: string | null;
  status: string;
  sublocation: string | null;
}

export interface OfficerOnDuty {
  avatarUrl: string | null;
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export interface DispatchDetail {
  anonymous: boolean;
  assignedStaff: { fullName: string; id: string } | null;
  callSource: string | null;
  createdAt: string;
  createdBy: { fullName: string; id: string } | null;
  description: string | null;
  dispatchCode: string;
  id: string;
  location: { id: string; name: string } | null;
  orgId: string;
  priority: "critical" | "high" | "medium" | "low";
  propertyId: string | null;
  recordNumber: string;
  reporterName: string | null;
  reporterPhone: string | null;
  status: string;
  sublocation: string | null;
  updatedAt: string;
}

export interface DispatchTimelineEntry {
  actorName: string | null;
  details: string | null;
  event: string;
  id: string;
  timestamp: string;
}

export type UpdateDispatchStatusInput = QueuedUpdateDispatchStatusInput;
export type AssignDispatchInput = QueuedAssignDispatchInput;

export interface CreateDispatchInput {
  anonymous?: boolean;
  callSource?: string;
  description: string;
  dispatchCode: string;
  locationId: null | string;
  priority: "critical" | "high" | "medium" | "low";
  reporterName?: string;
  reporterPhone?: string;
  sublocation?: string;
}

export interface UpdateDispatchInput {
  anonymous?: boolean;
  callSource?: string;
  description?: string;
  dispatchCode?: string;
  dispatchId: string;
  priority?: "critical" | "high" | "medium" | "low";
  reporterName?: string;
  reporterPhone?: string;
  sublocation?: string;
}

async function fetchDispatches(orgId: string): Promise<DispatchCard[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dispatches")
    .select(`
      id,
      record_number,
      dispatch_code,
      description,
      priority,
      status,
      sublocation,
      reporter_name,
      call_source,
      created_at,
      assigned_staff_id,
      location:locations!location_id(id, name),
      officer:profiles!assigned_staff_id(id, full_name)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    callSource: row.call_source,
    createdAt: row.created_at,
    description: row.description ?? "No description",
    dispatchCode: row.dispatch_code,
    id: row.id,
    location: row.location?.name ?? "Unknown",
    officerId: row.assigned_staff_id,
    officerName: row.officer?.full_name ?? null,
    priority: row.priority,
    recordNumber: row.record_number,
    reporterName: row.reporter_name,
    status: row.status,
    sublocation: row.sublocation,
  }));
}

async function fetchOnDutyOfficers(): Promise<OfficerOnDuty[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("staff_status_records")
    .select(`
      id,
      status,
      updated_at,
      profile:profiles!staff_id(id, full_name, avatar_url)
    `)
    .neq("status", "off_duty")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    avatarUrl: row.profile?.avatar_url ?? null,
    id: row.profile?.id ?? row.id,
    name: row.profile?.full_name ?? "Unknown",
    status: row.status,
    updatedAt: row.updated_at,
  }));
}

async function fetchDispatchDetail(id: string): Promise<DispatchDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dispatches")
    .select(`
      *,
      location:locations!location_id(id, name),
      officer:profiles!assigned_staff_id(id, full_name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    anonymous: data.anonymous ?? false,
    assignedStaff: data.officer
      ? { fullName: data.officer.full_name, id: data.officer.id }
      : null,
    callSource: data.call_source,
    createdAt: data.created_at,
    createdBy: data.creator
      ? { fullName: data.creator.full_name, id: data.creator.id }
      : null,
    description: data.description,
    dispatchCode: data.dispatch_code,
    id: data.id,
    location: data.location ?? null,
    orgId: data.org_id,
    priority: data.priority,
    propertyId: data.property_id,
    recordNumber: data.record_number,
    reporterName: data.reporter_name,
    reporterPhone: data.reporter_phone,
    status: data.status,
    sublocation: data.sublocation,
    updatedAt: data.updated_at,
  };
}

async function fetchDispatchTimeline(
  dispatchId: string
): Promise<DispatchTimelineEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dispatch_timeline")
    .select(`
      id, event, details, timestamp,
      actor:profiles!actor_id(full_name)
    `)
    .eq("dispatch_id", dispatchId)
    .order("timestamp", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    actorName: row.actor?.full_name ?? null,
    details: row.details,
    event: row.event,
    id: row.id,
    timestamp: row.timestamp,
  }));
}

export function useDispatches() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["dispatches", "list", orgId ?? "preview"] as const;
  const cacheKey = usePreviewData || !orgId ? null : `dispatches:list:${orgId}`;

  useHydrateQueryFromCache<DispatchCard[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId)
  );

  const query = useQuery<DispatchCard[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewDispatches.map((dispatch) => ({ ...dispatch })))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchDispatches(orgId!),
            ttlMs: 3 * 60 * 1000,
          }),
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingDispatchRows(query.data, pendingActions),
  };
}

export function useDispatchDetail(id: string) {
  const { canAccessProtected, usePreviewData } = useSessionContext();

  return useQuery<DispatchDetail>({
    enabled: canAccessProtected && Boolean(id),
    queryFn: async () => {
      if (usePreviewData) {
        const match = previewDispatches.find((dispatch) => dispatch.id === id);

        if (!match) {
          throw new Error("Dispatch not found");
        }

        return {
          anonymous: false,
          assignedStaff: match.officerId
            ? {
                fullName: match.officerName ?? "Assigned unit",
                id: match.officerId,
              }
            : null,
          callSource: match.callSource,
          createdAt: match.createdAt,
          createdBy: null,
          description: match.description,
          dispatchCode: match.dispatchCode,
          id: match.id,
          location: {
            id: "preview-location",
            name: match.location,
          },
          orgId: "preview-org",
          priority: match.priority,
          propertyId: "preview-property",
          recordNumber: match.recordNumber,
          reporterName: match.reporterName,
          reporterPhone: null,
          status: match.status,
          sublocation: match.sublocation,
          updatedAt: match.createdAt,
        };
      }

      return fetchDispatchDetail(id);
    },
    queryKey: ["dispatches", "detail", id],
  });
}

export function useDispatchTimeline(id: string) {
  const { canAccessProtected, usePreviewData } = useSessionContext();

  return useQuery<DispatchTimelineEntry[]>({
    enabled: canAccessProtected && Boolean(id),
    queryFn: async () => {
      if (usePreviewData) {
        return [];
      }

      return fetchDispatchTimeline(id);
    },
    queryKey: ["dispatches", "timeline", id],
  });
}

export function useOnDutyOfficers() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["dispatches", "officers", orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId ? null : `dispatches:officers:${orgId}`;

  useHydrateQueryFromCache<OfficerOnDuty[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId)
  );

  return useQuery<OfficerOnDuty[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewOfficers.map((officer) => ({ ...officer })))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchOnDutyOfficers(),
            ttlMs: 60 * 1000,
          }),
    queryKey,
  });
}

export function useUpdateDispatchStatusMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async (input: UpdateDispatchStatusInput) => {
      if (!profile) {
        throw new Error("A profile is required before updating a dispatch.");
      }

      if (usePreviewData) {
        return {
          id: input.dispatchId,
          queued: false,
          status: input.nextStatus,
        };
      }

      const mutationProfile = {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      };

      if (!isOnline) {
        return queueDispatchStatusUpdate(mutationProfile, input);
      }

      try {
        const data = await updateDispatchStatusRecord(input);
        return {
          ...data,
          queued: false,
        };
      } catch (error) {
        if (shouldQueueMutationError(error)) {
          return queueDispatchStatusUpdate(mutationProfile, input);
        }

        throw error;
      }
    },
    onSuccess: async (
      _result:
        | { queued?: boolean; status: DispatchStatus }
        | QueuedDispatchStatusResult
    ) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}

export function useAssignDispatchOfficerMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async (input: AssignDispatchInput) => {
      if (!profile) {
        throw new Error("A profile is required before assigning a dispatch.");
      }

      if (usePreviewData) {
        return {
          assigned_staff_id: input.nextOfficerId,
          id: input.dispatchId,
          officer_name: input.nextOfficerName ?? null,
          queued: false,
        };
      }

      const mutationProfile = {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      };

      if (!isOnline) {
        return queueDispatchAssignment(mutationProfile, input);
      }

      try {
        const data = await assignDispatchOfficer(input);
        return {
          ...data,
          queued: false,
        };
      } catch (error) {
        if (shouldQueueMutationError(error)) {
          return queueDispatchAssignment(mutationProfile, input);
        }

        throw error;
      }
    },
    onSuccess: async (
      _result:
        | {
            assigned_staff_id: null | string;
            officer_name?: null | string;
            queued?: boolean;
          }
        | QueuedDispatchAssignmentResult
    ) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}

export function useCreateDispatchMutation() {
  const queryClient = useQueryClient();
  const { propertyId, orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateDispatchInput) => {
      if (usePreviewData) {
        return {
          id: `preview-dispatch-${Date.now()}`,
          queued: false,
          record_number: "DSP-PREVIEW",
        };
      }

      return createDispatchRecord({
        ...input,
        orgId: orgId!,
        propertyId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}

export function useUpdateDispatchMutation() {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdateDispatchInput) => {
      if (usePreviewData) {
        return {
          id: input.dispatchId,
          queued: false,
        };
      }

      await updateDispatchRecord(input.dispatchId, input);
      return {
        id: input.dispatchId,
        queued: false,
      };
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      await queryClient.invalidateQueries({
        queryKey: ["dispatches", "detail", variables.dispatchId],
      });
    },
  });
}

export function useClearDispatchMutation() {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: {
      clearCode: string;
      dispatchId: string;
      reason: string;
    }) => {
      if (usePreviewData) {
        return;
      }

      await clearDispatchRecord(input.dispatchId, {
        clearCode: input.clearCode,
        reason: input.reason,
      });
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      await queryClient.invalidateQueries({
        queryKey: ["dispatches", "detail", variables.dispatchId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["dispatches", "timeline", variables.dispatchId],
      });
    },
  });
}
