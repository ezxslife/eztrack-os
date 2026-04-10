import { useQuery } from "@tanstack/react-query";

import { previewDashboardStats, previewRecentActivity } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import {
  mergePendingDashboardStats,
  mergePendingRecentActivity,
} from "@/lib/offline/optimistic";
import { getSupabase } from "@/lib/supabase";
import { useOfflineStore } from "@/stores/offline-store";

export interface DashboardStats {
  activeDispatches: number;
  dailyLogsToday: number;
  officersOnDuty: number;
  totalIncidents: number;
}

export interface RecentActivityItem {
  action: string;
  actorName: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
  entityId: string;
  entityType: string;
  id: string;
}

async function fetchDashboardStats(orgId: string): Promise<DashboardStats> {
  const supabase = getSupabase();
  const [incidentsRes, dispatchesRes, logsRes, officersRes] = await Promise.all([
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .not("status", "eq", "archived"),
    supabase
      .from("dispatches")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .in("status", ["pending", "scheduled", "in_progress", "on_scene", "overdue"]),
    supabase
      .from("daily_logs")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .gte("created_at", new Date().toISOString().split("T")[0]),
    supabase
      .from("staff_status_records")
      .select("id", { count: "exact", head: true })
      .neq("status", "off_duty"),
  ]);

  return {
    activeDispatches: dispatchesRes.count ?? 0,
    dailyLogsToday: logsRes.count ?? 0,
    officersOnDuty: officersRes.count ?? 0,
    totalIncidents: incidentsRes.count ?? 0,
  };
}

async function fetchRecentActivity(orgId: string, limit = 8): Promise<RecentActivityItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id,
      entity_type,
      entity_id,
      action,
      changes,
      created_at,
      actor:profiles!actor_id(full_name)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    action: row.action,
    actorName: row.actor?.full_name ?? null,
    changes: row.changes,
    createdAt: row.created_at,
    entityId: row.entity_id,
    entityType: row.entity_type,
    id: row.id,
  }));
}

export function useDashboardStats() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["dashboard", "stats", orgId ?? "preview"] as const;
  const cacheKey = usePreviewData || !orgId ? null : `dashboard:stats:${orgId}`;

  useHydrateQueryFromCache<DashboardStats>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId)
  );

  const query = useQuery({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewDashboardStats)
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchDashboardStats(orgId!),
            ttlMs: 2 * 60 * 1000,
          }),
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingDashboardStats(query.data, pendingActions),
  };
}

export function useRecentActivity(limit = 8) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const queryKey = ["dashboard", "activity", orgId ?? "preview", limit] as const;
  const cacheKey =
    usePreviewData || !orgId
      ? null
      : `dashboard:activity:${orgId}:${limit}`;

  useHydrateQueryFromCache<RecentActivityItem[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId)
  );

  const query = useQuery({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewRecentActivity.slice(0, limit))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchRecentActivity(orgId!, limit),
            ttlMs: 2 * 60 * 1000,
          }),
    queryKey,
  });

  return {
    ...query,
    data: usePreviewData
      ? query.data
      : mergePendingRecentActivity(query.data, pendingActions),
  };
}
