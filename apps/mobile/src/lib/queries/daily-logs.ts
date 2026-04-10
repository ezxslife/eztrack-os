import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DailyLogStatus } from "@eztrack/shared";
import { previewDailyLogs } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import {
  findQueuedDailyLogDetail,
  mergePendingDailyLogDetail,
  mergePendingDailyLogs,
} from "@/lib/offline/optimistic";
import {
  queueDailyLogCreate,
  queueDailyLogUpdate,
  shouldQueueMutationError,
  type QueuedMutationResult,
} from "@/lib/offline/queue";
import type {
  QueuedCreateDailyLogInput,
  QueuedUpdateDailyLogInput,
} from "@/lib/offline/types";
import {
  createDailyLogRecord,
  deleteDailyLogRecord,
  updateDailyLogStatusRecord,
  updateDailyLogRecord,
} from "@/lib/services/daily-logs";
import { getSupabase } from "@/lib/supabase";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";

export interface DailyLogRow {
  createdAt: string;
  createdBy: string | null;
  id: string;
  location: string;
  priority: "critical" | "high" | "medium" | "low";
  recordNumber: string;
  status: string;
  synopsis: string;
  topic: string;
}

export interface DailyLogDetail {
  createdAt: string;
  createdBy: string | null;
  id: string;
  location: string;
  locationId: string;
  orgId: string;
  priority: "critical" | "high" | "medium" | "low";
  propertyId: string | null;
  recordNumber: string;
  status: string;
  synopsis: string;
  topic: string;
  updatedAt: string;
}

export type CreateDailyLogInput = QueuedCreateDailyLogInput;
export type UpdateDailyLogInput = QueuedUpdateDailyLogInput;

async function fetchDailyLogs(orgId: string): Promise<DailyLogRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_logs")
    .select(`
      id,
      record_number,
      topic,
      priority,
      status,
      synopsis,
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
    createdAt: row.created_at,
    createdBy: row.creator?.full_name ?? null,
    id: row.id,
    location: row.location?.name ?? "Unknown",
    priority: row.priority,
    recordNumber: row.record_number,
    status: row.status,
    synopsis: row.synopsis ?? "",
    topic: row.topic,
  }));
}

async function fetchDailyLogDetail(orgId: string, id: string): Promise<DailyLogDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_logs")
    .select(`
      id,
      org_id,
      property_id,
      record_number,
      topic,
      priority,
      status,
      synopsis,
      created_at,
      updated_at,
      location_id,
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

  const row: any = data;

  return {
    createdAt: row.created_at,
    createdBy: row.creator?.full_name ?? null,
    id: row.id,
    location: row.location?.name ?? "Unknown",
    locationId: row.location_id,
    orgId: row.org_id,
    priority: row.priority,
    propertyId: row.property_id,
    recordNumber: row.record_number,
    status: row.status,
    synopsis: row.synopsis ?? "",
    topic: row.topic,
    updatedAt: row.updated_at,
  };
}

export function useDailyLogs() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["daily-logs", "list", orgId ?? "preview"] as const;
  const cacheKey = usePreviewData || !orgId ? null : `daily-logs:list:${orgId}`;

  useHydrateQueryFromCache<DailyLogRow[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId)
  );

  const query = useQuery<DailyLogRow[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewDailyLogs.map((log) => ({ ...log })))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchDailyLogs(orgId!),
            ttlMs: 5 * 60 * 1000,
          }),
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingDailyLogs(query.data, pendingActions),
  };
}

export function useDailyLogDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["daily-logs", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `daily-logs:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<DailyLogDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  const query = useQuery<DailyLogDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: async () => {
      if (usePreviewData) {
        const match =
          previewDailyLogs.find((log) => log.id === id) ?? previewDailyLogs[0];

        return {
          createdAt: match.createdAt,
          createdBy: match.createdBy,
          id: match.id,
          location: match.location,
          locationId: "preview-location",
          orgId: "preview-org",
          priority: match.priority,
          propertyId: "preview-property",
          recordNumber: match.recordNumber,
          status: match.status,
          synopsis: match.synopsis,
          topic: match.topic,
          updatedAt: match.createdAt,
        };
      }

      const queuedDetail = findQueuedDailyLogDetail(id, pendingActions);

      if (queuedDetail) {
        return queuedDetail;
      }

      return readThroughCachedQuery({
        cacheKey: cacheKey!,
        fetcher: () => fetchDailyLogDetail(orgId!, id),
        ttlMs: 10 * 60 * 1000,
      });
    },
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingDailyLogDetail(query.data, pendingActions, id),
  };
}

export function useCreateDailyLogMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async (input: CreateDailyLogInput) => {
      if (!profile) {
        throw new Error("A profile is required before creating a daily log.");
      }

      if (usePreviewData) {
        return {
          id: `preview-log-${Date.now()}`,
          record_number: "DL-PREVIEW",
          queued: false,
        };
      }

      const mutationProfile = {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      };

      if (!isOnline) {
        return queueDailyLogCreate(mutationProfile, input);
      }

      try {
        const data = await createDailyLogRecord(input, mutationProfile);
        return {
          ...data,
          queued: false,
        };
      } catch (error) {
        if (shouldQueueMutationError(error)) {
          return queueDailyLogCreate(mutationProfile, input);
        }

        throw error;
      }
    },
    onSuccess: async (_result: { queued?: boolean } | QueuedMutationResult) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
    },
  });
}

export function useUpdateDailyLogMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async (input: UpdateDailyLogInput) => {
      if (!profile) {
        throw new Error("A profile is required before updating a daily log.");
      }

      if (usePreviewData) {
        return {
          id: input.dailyLogId,
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
        return queueDailyLogUpdate(mutationProfile, input);
      }

      try {
        const data = await updateDailyLogRecord(input, mutationProfile);
        return {
          ...data,
          queued: false,
        };
      } catch (error) {
        if (shouldQueueMutationError(error)) {
          return queueDailyLogUpdate(mutationProfile, input);
        }

        throw error;
      }
    },
    onSuccess: async (
      _result:
        | { queued?: boolean; record_number: string; status: DailyLogStatus }
        | QueuedMutationResult
    ) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
    },
  });
}

export function useUpdateDailyLogStatusMutation() {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: {
      dailyLogId: string;
      status: string;
    }) => {
      if (usePreviewData) {
        return;
      }

      await updateDailyLogStatusRecord(input.dailyLogId, input.status);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      await queryClient.invalidateQueries({
        queryKey: ["daily-logs", "detail", variables.dailyLogId],
      });
    },
  });
}

export function useDeleteDailyLogMutation() {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (dailyLogId: string) => {
      if (usePreviewData) {
        return;
      }

      await deleteDailyLogRecord(dailyLogId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
    },
  });
}
