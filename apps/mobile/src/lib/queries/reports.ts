import {
  REPORT_DEFINITIONS,
  canonicalizeReportSlug,
  type ReportCatalogItem,
} from "@eztrack/shared";
import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface ReportResult {
  columns: Array<{ key: string; label: string; sortable?: boolean }>;
  rows: Record<string, unknown>[];
  stats: Array<{ label: string; sub?: string; value: string }>;
}

export interface ReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  extraFilterValue?: string;
  propertyId?: string;
}

type SummaryRow = Record<string, unknown>;

async function fetchScopedTableSummary(
  table: string,
  orgId: string,
  options?: {
    createdColumn?: string;
    deletedColumn?: string | null;
    extra?: (query: any) => any;
  }
) {
  const supabase = getSupabase();
  const createdColumn = options?.createdColumn ?? "created_at";
  let query = supabase
    .from(table as any)
    .select(`id, ${createdColumn}`, { count: "exact" })
    .eq("org_id", orgId)
    .order(createdColumn, { ascending: false })
    .limit(1);

  if (options?.deletedColumn !== null) {
    query = query.is(options?.deletedColumn ?? "deleted_at", null);
  }

  if (options?.extra) {
    query = options.extra(query);
  }

  const { count, data, error } = await query;

  if (error) {
    throw error;
  }

  const firstRow =
    Array.isArray(data) && data.length > 0
      ? (data[0] as unknown as SummaryRow)
      : null;
  const latestActivityValue = firstRow?.[createdColumn];

  return {
    count: count ?? 0,
    latestActivity:
      typeof latestActivityValue === "string" ? latestActivityValue : null,
  };
}

export async function fetchReportCatalog(orgId: string): Promise<ReportCatalogItem[]> {
  const supabase = getSupabase();
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
      .select(
        "id, created_at, incident:incidents!incident_id(org_id)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("case_costs")
      .select("id, created_at, related_case:cases!case_id(org_id)")
      .order("created_at", { ascending: false }),
  ]);

  if (incidentFinancials.error) {
    throw incidentFinancials.error;
  }

  if (caseCosts.error) {
    throw caseCosts.error;
  }

  const financialRows = [
    ...((incidentFinancials.data ?? []).filter(
      (row: any) => row.incident?.org_id === orgId
    ) as any[]),
    ...((caseCosts.data ?? []).filter(
      (row: any) => row.related_case?.org_id === orgId
    ) as any[]),
  ];
  const financialLatest =
    financialRows
      .map((row: any) => row.created_at as string | null)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  const financialCount = financialRows.length;

  return REPORT_DEFINITIONS.map((definition) => {
    switch (definition.slug) {
      case "daily-activity":
        return {
          ...definition,
          latestActivity: dailyLogs.latestActivity,
          recordCount: dailyLogs.count,
        };
      case "incident-summary":
        return {
          ...definition,
          latestActivity: incidents.latestActivity,
          recordCount: incidents.count,
        };
      case "dispatch-performance":
        return {
          ...definition,
          latestActivity: dispatches.latestActivity,
          recordCount: dispatches.count,
        };
      case "case-status":
        return {
          ...definition,
          latestActivity: cases.latestActivity,
          recordCount: cases.count,
        };
      case "visitor-log":
        return {
          ...definition,
          latestActivity: visitors.latestActivity,
          recordCount: visitors.count,
        };
      case "patron-flags":
        return {
          ...definition,
          latestActivity: patrons.latestActivity,
          recordCount: patrons.count,
        };
      case "lost-found-inventory":
        return {
          ...definition,
          latestActivity: foundItems.latestActivity,
          recordCount: foundItems.count,
        };
      case "savings-losses":
        return {
          ...definition,
          latestActivity: financialLatest,
          recordCount: financialCount,
        };
      default:
        return { ...definition, latestActivity: null, recordCount: 0 };
    }
  });
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
  }
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

async function fetchReportData(
  orgId: string,
  reportType: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  switch (canonicalizeReportSlug(reportType)) {
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
    case "financial-summary":
    case "savings-losses":
      return fetchFinancialSummary(orgId, params);
    case "visitor-log":
      return fetchVisitorLog(orgId, params);
    case "incident-summary":
    default:
      return fetchIncidentSummary(orgId, params);
  }
}

async function fetchIncidentSummary(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
  const query = applyCommonReportFilters(
    supabase
    .from("incidents")
    .select(
      "id, record_number, incident_type, severity, status, synopsis, created_at, location:locations(name)"
    )
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "severity",
      propertyColumn: "property_id",
    }
  );

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((row: any) => ({
    date: row.created_at
      ? new Date(row.created_at).toLocaleDateString()
      : "-",
    id: row.id,
    location: row.location?.name ?? "-",
    number: row.record_number ?? "-",
    severity: row.severity ?? "-",
    status: row.status ?? "-",
    synopsis: row.synopsis ?? "-",
    type: row.incident_type ?? "-",
  }));

  const total = rows.length;
  const critical = rows.filter((row: any) =>
    ["critical", "Critical"].includes(String(row.severity))
  ).length;
  const resolved = rows.filter((row: any) =>
    ["resolved", "Resolved", "closed", "Closed"].includes(String(row.status))
  ).length;

  return {
    columns: [
      { key: "number", label: "Incident #" },
      { key: "type", label: "Type" },
      { key: "severity", label: "Severity" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ],
    rows,
    stats: [
      { label: "Total Incidents", sub: "Selected period", value: String(total) },
      {
        label: "Critical",
        sub: `${total ? ((critical / total) * 100).toFixed(1) : 0}% of total`,
        value: String(critical),
      },
      {
        label: "Resolved",
        sub: `${total ? ((resolved / total) * 100).toFixed(1) : 0}% resolution rate`,
        value: String(resolved),
      },
      { label: "Open", value: String(total - resolved) },
    ],
  };
}

async function fetchDispatchLog(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
  const query = applyCommonReportFilters(
    supabase
    .from("dispatches")
    .select("id, record_number, description, status, priority, dispatched_at, arrived_at, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "priority",
      propertyColumn: "property_id",
    }
  );

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((row: any) => {
    let responseTime = "-";

    if (row.dispatched_at && row.arrived_at) {
      const minutes =
        (new Date(row.arrived_at).getTime() -
          new Date(row.dispatched_at).getTime()) /
        60_000;
      responseTime = `${Math.round(minutes * 10) / 10} min`;
    }

    return {
      date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
      description: row.description ?? "-",
      id: row.id,
      number: row.record_number ?? "-",
      priority: row.priority ?? "-",
      responseTime,
      status: row.status ?? "-",
    };
  });

  const total = rows.length;
  const resolved = rows.filter((row: any) =>
    ["resolved", "Resolved", "cleared", "Cleared"].includes(String(row.status))
  ).length;

  return {
    columns: [
      { key: "number", label: "Dispatch #" },
      { key: "description", label: "Description" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "responseTime", label: "Response Time" },
      { key: "date", label: "Date" },
    ],
    rows,
    stats: [
      { label: "Total Dispatches", sub: "Selected period", value: String(total) },
      {
        label: "Resolved",
        sub: `${total ? ((resolved / total) * 100).toFixed(1) : 0}% rate`,
        value: String(resolved),
      },
      { label: "Active", value: String(total - resolved) },
      { label: "Dispatches", value: String(total) },
    ],
  };
}

async function fetchDailyActivity(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
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
    }
  );

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((row: any) => ({
    date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
    id: row.id,
    location: row.location?.name ?? "-",
    number: row.record_number ?? "-",
    priority: row.priority ?? "-",
    status: row.status ?? "-",
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
    topic: row.topic ?? "-",
  }));

  const total = rows.length;
  const highPriority = rows.filter((row: any) =>
    ["high", "High"].includes(String(row.priority))
  ).length;

  return {
    columns: [
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "topic", label: "Topic" },
      { key: "priority", label: "Priority" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
    rows,
    stats: [
      { label: "Total Entries", sub: "Selected period", value: String(total) },
      {
        label: "High Priority",
        sub: `${total ? ((highPriority / total) * 100).toFixed(1) : 0}% of total`,
        value: String(highPriority),
      },
      {
        label: "Completed",
        value: String(
          rows.filter((row: any) =>
            ["complete", "Complete", "closed", "Closed"].includes(String(row.status))
          ).length
        ),
      },
      {
        label: "In Progress",
        value: String(
          rows.filter((row: any) =>
            ["in_progress", "In Progress", "active", "Active"].includes(
              String(row.status)
            )
          ).length
        ),
      },
    ],
  };
}

async function fetchPatronFlags(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
  const query = applyCommonReportFilters(
    supabase
    .from("patrons")
    .select("id, first_name, last_name, flag, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .not("flag", "is", null)
    .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "flag",
    }
  );

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((row: any) => ({
    date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
    flagType: row.flag ?? "-",
    id: row.id,
    patronName: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "-",
  }));

  return {
    columns: [
      { key: "patronName", label: "Patron" },
      { key: "flagType", label: "Flag" },
      { key: "date", label: "Date" },
    ],
    rows,
    stats: [
      { label: "Flagged Patrons", value: String(rows.length) },
      {
        label: "Warning Flags",
        value: String(
          rows.filter((row: any) =>
            ["warning", "watch"].includes(String(row.flagType))
          ).length
        ),
      },
      {
        label: "Banned",
        value: String(
          rows.filter((row: any) => String(row.flagType) === "banned").length
        ),
      },
    ],
  };
}

async function fetchCaseStatus(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
  const { data, error } = await applyCommonReportFilters(
    supabase
      .from("cases")
      .select("id, record_number, case_type, status, created_at")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "status",
      propertyColumn: "property_id",
    }
  );

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((row: any) => ({
    caseType: row.case_type ?? "-",
    date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
    id: row.id,
    number: row.record_number ?? "-",
    status: row.status ?? "-",
  }));

  return {
    columns: [
      { key: "number", label: "Case #" },
      { key: "caseType", label: "Type" },
      { key: "status", label: "Status" },
      { key: "date", label: "Opened" },
    ],
    rows,
    stats: [
      { label: "Cases", value: String(rows.length) },
      {
        label: "Open",
        value: String(
          rows.filter((row: any) => ["open", "Open"].includes(String(row.status))).length
        ),
      },
      {
        label: "Closed",
        value: String(
          rows.filter((row: any) =>
            ["closed", "Closed"].includes(String(row.status))
          ).length
        ),
      },
    ],
  };
}

async function fetchLostFoundInventory(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
  const { data, error } = await applyCommonReportFilters(
    supabase
      .from("found_items")
      .select("id, record_number, description, category, status, created_at")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "status",
      propertyColumn: "property_id",
    }
  );

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((row: any) => ({
    category: row.category ?? "-",
    date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
    description: row.description ?? "-",
    id: row.id,
    number: row.record_number ?? "-",
    status: row.status ?? "-",
  }));

  return {
    columns: [
      { key: "number", label: "Item #" },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ],
    rows,
    stats: [
      { label: "Found Items", value: String(rows.length) },
      {
        label: "Stored",
        value: String(
          rows.filter((row: any) => ["stored", "Stored"].includes(String(row.status))).length
        ),
      },
      {
        label: "Returned",
        value: String(
          rows.filter((row: any) =>
            ["returned", "Returned"].includes(String(row.status))
          ).length
        ),
      },
    ],
  };
}

async function fetchFinancialSummary(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
  const query = applyDateRangeFilters(
    supabase
    .from("incident_financials")
    .select("id, entry_type, amount, description, created_at, incident:incidents!incident_id(record_number, org_id, property_id)")
    .order("created_at", { ascending: false }),
    params
  );
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? [])
    .filter(
      (row: any) =>
        row.incident?.org_id === orgId &&
        (!params.propertyId || row.incident?.property_id === params.propertyId)
    )
    .map((row: any) => ({
      amount: Number(row.amount ?? 0).toFixed(2),
      date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
      description: row.description ?? "-",
      incident: row.incident?.record_number ?? "-",
      type: row.entry_type ?? "-",
    }));

  const totalAmount = rows.reduce((sum: number, row: any) => sum + Number(row.amount), 0);

  return {
    columns: [
      { key: "incident", label: "Incident" },
      { key: "type", label: "Type" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount" },
      { key: "date", label: "Date" },
    ],
    rows,
    stats: [
      { label: "Entries", value: String(rows.length) },
      { label: "Total Amount", value: `$${totalAmount.toFixed(2)}` },
    ],
  };
}

async function fetchVisitorLog(
  orgId: string,
  params: ReportQueryParams
): Promise<ReportResult> {
  const supabase = getSupabase();
  const { data, error } = await applyCommonReportFilters(
    supabase
      .from("visitors")
      .select("id, first_name, last_name, host_name, company, purpose, status, checked_in_at, checked_out_at")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    params,
    {
      extraFilterColumn: "status",
      propertyColumn: "property_id",
    }
  );

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((row: any) => ({
    checkedIn: row.checked_in_at
      ? new Date(row.checked_in_at).toLocaleString()
      : "-",
    checkedOut: row.checked_out_at
      ? new Date(row.checked_out_at).toLocaleString()
      : "-",
    company: row.company ?? "-",
    host: row.host_name ?? "-",
    purpose: row.purpose ?? "-",
    status: row.status ?? "-",
    visitor: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "-",
  }));

  return {
    columns: [
      { key: "visitor", label: "Visitor" },
      { key: "host", label: "Host" },
      { key: "company", label: "Company" },
      { key: "purpose", label: "Purpose" },
      { key: "status", label: "Status" },
      { key: "checkedIn", label: "Checked In" },
      { key: "checkedOut", label: "Checked Out" },
    ],
    rows,
    stats: [
      { label: "Visits", value: String(rows.length) },
      {
        label: "Signed In",
        value: String(
          rows.filter((row: any) =>
            ["signed_in", "Signed In"].includes(String(row.status))
          ).length
        ),
      },
      {
        label: "Pending",
        value: String(
          rows.filter((row: any) => ["pending", "Pending"].includes(String(row.status))).length
        ),
      },
    ],
  };
}

export function useReportData(
  reportType: string,
  params: ReportQueryParams,
  enabled = true
) {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled:
      enabled &&
      canAccessProtected &&
      Boolean(orgId) &&
      Boolean(reportType),
    queryFn: () => fetchReportData(orgId!, reportType, params),
    queryKey: [
      "reports",
      canonicalizeReportSlug(reportType),
      orgId,
      params.dateFrom ?? "",
      params.dateTo ?? "",
      params.propertyId ?? "",
      params.extraFilterValue ?? "",
    ],
  });
}

export function useReportCatalog() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchReportCatalog(orgId!),
    queryKey: ["reports", "catalog", orgId],
  });
}
