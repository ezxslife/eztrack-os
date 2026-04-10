import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface ReportResult {
  columns: Array<{ key: string; label: string; sortable?: boolean }>;
  rows: Record<string, unknown>[];
  stats: Array<{ label: string; sub?: string; value: string }>;
}

async function fetchReportData(
  orgId: string,
  reportType: string,
  params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  switch (reportType) {
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
  params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  let query = supabase
    .from("incidents")
    .select(
      "id, record_number, incident_type, severity, status, synopsis, created_at, location:locations(name)"
    )
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) {
    query = query.gte("created_at", params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte("created_at", `${params.dateTo}T23:59:59`);
  }

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
  const critical = rows.filter((row) =>
    ["critical", "Critical"].includes(String(row.severity))
  ).length;
  const resolved = rows.filter((row) =>
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
  params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  let query = supabase
    .from("dispatches")
    .select("id, record_number, description, status, priority, dispatched_at, arrived_at, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) {
    query = query.gte("created_at", params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte("created_at", `${params.dateTo}T23:59:59`);
  }

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
  const resolved = rows.filter((row) =>
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
  params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  let query = supabase
    .from("daily_logs")
    .select("id, record_number, topic, priority, status, created_at, location:locations(name)")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) {
    query = query.gte("created_at", params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte("created_at", `${params.dateTo}T23:59:59`);
  }

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
  const highPriority = rows.filter((row) =>
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
          rows.filter((row) =>
            ["complete", "Complete", "closed", "Closed"].includes(String(row.status))
          ).length
        ),
      },
      {
        label: "In Progress",
        value: String(
          rows.filter((row) =>
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
  params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  let query = supabase
    .from("patrons")
    .select("id, first_name, last_name, flag, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .not("flag", "is", null)
    .order("created_at", { ascending: false });

  if (params.dateFrom) {
    query = query.gte("created_at", params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte("created_at", `${params.dateTo}T23:59:59`);
  }

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
          rows.filter((row) =>
            ["warning", "watch"].includes(String(row.flagType))
          ).length
        ),
      },
      {
        label: "Banned",
        value: String(
          rows.filter((row) => String(row.flagType) === "banned").length
        ),
      },
    ],
  };
}

async function fetchCaseStatus(
  orgId: string,
  _params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cases")
    .select("id, record_number, case_type, status, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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
          rows.filter((row) => ["open", "Open"].includes(String(row.status))).length
        ),
      },
      {
        label: "Closed",
        value: String(
          rows.filter((row) =>
            ["closed", "Closed"].includes(String(row.status))
          ).length
        ),
      },
    ],
  };
}

async function fetchLostFoundInventory(
  orgId: string,
  _params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("found_items")
    .select("id, record_number, description, category, status, created_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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
          rows.filter((row) => ["stored", "Stored"].includes(String(row.status))).length
        ),
      },
      {
        label: "Returned",
        value: String(
          rows.filter((row) =>
            ["returned", "Returned"].includes(String(row.status))
          ).length
        ),
      },
    ],
  };
}

async function fetchFinancialSummary(
  orgId: string,
  _params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_financials")
    .select("id, entry_type, amount, description, created_at, incident:incidents!incident_id(record_number, org_id)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? [])
    .filter((row: any) => row.incident?.org_id === orgId)
    .map((row: any) => ({
      amount: Number(row.amount ?? 0).toFixed(2),
      date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
      description: row.description ?? "-",
      incident: row.incident?.record_number ?? "-",
      type: row.entry_type ?? "-",
    }));

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount), 0);

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
  _params: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ReportResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("visitors")
    .select("id, first_name, last_name, host_name, company, purpose, status, checked_in_at, checked_out_at")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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
          rows.filter((row) =>
            ["signed_in", "Signed In"].includes(String(row.status))
          ).length
        ),
      },
      {
        label: "Pending",
        value: String(
          rows.filter((row) => ["pending", "Pending"].includes(String(row.status))).length
        ),
      },
    ],
  };
}

export function useReportData(
  reportType: string,
  params: {
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId) && Boolean(reportType),
    queryFn: () => fetchReportData(orgId!, reportType, params),
    queryKey: ["reports", reportType, orgId, params.dateFrom ?? "", params.dateTo ?? ""],
  });
}
