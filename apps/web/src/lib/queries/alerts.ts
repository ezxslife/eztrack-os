import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface AlertRow {
  id: string;
  orgId: string;
  alertType: string | null;
  title: string;
  message: string | null;
  severity: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  [key: string]: unknown;
}

/* ─── Fetch alerts for an org ────────────────────── */

export async function fetchAlerts(orgId: string): Promise<AlertRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    orgId: row.org_id,
    alertType: row.alert_type,
    title: row.title,
    message: row.message,
    severity: row.severity,
    acknowledgedBy: row.acknowledged_by,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  }));
}

/* ─── Acknowledge an alert ───────────────────────── */

export async function acknowledgeAlert(alertId: string, userId: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("alerts")
    .update({
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  if (error) throw error;
}

/* ─── Resolve (soft-delete) an alert ─────────────── */

export async function resolveAlert(alertId: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("alerts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", alertId);

  if (error) throw error;
}

/* ─── Create an alert (testing / manual) ─────────── */

export async function createAlert(data: {
  orgId: string;
  alertType?: string;
  title: string;
  message?: string;
  severity?: string;
}) {
  const supabase = getSupabaseBrowser();

  const { data: result, error } = await supabase
    .from("alerts")
    .insert({
      org_id: data.orgId,
      alert_type: data.alertType || "general",
      title: data.title,
      message: data.message || null,
      severity: (data.severity || "medium") as import("@/types").Enums<"incident_severity">,
    })
    .select("id")
    .single();

  if (error) throw error;
  return result;
}
