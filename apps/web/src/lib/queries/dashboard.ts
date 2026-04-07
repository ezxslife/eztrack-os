import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface DashboardStats {
  totalIncidents: number;
  activeDispatches: number;
  dailyLogsToday: number;
  officersOnDuty: number;
}

export interface RecentActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown> | null;
  actorName: string | null;
  createdAt: string;
}

/* ─── Fetch dashboard stat counts ────────────────── */

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseBrowser();

  // Run all four counts in parallel
  const [incidentsRes, dispatchesRes, logsRes, officersRes] = await Promise.all([
    // Total incidents (not deleted, not archived)
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .not("status", "eq", "archived"),

    // Active dispatches (pending, scheduled, in_progress, on_scene, overdue)
    supabase
      .from("dispatches")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["pending", "scheduled", "in_progress", "on_scene", "overdue"]),

    // Daily logs created today
    supabase
      .from("daily_logs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", new Date().toISOString().split("T")[0]),

    // Officers on duty (any status except off_duty)
    supabase
      .from("staff_status_records")
      .select("id", { count: "exact", head: true })
      .neq("status", "off_duty"),
  ]);

  return {
    totalIncidents: incidentsRes.count ?? 0,
    activeDispatches: dispatchesRes.count ?? 0,
    dailyLogsToday: logsRes.count ?? 0,
    officersOnDuty: officersRes.count ?? 0,
  };
}

/* ─── Fetch recent activity feed ─────────────────── */

export async function fetchRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id, entity_type, entity_id, action, changes, created_at,
      actor:profiles!actor_id(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    changes: row.changes,
    actorName: row.actor?.full_name || null,
    createdAt: row.created_at,
  }));
}
