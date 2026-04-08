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
  queueDispatchStatusUpdate,
  shouldQueueMutationError,
  type QueuedDispatchStatusResult,
} from "@/lib/offline/queue";
import type { QueuedUpdateDispatchStatusInput } from "@/lib/offline/types";
import { updateDispatchStatusRecord } from "@/lib/services/dispatches";
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

export type UpdateDispatchStatusInput = QueuedUpdateDispatchStatusInput;

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
