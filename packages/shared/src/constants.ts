import type { UniversalStatus } from "./enums";

// ── Status Colors (THE standard across all modules) ───────────
export const STATUS_COLORS: Record<
  UniversalStatus,
  { bg: string; text: string; border: string }
> = {
  open: { bg: "#FED7AA", text: "#9A3412", border: "#F59E0B" },
  assigned: { bg: "#BFDBFE", text: "#1E40AF", border: "#3B82F6" },
  in_progress: { bg: "#FFFFFF", text: "#1A1A2E", border: "#D1D5DB" },
  follow_up: { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" },
  investigation: { bg: "#065F46", text: "#FFFFFF", border: "#10B981" },
  completed: { bg: "#6EE7B7", text: "#065F46", border: "#10B981" },
  closed: { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
  archived: { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" },
  pending: { bg: "#FEF3C7", text: "#92400E", border: "#FBBF24" },
  scheduled: { bg: "#E9D5FF", text: "#6B21A8", border: "#A855F7" },
};

// ── Priority Colors ───────────────────────────────────────────
export const PRIORITY_COLORS = {
  critical: { bg: "#DC2626", text: "#FFFFFF", border: "#B91C1C" },
  high: { bg: "#F97316", text: "#071418", border: "#EA580C" },
  medium: { bg: "#EAB308", text: "#1A1A2E", border: "#CA8A04" },
  low: { bg: "#3B82F6", text: "#071418", border: "#2563EB" },
  none: { bg: "#F3F4F6", text: "#4B5563", border: "#D1D5DB" },
} as const;

// ── Officer Status Colors ─────────────────────────────────────
export const OFFICER_STATUS_MAP: Record<string, UniversalStatus> = {
  available: "open",
  on_break: "scheduled",
  dispatched: "in_progress",
  on_scene: "assigned",
  overdue: "follow_up",
  off_duty: "archived",
  break_overdue: "follow_up",
};

// ── Patron Flag Colors ────────────────────────────────────────
export const PATRON_FLAG_MAP: Record<string, UniversalStatus> = {
  none: "archived",
  watch: "pending",
  banned: "follow_up",
  vip: "assigned",
  warning: "open",
};

// ── Incident Type Options ─────────────────────────────────────
export const INCIDENT_TYPES = [
  "Injury",
  "Illness",
  "Security Breach",
  "Theft",
  "Assault",
  "Vandalism",
  "Trespassing",
  "Disturbance",
  "Drug/Alcohol",
  "Missing Person",
  "Weather Event",
  "Fire/Hazard",
  "Medical Emergency",
  "Equipment Failure",
  "Crowd Control",
  "Other",
] as const;

// ── Dispatch Codes ────────────────────────────────────────────
export const DISPATCH_CODES = [
  { code: "C1", label: "Code 1 — Routine", priority: "low" },
  { code: "C2", label: "Code 2 — Urgent", priority: "medium" },
  { code: "C3", label: "Code 3 — Emergency", priority: "high" },
  { code: "C4", label: "Code 4 — All Clear", priority: "low" },
  { code: "MED", label: "Medical", priority: "critical" },
  { code: "FIRE", label: "Fire/Hazard", priority: "critical" },
  { code: "SEC", label: "Security", priority: "high" },
  { code: "EVAC", label: "Evacuation", priority: "critical" },
] as const;

// ── Case Stages ────────────────────────────────────────────────
export const CASE_STAGES = [
  { key: "assessment", label: "Assessment", number: 1 },
  { key: "evidence_collection", label: "Evidence Collection", number: 2 },
  { key: "detailed_investigation", label: "Detailed Investigation", number: 3 },
  { key: "outcome", label: "Outcome", number: 4 },
  { key: "cost_analysis", label: "Cost Analysis", number: 5 },
  { key: "disposition", label: "Disposition", number: 6 },
  { key: "resulting_actions", label: "Resulting Actions", number: 7 },
] as const;

// ── Role Display Names ────────────────────────────────────────
export const ROLE_DISPLAY: Record<string, string> = {
  super_admin: "Super Admin",
  org_admin: "Organization Admin",
  manager: "Manager",
  dispatcher: "Dispatcher",
  supervisor: "Supervisor",
  staff: "Field Staff",
  viewer: "Viewer",
};

// ── Navigation Items ──────────────────────────────────────────
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Daily Log", href: "/daily-log", icon: "ClipboardList" },
  { label: "Incidents", href: "/incidents", icon: "ShieldAlert" },
  { label: "Dispatch", href: "/dispatch", icon: "Radio" },
  { label: "Patrons", href: "/patrons", icon: "Users" },
  { label: "Lost & Found", href: "/lost-found", icon: "Package" },
  { label: "Briefings", href: "/briefings", icon: "MessageSquare" },
  { label: "Cases", href: "/cases", icon: "FolderSearch" },
  { label: "Personnel", href: "/personnel", icon: "UserCog" },
  { label: "Work Orders", href: "/work-orders", icon: "Wrench" },
  { label: "Visitors", href: "/visitors", icon: "UserCheck" },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
  { label: "Analytics", href: "/analytics", icon: "TrendingUp" },
] as const;

export const NAV_BOTTOM_ITEMS = [
  { label: "Settings", href: "/settings", icon: "Settings" },
  { label: "Notifications", href: "/notifications", icon: "Bell" },
  { label: "Alerts", href: "/alerts", icon: "AlertTriangle" },
] as const;
