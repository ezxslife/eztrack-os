import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DailyLogStatus } from "@eztrack/shared";
import { previewDailyLogs } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import { mergePendingDailyLogs } from "@/lib/offline/optimistic";
import {
  queueDailyLogCreate,
  shouldQueueMutationError,
  type QueuedMutationResult,
} from "@/lib/offline/queue";
import type { QueuedCreateDailyLogInput } from "@/lib/offline/types";
import { createDailyLogRecord } from "@/lib/services/daily-logs";
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

export type CreateDailyLogInput = QueuedCreateDailyLogInput;

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
