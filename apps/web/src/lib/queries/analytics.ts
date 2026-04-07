import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ── Helper: group & count an array by a key ── */
function groupCount<T>(arr: T[], keyFn: (item: T) => string): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  arr.forEach((item) => {
    const key = keyFn(item) || "Unknown";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/* ── Incidents grouped by status ── */
export async function fetchIncidentsByStatus(orgId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("incidents")
    .select("status")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  if (error) throw error;
  return groupCount(data ?? [], (r) => r.status);
}

/* ── Incidents grouped by type ── */
export async function fetchIncidentsByType(orgId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("incidents")
    .select("incident_type")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  if (error) throw error;
  return groupCount(data ?? [], (r) => r.incident_type);
}

/* ── Incidents over time (last N days) ── */
export async function fetchIncidentsOverTime(orgId: string, days = 30) {
  const supabase = getSupabaseBrowser();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("incidents")
    .select("created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Group by date string (YYYY-MM-DD)
  const map: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    const day = r.created_at?.slice(0, 10) ?? "unknown";
    map[day] = (map[day] || 0) + 1;
  });

  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

/* ── Dispatch response times (avg / median) ── */
export async function fetchDispatchResponseTimes(orgId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("dispatches")
    .select("created_at, updated_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .in("status", ["cleared", "completed"]);

  if (error) throw error;

  const minutes = (data ?? [])
    .map((r) => {
      const created = new Date(r.created_at).getTime();
      const resolved = new Date(r.updated_at).getTime();
      return (resolved - created) / 60_000;
    })
    .filter((m) => m >= 0 && m < 1440);

  if (minutes.length === 0) return { avg_minutes: 0, median_minutes: 0 };

  const avg = minutes.reduce((s, v) => s + v, 0) / minutes.length;
  const sorted = [...minutes].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return { avg_minutes: Math.round(avg * 10) / 10, median_minutes: Math.round(median * 10) / 10 };
}

/* ── Patron flag distribution ── */
export async function fetchPatronFlagDistribution(orgId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patrons")
    .select("flag")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  if (error) throw error;
  return groupCount(data ?? [], (r) => r.flag);
}

/* ── Module activity counts (last 30 days) ── */
export async function fetchModuleActivityCounts(orgId: string) {
  const supabase = getSupabaseBrowser();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceISO = since.toISOString();

  const [incidents, dispatches, dailyLogs, cases, workOrders, foundItems] = await Promise.all([
    supabase.from("incidents").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("deleted_at", null).gte("created_at", sinceISO),
    supabase.from("dispatches").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("deleted_at", null).gte("created_at", sinceISO),
    supabase.from("daily_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("deleted_at", null).gte("created_at", sinceISO),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("deleted_at", null).gte("created_at", sinceISO),
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("deleted_at", null).gte("created_at", sinceISO),
    supabase.from("found_items").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("deleted_at", null).gte("created_at", sinceISO),
  ]);

  return [
    { module: "Incidents", count: incidents.count ?? 0 },
    { module: "Dispatches", count: dispatches.count ?? 0 },
    { module: "Daily Logs", count: dailyLogs.count ?? 0 },
    { module: "Cases", count: cases.count ?? 0 },
    { module: "Work Orders", count: workOrders.count ?? 0 },
    { module: "Lost & Found", count: foundItems.count ?? 0 },
  ].sort((a, b) => b.count - a.count);
}
