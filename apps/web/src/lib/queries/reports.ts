import { getSupabaseBrowser } from "@/lib/supabase-browser";

export interface ReportResult {
  stats: { label: string; value: string; sub?: string }[];
  columns: { key: string; label: string; sortable?: boolean }[];
  rows: Record<string, unknown>[];
}

/* ── CSV export helper ── */
export function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Generic report fetcher ── */
export async function fetchReportData(
  orgId: string,
  reportType: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  switch (reportType) {
    case "incident-summary":
      return fetchIncidentSummary(orgId, params);
    case "dispatch-log":
    case "dispatch-performance":
      return fetchDispatchLog(orgId, params);
    case "daily-activity":
      return fetchDailyActivity(orgId, params);
    case "patron-flags":
      return fetchPatronFlags(orgId, params);
    case "case-status":
      return fetchCaseStatus(orgId, params);
    case "lost-found-inventory":
      return fetchLostFoundInventory(orgId, params);
    case "savings-losses":
    case "financial-summary":
      return fetchFinancialSummary(orgId, params);
    case "visitor-log":
      return fetchVisitorLog(orgId, params);
    default:
      return fetchIncidentSummary(orgId, params);
  }
}

/* ──────────────────────────────────────────────
   Individual report type fetchers
   ────────────────────────────────────────────── */

async function fetchIncidentSummary(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("incidents")
    .select("id, record_number, type, severity, status, synopsis, created_at, location:locations(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    number: r.record_number ?? "-",
    type: r.type ?? "-",
    severity: r.severity ?? "-",
    location: r.location?.name ?? "-",
    status: r.status ?? "-",
    synopsis: r.synopsis ?? "-",
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
  }));

  const total = rows.length;
  const critical = rows.filter((r) => r.severity === "Critical" || r.severity === "critical").length;
  const resolved = rows.filter((r) => r.status === "Resolved" || r.status === "Closed" || r.status === "resolved" || r.status === "closed").length;

  return {
    stats: [
      { label: "Total Incidents", value: String(total), sub: "Selected period" },
      { label: "Critical", value: String(critical), sub: `${total ? ((critical / total) * 100).toFixed(1) : 0}% of total` },
      { label: "Resolved", value: String(resolved), sub: `${total ? ((resolved / total) * 100).toFixed(1) : 0}% resolution rate` },
      { label: "Open", value: String(total - resolved) },
    ],
    columns: [
      { key: "number", label: "Incident #", sortable: true },
      { key: "type", label: "Type", sortable: true },
      { key: "severity", label: "Severity", sortable: true },
      { key: "location", label: "Location" },
      { key: "status", label: "Status", sortable: true },
      { key: "date", label: "Date", sortable: true },
    ],
    rows,
  };
}

async function fetchDispatchLog(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("dispatches")
    .select("id, record_number, description, status, priority, dispatched_at, arrived_at, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => {
    let responseTime = "-";
    if (r.dispatched_at && r.arrived_at) {
      const mins = (new Date(r.arrived_at).getTime() - new Date(r.dispatched_at).getTime()) / 60_000;
      responseTime = `${Math.round(mins * 10) / 10} min`;
    }
    return {
      id: r.id,
      number: r.record_number ?? "-",
      description: r.description ?? "-",
      priority: r.priority ?? "-",
      status: r.status ?? "-",
      responseTime,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
    };
  });

  const total = rows.length;
  const resolved = rows.filter((r) => r.status === "Resolved" || r.status === "Cleared" || r.status === "resolved" || r.status === "cleared").length;

  return {
    stats: [
      { label: "Total Dispatches", value: String(total), sub: "Selected period" },
      { label: "Resolved", value: String(resolved), sub: `${total ? ((resolved / total) * 100).toFixed(1) : 0}% rate` },
      { label: "Active", value: String(total - resolved) },
      { label: "Dispatches", value: String(total) },
    ],
    columns: [
      { key: "number", label: "Dispatch #", sortable: true },
      { key: "description", label: "Description" },
      { key: "priority", label: "Priority", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "responseTime", label: "Response Time", sortable: true },
      { key: "date", label: "Date", sortable: true },
    ],
    rows,
  };
}

async function fetchDailyActivity(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("daily_logs")
    .select("id, record_number, topic, priority, status, created_at, location:locations(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    number: r.record_number ?? "-",
    topic: r.topic ?? "-",
    priority: r.priority ?? "-",
    location: r.location?.name ?? "-",
    status: r.status ?? "-",
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
    time: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
  }));

  const total = rows.length;
  const highPriority = rows.filter((r) => r.priority === "High" || r.priority === "high").length;

  return {
    stats: [
      { label: "Total Entries", value: String(total), sub: "Selected period" },
      { label: "High Priority", value: String(highPriority), sub: `${total ? ((highPriority / total) * 100).toFixed(1) : 0}% of total` },
      { label: "Completed", value: String(rows.filter((r) => r.status === "Complete" || r.status === "complete" || r.status === "Closed" || r.status === "closed").length) },
      { label: "In Progress", value: String(rows.filter((r) => r.status === "In Progress" || r.status === "in_progress" || r.status === "Active" || r.status === "active").length) },
    ],
    columns: [
      { key: "date", label: "Date", sortable: true },
      { key: "time", label: "Time" },
      { key: "topic", label: "Topic", sortable: true },
      { key: "priority", label: "Priority", sortable: true },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
    rows,
  };
}

async function fetchPatronFlags(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("patrons")
    .select("id, first_name, last_name, flag, flag_reason, flag_expiry, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .not("flag", "is", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    patronName: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "-",
    flagType: r.flag ?? "-",
    reason: r.flag_reason ?? "-",
    issuedDate: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
    expiryDate: r.flag_expiry ? new Date(r.flag_expiry).toLocaleDateString() : "-",
    status: r.flag_expiry && new Date(r.flag_expiry) < new Date() ? "Expired" : "Active",
  }));

  const bans = rows.filter((r) => r.flagType === "Ban" || r.flagType === "ban").length;
  const watches = rows.filter((r) => r.flagType === "Watch" || r.flagType === "watch").length;

  return {
    stats: [
      { label: "Active Flags", value: String(rows.length), sub: "Current watch list" },
      { label: "Bans", value: String(bans) },
      { label: "Watches", value: String(watches) },
      { label: "Other", value: String(rows.length - bans - watches) },
    ],
    columns: [
      { key: "patronName", label: "Patron", sortable: true },
      { key: "flagType", label: "Flag Type", sortable: true },
      { key: "reason", label: "Reason" },
      { key: "issuedDate", label: "Issued", sortable: true },
      { key: "expiryDate", label: "Expiry", sortable: true },
      { key: "status", label: "Status" },
    ],
    rows,
  };
}

async function fetchCaseStatus(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("cases")
    .select("id, record_number, case_type, status, created_at, updated_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const now = Date.now();
  const rows = (data ?? []).map((r: any) => {
    const ageDays = r.created_at ? Math.floor((now - new Date(r.created_at).getTime()) / 86_400_000) : 0;
    return {
      id: r.id,
      caseNumber: r.record_number ?? "-",
      type: r.case_type ?? "-",
      status: r.status ?? "-",
      age: `${ageDays} days`,
      updated: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "-",
    };
  });

  const active = rows.filter((r) => r.status !== "Closed" && r.status !== "closed").length;

  return {
    stats: [
      { label: "Total Cases", value: String(rows.length), sub: "Selected period" },
      { label: "Active", value: String(active) },
      { label: "Closed", value: String(rows.length - active) },
      { label: "Cases", value: String(rows.length) },
    ],
    columns: [
      { key: "caseNumber", label: "Case #", sortable: true },
      { key: "type", label: "Type", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "age", label: "Age", sortable: true },
      { key: "updated", label: "Last Updated", sortable: true },
    ],
    rows,
  };
}

async function fetchLostFoundInventory(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("found_items")
    .select("id, record_number, description, status, category, created_at, storage_location")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    number: r.record_number ?? "-",
    description: r.description ?? "-",
    category: r.category ?? "-",
    status: r.status ?? "-",
    location: r.storage_location ?? "-",
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
  }));

  const claimed = rows.filter((r) => r.status === "Claimed" || r.status === "claimed" || r.status === "Returned" || r.status === "returned").length;

  return {
    stats: [
      { label: "Total Items", value: String(rows.length), sub: "Selected period" },
      { label: "Claimed/Returned", value: String(claimed) },
      { label: "Unclaimed", value: String(rows.length - claimed) },
      { label: "Items", value: String(rows.length) },
    ],
    columns: [
      { key: "number", label: "Item #", sortable: true },
      { key: "description", label: "Description" },
      { key: "category", label: "Category", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "location", label: "Storage" },
      { key: "date", label: "Date", sortable: true },
    ],
    rows,
  };
}

async function fetchFinancialSummary(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("incidents")
    .select("id, record_number, type, created_at, estimated_loss, recovered_amount")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => {
    const loss = Number(r.estimated_loss) || 0;
    const recovered = Number(r.recovered_amount) || 0;
    return {
      id: r.id,
      incidentRef: r.record_number ?? "-",
      type: r.type ?? "-",
      lossAmount: `$${loss.toLocaleString()}`,
      recovered: `$${recovered.toLocaleString()}`,
      netLoss: `$${(loss - recovered).toLocaleString()}`,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
    };
  });

  const totalLoss = (data ?? []).reduce((s, r: any) => s + (Number(r.estimated_loss) || 0), 0);
  const totalRecovered = (data ?? []).reduce((s, r: any) => s + (Number(r.recovered_amount) || 0), 0);

  return {
    stats: [
      { label: "Total Losses", value: `$${totalLoss.toLocaleString()}`, sub: "Selected period" },
      { label: "Recovered", value: `$${totalRecovered.toLocaleString()}`, sub: totalLoss ? `${((totalRecovered / totalLoss) * 100).toFixed(1)}% recovery rate` : "N/A" },
      { label: "Net Loss", value: `$${(totalLoss - totalRecovered).toLocaleString()}` },
      { label: "Records", value: String(rows.length) },
    ],
    columns: [
      { key: "incidentRef", label: "Incident Ref", sortable: true },
      { key: "type", label: "Type" },
      { key: "lossAmount", label: "Loss Amount", sortable: true },
      { key: "recovered", label: "Recovered", sortable: true },
      { key: "netLoss", label: "Net Loss" },
      { key: "date", label: "Date", sortable: true },
    ],
    rows,
  };
}

async function fetchVisitorLog(
  orgId: string,
  params: { dateFrom?: string; dateTo?: string }
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let query = supabase
    .from("visitors")
    .select("id, first_name, last_name, company, host_name, sign_in_time, sign_out_time, badge_number, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => {
    let duration = "-";
    if (r.sign_in_time && r.sign_out_time) {
      const mins = (new Date(r.sign_out_time).getTime() - new Date(r.sign_in_time).getTime()) / 60_000;
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      duration = `${h}h ${m}m`;
    } else if (r.sign_in_time) {
      duration = "On-site";
    }
    return {
      id: r.id,
      visitorName: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "-",
      company: r.company ?? "-",
      host: r.host_name ?? "-",
      signIn: r.sign_in_time ? new Date(r.sign_in_time).toLocaleString() : "-",
      signOut: r.sign_out_time ? new Date(r.sign_out_time).toLocaleString() : "-",
      duration,
      badge: r.badge_number ?? "-",
    };
  });

  const onSite = rows.filter((r) => r.duration === "On-site").length;

  return {
    stats: [
      { label: "Total Visits", value: String(rows.length), sub: "Selected period" },
      { label: "Currently On-site", value: String(onSite) },
      { label: "Signed Out", value: String(rows.length - onSite) },
      { label: "Visitors", value: String(rows.length) },
    ],
    columns: [
      { key: "visitorName", label: "Visitor", sortable: true },
      { key: "company", label: "Company" },
      { key: "host", label: "Host" },
      { key: "signIn", label: "Sign In", sortable: true },
      { key: "signOut", label: "Sign Out" },
      { key: "duration", label: "Duration" },
      { key: "badge", label: "Badge #" },
    ],
    rows,
  };
}
