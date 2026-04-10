export type ReportFormat = "CSV" | "Excel" | "PDF";

export interface ReportFilterOption {
  label: string;
  value: string;
}

export interface ReportFilterSpec {
  key: string;
  label: string;
  options: readonly ReportFilterOption[];
}

export interface ReportDefinition {
  category: string;
  defaultRangeDays?: number;
  description: string;
  extraFilter?: ReportFilterSpec | null;
  formats: readonly ReportFormat[];
  name: string;
  quick?: boolean;
  slug: string;
  supportsProperty?: boolean;
}

export interface ReportCatalogItem extends ReportDefinition {
  latestActivity: string | null;
  recordCount: number;
}

const PRIORITY_FILTER: ReportFilterSpec = {
  key: "priority",
  label: "Priority",
  options: [
    { label: "All Priorities", value: "" },
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ],
};

const SEVERITY_FILTER: ReportFilterSpec = {
  key: "severity",
  label: "Severity",
  options: [
    { label: "All Severities", value: "" },
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ],
};

const CASE_STATUS_FILTER: ReportFilterSpec = {
  key: "status",
  label: "Status",
  options: [
    { label: "All Statuses", value: "" },
    { label: "Open", value: "open" },
    { label: "On Hold", value: "on_hold" },
    { label: "Closed", value: "closed" },
    { label: "Archived", value: "archived" },
  ],
};

const LOST_FOUND_STATUS_FILTER: ReportFilterSpec = {
  key: "status",
  label: "Status",
  options: [
    { label: "All Statuses", value: "" },
    { label: "Stored", value: "stored" },
    { label: "Pending Return", value: "pending_return" },
    { label: "Returned", value: "returned" },
    { label: "Disposed", value: "disposed" },
    { label: "Overdue", value: "overdue" },
  ],
};

const VISITOR_STATUS_FILTER: ReportFilterSpec = {
  key: "status",
  label: "Visitor Status",
  options: [
    { label: "All Visitors", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Signed In", value: "signed_in" },
    { label: "Signed Out", value: "signed_out" },
  ],
};

const PATRON_FLAG_FILTER: ReportFilterSpec = {
  key: "flag",
  label: "Flag Type",
  options: [
    { label: "All Flags", value: "" },
    { label: "Banned", value: "banned" },
    { label: "VIP", value: "vip" },
    { label: "Warning", value: "warning" },
    { label: "Watch", value: "watch" },
  ],
};

export const REPORT_DEFINITIONS: readonly ReportDefinition[] = [
  {
    category: "Operations Reports",
    defaultRangeDays: 7,
    description: "All daily log entries for a selected date range",
    extraFilter: PRIORITY_FILTER,
    formats: ["PDF", "CSV", "Excel"],
    name: "Daily Activity Summary",
    quick: true,
    slug: "daily-activity",
    supportsProperty: true,
  },
  {
    category: "Operations Reports",
    defaultRangeDays: 7,
    description: "All incidents with classification, status, and response times",
    extraFilter: SEVERITY_FILTER,
    formats: ["PDF", "CSV", "Excel"],
    name: "Incident Summary Report",
    quick: true,
    slug: "incident-summary",
    supportsProperty: true,
  },
  {
    category: "Operations Reports",
    defaultRangeDays: 7,
    description: "Response times, resolution rates, and dispatch workload",
    extraFilter: PRIORITY_FILTER,
    formats: ["PDF", "CSV", "Excel"],
    name: "Dispatch Performance",
    slug: "dispatch-performance",
    supportsProperty: true,
  },
  {
    category: "Investigation Reports",
    defaultRangeDays: 14,
    description: "Active investigations, stage breakdown, and aging",
    extraFilter: CASE_STATUS_FILTER,
    formats: ["PDF", "CSV", "Excel"],
    name: "Case Status Report",
    slug: "case-status",
    supportsProperty: true,
  },
  {
    category: "Financial Reports",
    defaultRangeDays: 30,
    description: "Financial impact across incidents and cases",
    formats: ["PDF", "CSV", "Excel"],
    name: "Savings & Losses Summary",
    slug: "savings-losses",
    supportsProperty: true,
  },
  {
    category: "Visitor & Patron Reports",
    defaultRangeDays: 7,
    description: "All visits with sign-in and sign-out times",
    extraFilter: VISITOR_STATUS_FILTER,
    formats: ["PDF", "CSV", "Excel"],
    name: "Visitor Log",
    quick: true,
    slug: "visitor-log",
    supportsProperty: true,
  },
  {
    category: "Visitor & Patron Reports",
    defaultRangeDays: 30,
    description: "Active flags, ban history, and watch list",
    extraFilter: PATRON_FLAG_FILTER,
    formats: ["PDF", "CSV"],
    name: "Patron Flags & Bans",
    slug: "patron-flags",
    supportsProperty: true,
  },
  {
    category: "Inventory Reports",
    defaultRangeDays: 30,
    description: "Current found-item inventory and claim status",
    extraFilter: LOST_FOUND_STATUS_FILTER,
    formats: ["PDF", "CSV", "Excel"],
    name: "Lost & Found Inventory",
    slug: "lost-found-inventory",
    supportsProperty: true,
  },
] as const;

export const REPORT_SLUG_ALIASES = {
  "dispatch-log": "dispatch-performance",
  "financial-summary": "savings-losses",
} as const;

export function canonicalizeReportSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return REPORT_SLUG_ALIASES[
    normalized as keyof typeof REPORT_SLUG_ALIASES
  ] ?? normalized;
}

export function getReportDefinition(slug: string) {
  const canonical = canonicalizeReportSlug(slug);
  return REPORT_DEFINITIONS.find((report) => report.slug === canonical);
}

export function getDefaultReportDateRange(days = 7, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(end.getDate() - Math.max(days - 1, 0));

  const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

  return {
    dateFrom: toDateInput(start),
    dateTo: toDateInput(end),
  };
}

export function buildReportRoute(
  reportType: string,
  range = getDefaultReportDateRange(
    getReportDefinition(reportType)?.defaultRangeDays ?? 7
  )
) {
  const params = new URLSearchParams(range);
  return `/reports/${canonicalizeReportSlug(reportType)}?${params.toString()}`;
}
