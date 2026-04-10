import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface CountByLabel {
  count: number;
  label: string;
}

function groupCount<T>(
  rows: T[],
  keyFn: (row: T) => string | null | undefined
): CountByLabel[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    const key = keyFn(row) || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([label, count]) => ({
      count,
      label,
    }))
    .sort((a, b) => b.count - a.count);
}

async function fetchIncidentsByStatus(orgId: string): Promise<CountByLabel[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select("status")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return groupCount(data ?? [], (row: any) => row.status);
}

async function fetchIncidentsByType(orgId: string): Promise<CountByLabel[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select("incident_type")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return groupCount(data ?? [], (row: any) => row.incident_type);
}

async function fetchIncidentsOverTime(
  orgId: string,
  days = 30
): Promise<Array<{ count: number; date: string }>> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("incidents")
    .select("created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const map = new Map<string, number>();

  for (const row of data ?? []) {
    const key = row.created_at?.slice(0, 10) ?? "unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()].map(([date, count]) => ({
    count,
    date,
  }));
}

async function fetchDispatchResponseTimes(orgId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dispatches")
    .select("created_at, updated_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .in("status", ["cleared", "completed"]);

  if (error) {
    throw error;
  }

  const minutes = (data ?? [])
    .map((row: any) => {
      const created = new Date(row.created_at).getTime();
      const resolved = new Date(row.updated_at).getTime();
      return (resolved - created) / 60_000;
    })
    .filter((value) => value >= 0 && value < 1440);

  if (!minutes.length) {
    return {
      avgMinutes: 0,
      medianMinutes: 0,
    };
  }

  const avgMinutes =
    minutes.reduce((sum, value) => sum + value, 0) / minutes.length;
  const sorted = [...minutes].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  return {
    avgMinutes: Math.round(avgMinutes * 10) / 10,
    medianMinutes: Math.round(median * 10) / 10,
  };
}

async function fetchPatronFlagDistribution(
  orgId: string
): Promise<CountByLabel[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("patrons")
    .select("flag")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return groupCount(data ?? [], (row: any) => row.flag);
}

async function fetchModuleActivityCounts(orgId: string) {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceISO = since.toISOString();

  const [incidents, dispatches, dailyLogs, cases, workOrders, foundItems] =
    await Promise.all([
      supabase
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", sinceISO),
      supabase
        .from("dispatches")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", sinceISO),
      supabase
        .from("daily_logs")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", sinceISO),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", sinceISO),
      supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", sinceISO),
      supabase
        .from("found_items")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", sinceISO),
    ]);

  return [
    { count: incidents.count ?? 0, label: "Incidents" },
    { count: dispatches.count ?? 0, label: "Dispatches" },
    { count: dailyLogs.count ?? 0, label: "Daily Logs" },
    { count: cases.count ?? 0, label: "Cases" },
    { count: workOrders.count ?? 0, label: "Work Orders" },
    { count: foundItems.count ?? 0, label: "Lost & Found" },
  ].sort((a, b) => b.count - a.count);
}

export function useIncidentsByStatus() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchIncidentsByStatus(orgId!),
    queryKey: ["analytics", "incidents-by-status", orgId],
  });
}

export function useIncidentsByType() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchIncidentsByType(orgId!),
    queryKey: ["analytics", "incidents-by-type", orgId],
  });
}

export function useIncidentsOverTime(days = 30) {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchIncidentsOverTime(orgId!, days),
    queryKey: ["analytics", "incidents-over-time", orgId, days],
  });
}

export function useDispatchResponseTimes() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchDispatchResponseTimes(orgId!),
    queryKey: ["analytics", "dispatch-response-times", orgId],
  });
}

export function usePatronFlagDistribution() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchPatronFlagDistribution(orgId!),
    queryKey: ["analytics", "patron-flag-distribution", orgId],
  });
}

export function useModuleActivityCounts() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchModuleActivityCounts(orgId!),
    queryKey: ["analytics", "module-activity-counts", orgId],
  });
}
