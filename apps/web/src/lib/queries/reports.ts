import {
  REPORT_DEFINITIONS,
  buildReportRoute,
  canonicalizeReportSlug,
  getDefaultReportDateRange,
  getReportDefinition,
  type ReportCatalogItem,
  type ReportDefinition,
} from "@eztrack/shared";

import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Database } from "@/types/database";

export {
  REPORT_DEFINITIONS,
  buildReportRoute,
  getDefaultReportDateRange,
  getReportDefinition,
};
export type { ReportCatalogItem, ReportDefinition };

export interface ReportResult {
  stats: { label: string; value: string; sub?: string }[];
  columns: { key: string; label: string; sortable?: boolean }[];
  rows: Record<string, unknown>[];
}

async function fetchScopedTableSummary(
  table: keyof Database["public"]["Tables"],
  orgId: string,
  options?: {
    createdColumn?: string;
    deletedColumn?: string | null;
    extra?: (query: any) => any;
  },
) {
  const supabase = getSupabaseBrowser();
  const createdColumn = options?.createdColumn ?? "created_at";
  let query = (supabase
    .from(table as any)
    .select(`id, ${createdColumn}`, { count: "exact" })
    .eq("org_id", orgId)
    .order(createdColumn, { ascending: false })
    .limit(1)) as any;

  if (options?.deletedColumn !== null) {
    query = query.is(options?.deletedColumn ?? "deleted_at", null);
  }

  if (options?.extra) {
    query = options.extra(query);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    count: count ?? 0,
    latestActivity: data?.[0]?.[createdColumn] ?? null,
  };
}

export async function fetchReportCatalog(orgId: string): Promise<ReportCatalogItem[]> {
  const supabase = getSupabaseBrowser();
  const [
    dailyLogs,
    incidents,
    dispatches,
    cases,
    visitors,
    patrons,
    foundItems,
    incidentFinancials,
    caseCosts,
  ] = await Promise.all([
    fetchScopedTableSummary("daily_logs", orgId),
    fetchScopedTableSummary("incidents", orgId),
    fetchScopedTableSummary("dispatches", orgId),
    fetchScopedTableSummary("cases", orgId),
    fetchScopedTableSummary("visitors", orgId),
    fetchScopedTableSummary("patrons", orgId, {
      extra: (query) => query.not("flag", "is", null),
    }),
    fetchScopedTableSummary("found_items", orgId),
    supabase
      .from("incident_financials")
      .select("id, created_at, incident:incidents!incident_id(org_id)")
      .order("created_at", { ascending: false }),
    supabase
      .from("case_costs")
      .select("id, created_at, related_case:cases!case_id(org_id)")
      .order("created_at", { ascending: false }),
  ]);

  if (incidentFinancials.error) throw incidentFinancials.error;
  if (caseCosts.error) throw caseCosts.error;

  const financialRows = [
    ...((incidentFinancials.data ?? []).filter((row: any) => row.incident?.org_id === orgId)),
    ...((caseCosts.data ?? []).filter((row: any) => row.related_case?.org_id === orgId)),
  ];
  const financialLatest = financialRows
    .map((row: any) => row.created_at as string | null)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
  const financialCount = financialRows.length;

  return REPORT_DEFINITIONS.map((definition) => {
    switch (definition.slug) {
      case "daily-activity":
        return { ...definition, recordCount: dailyLogs.count, latestActivity: dailyLogs.latestActivity };
      case "incident-summary":
        return { ...definition, recordCount: incidents.count, latestActivity: incidents.latestActivity };
      case "dispatch-performance":
        return { ...definition, recordCount: dispatches.count, latestActivity: dispatches.latestActivity };
      case "case-status":
        return { ...definition, recordCount: cases.count, latestActivity: cases.latestActivity };
      case "visitor-log":
        return { ...definition, recordCount: visitors.count, latestActivity: visitors.latestActivity };
      case "patron-flags":
        return { ...definition, recordCount: patrons.count, latestActivity: patrons.latestActivity };
      case "lost-found-inventory":
        return { ...definition, recordCount: foundItems.count, latestActivity: foundItems.latestActivity };
      case "savings-losses":
        return { ...definition, recordCount: financialCount, latestActivity: financialLatest };
      default:
        return { ...definition, recordCount: 0, latestActivity: null };
    }
  });
}

export interface ReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  extraFilterValue?: string;
  propertyId?: string;
}

function applyDateRangeFilters(query: any, params: ReportQueryParams) {
  let next = query;

  if (params.dateFrom) {
    next = next.gte("created_at", params.dateFrom);
  }

  if (params.dateTo) {
    next = next.lte("created_at", `${params.dateTo}T23:59:59`);
  }

  return next;
}

function applyCommonReportFilters(
  query: any,
  params: ReportQueryParams,
  options?: {
    extraFilterColumn?: string;
    propertyColumn?: string;
  },
) {
  let next = applyDateRangeFilters(query, params);

  if (params.propertyId && options?.propertyColumn) {
    next = next.eq(options.propertyColumn, params.propertyId);
  }

  if (params.extraFilterValue && options?.extraFilterColumn) {
    next = next.eq(options.extraFilterColumn, params.extraFilterValue);
  }

  return next;
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
  params: ReportQueryParams
): Promise<ReportResult> {
  switch (canonicalizeReportSlug(reportType)) {
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
    case "lost-found-inventory":
      return fetchLostFoundInventory(orgId, params);
    default:
      throw new Error("Unsupported report type");
  }
}

/* ──────────────────────────────────────────────
   Individual report type fetchers
   ────────────────────────────────────────────── */

async function fetchIncidentSummary(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  const query = applyCommonReportFilters(
    supabase
    .from("incidents")
    .select("id, record_number, incident_type, severity, status, synopsis, created_at, location:locations(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "severity",
      propertyColumn: "property_id",
    },
  );

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    number: r.record_number ?? "-",
    type: r.incident_type ?? "-",
    severity: r.severity ?? "-",
    location: r.location?.name ?? "-",
    status: r.status ?? "-",
    synopsis: r.synopsis ?? "-",
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
  }));

  const total = rows.length;
  const critical = rows.filter((r: any) => r.severity === "Critical" || r.severity === "critical").length;
  const resolved = rows.filter((r: any) => r.status === "Resolved" || r.status === "Closed" || r.status === "resolved" || r.status === "closed").length;

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
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  const query = applyCommonReportFilters(
    supabase
    .from("dispatches")
    .select("id, record_number, description, status, priority, created_at, updated_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "priority",
      propertyColumn: "property_id",
    },
  );

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => {
    let responseTime = "-";
    if (["cleared", "completed"].includes(r.status) && r.updated_at && r.created_at) {
      const mins = (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 60_000;
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
  const resolved = rows.filter((r: any) => r.status === "Resolved" || r.status === "Cleared" || r.status === "resolved" || r.status === "cleared").length;

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
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  const query = applyCommonReportFilters(
    supabase
    .from("daily_logs")
    .select("id, record_number, topic, priority, status, created_at, location:locations(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "priority",
      propertyColumn: "property_id",
    },
  );

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
  const highPriority = rows.filter((r: any) => r.priority === "High" || r.priority === "high").length;

  return {
    stats: [
      { label: "Total Entries", value: String(total), sub: "Selected period" },
      { label: "High Priority", value: String(highPriority), sub: `${total ? ((highPriority / total) * 100).toFixed(1) : 0}% of total` },
      { label: "Completed", value: String(rows.filter((r: any) => r.status === "Complete" || r.status === "complete" || r.status === "Closed" || r.status === "closed").length) },
      { label: "In Progress", value: String(rows.filter((r: any) => r.status === "In Progress" || r.status === "in_progress" || r.status === "Active" || r.status === "active").length) },
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
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  const query = applyCommonReportFilters(
    supabase
    .from("patrons")
    .select("id, first_name, last_name, flag, flag_reason, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .not("flag", "is", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "flag",
    },
  );

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    patronName: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "-",
    flagType: r.flag ?? "-",
    reason: r.flag_reason ?? "-",
    issuedDate: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
    expiryDate: "-",
    status: "Active",
  }));

  const bans = rows.filter((r: any) => r.flagType === "Ban" || r.flagType === "ban").length;
  const watches = rows.filter((r: any) => r.flagType === "Watch" || r.flagType === "watch").length;

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
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  const query = applyCommonReportFilters(
    supabase
    .from("cases")
    .select("id, record_number, case_type, status, created_at, updated_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "status",
      propertyColumn: "property_id",
    },
  );

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

  const active = rows.filter((r: any) => r.status !== "Closed" && r.status !== "closed").length;

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
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  const query = applyCommonReportFilters(
    supabase
    .from("found_items")
    .select("id, record_number, description, status, category, created_at, storage_location")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "status",
      propertyColumn: "property_id",
    },
  );

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

  const claimed = rows.filter((r: any) => r.status === "Claimed" || r.status === "claimed" || r.status === "Returned" || r.status === "returned").length;

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
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  let incidentQuery = supabase
    .from("incident_financials")
    .select("id, incident_id, entry_type, amount, description, created_at, incident:incidents!incident_id(record_number, incident_type, org_id, property_id)")
    .order("created_at", { ascending: false });
  let caseQuery = supabase
    .from("case_costs")
    .select("id, case_id, cost_type, amount, description, created_at, related_case:cases!case_id(record_number, case_type, org_id, property_id)")
    .order("created_at", { ascending: false });

  incidentQuery = applyDateRangeFilters(incidentQuery, params);
  caseQuery = applyDateRangeFilters(caseQuery, params);

  const [{ data: incidentData, error: incidentError }, { data: caseData, error: caseError }] =
    await Promise.all([incidentQuery, caseQuery]);
  if (incidentError) throw incidentError;
  if (caseError) throw caseError;

  const incidentRows = (incidentData ?? [])
    .filter(
      (row: any) =>
        row.incident?.org_id === orgId &&
        (!params.propertyId || row.incident?.property_id === params.propertyId),
    )
    .map((r: any) => ({
    id: r.id,
    incidentRef: r.incident?.record_number ?? "-",
    type: r.incident?.incident_type ?? "incident",
    lossAmount:
      r.entry_type === "loss" ? `$${Number(r.amount || 0).toLocaleString()}` : "$0",
    recovered:
      r.entry_type === "saving" ? `$${Number(r.amount || 0).toLocaleString()}` : "$0",
    netLoss:
      r.entry_type === "loss"
        ? `$${Number(r.amount || 0).toLocaleString()}`
        : `$${-Number(r.amount || 0).toLocaleString()}`,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
  }));

  const caseRows = (caseData ?? [])
    .filter(
      (row: any) =>
        row.related_case?.org_id === orgId &&
        (!params.propertyId || row.related_case?.property_id === params.propertyId),
    )
    .map((r: any) => ({
    id: r.id,
    incidentRef: r.related_case?.record_number ?? "-",
    type: r.related_case?.case_type ?? (r.cost_type || "case"),
    lossAmount: `$${Number(r.amount || 0).toLocaleString()}`,
    recovered: "$0",
    netLoss: `$${Number(r.amount || 0).toLocaleString()}`,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
  }));

  const rows = [...incidentRows, ...caseRows];

  const filteredIncidentFinancials = (incidentData ?? []).filter(
    (row: any) =>
      row.incident?.org_id === orgId &&
      (!params.propertyId || row.incident?.property_id === params.propertyId),
  );
  const filteredCaseCosts = (caseData ?? []).filter(
    (row: any) =>
      row.related_case?.org_id === orgId &&
      (!params.propertyId || row.related_case?.property_id === params.propertyId),
  );

  const totalLoss =
    filteredIncidentFinancials.reduce(
      (sum, row: any) => sum + (row.entry_type === "loss" ? Number(row.amount || 0) : 0),
      0,
    ) +
    filteredCaseCosts.reduce((sum, row: any) => sum + Number(row.amount || 0), 0);
  const totalRecovered = filteredIncidentFinancials.reduce(
    (sum, row: any) => sum + (row.entry_type === "saving" ? Number(row.amount || 0) : 0),
    0,
  );

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
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabaseBrowser();
  const query = applyCommonReportFilters(
    supabase
    .from("visitors")
    .select("id, first_name, last_name, company, host_name, checked_in_at, checked_out_at, purpose, created_at, status")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "status",
      propertyColumn: "property_id",
    },
  );

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => {
    let duration = "-";
    if (r.checked_in_at && r.checked_out_at) {
      const mins = (new Date(r.checked_out_at).getTime() - new Date(r.checked_in_at).getTime()) / 60_000;
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      duration = `${h}h ${m}m`;
    } else if (r.checked_in_at) {
      duration = "On-site";
    }
    return {
      id: r.id,
      visitorName: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "-",
      company: r.company ?? "-",
      host: r.host_name ?? "-",
      signIn: r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : "-",
      signOut: r.checked_out_at ? new Date(r.checked_out_at).toLocaleString() : "-",
      duration,
      badge: r.purpose ?? "-",
    };
  });

  const onSite = rows.filter((r: any) => r.duration === "On-site").length;

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
