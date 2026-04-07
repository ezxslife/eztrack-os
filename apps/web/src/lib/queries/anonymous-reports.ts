import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface AnonReportRow {
  id: string;
  category: string;
  status: string;
  reportText: string;
  submittedAt: string;
  adminNotes: string | null;
  [key: string]: unknown;
}

/* ─── Fetch anonymous reports list ──────────────── */

export async function fetchAnonReports(): Promise<AnonReportRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("anonymous_reports")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    category: row.category,
    status: row.status,
    reportText: row.report_text,
    submittedAt: row.submitted_at,
    adminNotes: row.admin_notes,
  }));
}

/* ─── Submit an anonymous report ────────────────── */

export async function submitAnonReport(input: {
  orgId: string;
  propertyId?: string | null;
  category: string;
  reportText: string;
}) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("anonymous_reports")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId || null,
      category: input.category,
      report_text: input.reportText,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update report status (admin) ──────────────── */

export async function updateAnonReportStatus(id: string, status: string, adminNotes?: string) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = { status };
  if (adminNotes !== undefined) payload.admin_notes = adminNotes;

  const { error } = await supabase
    .from("anonymous_reports")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}
