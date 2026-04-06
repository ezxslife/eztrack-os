import { STATUS_COLORS } from "./constants";
import type { UniversalStatus } from "./enums";
import { StaffRole } from "./enums";

/** Format a date for display: "Jan 15, 10:30 AM" */
export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Relative time: "2 minutes ago", "3 days ago" */
export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

/** Get status color set from universal status */
export function getStatusColors(status: string) {
  return STATUS_COLORS[status as UniversalStatus] ?? STATUS_COLORS.archived;
}

/** Generate a record number: "DL-0001", "INC-0042" */
export function generateRecordNumber(
  prefix: string,
  count: number
): string {
  return `${prefix}-${String(count).padStart(4, "0")}`;
}

/** Permission matrix — which roles can do what */
const PERMISSION_MATRIX: Record<string, StaffRole[]> = {
  canCreateIncident: [
    StaffRole.SuperAdmin,
    StaffRole.OrgAdmin,
    StaffRole.Manager,
    StaffRole.Dispatcher,
    StaffRole.Supervisor,
    StaffRole.Staff,
  ],
  canEscalate: [
    StaffRole.SuperAdmin,
    StaffRole.OrgAdmin,
    StaffRole.Manager,
    StaffRole.Dispatcher,
    StaffRole.Supervisor,
  ],
  canAssignDispatch: [
    StaffRole.SuperAdmin,
    StaffRole.OrgAdmin,
    StaffRole.Manager,
    StaffRole.Dispatcher,
  ],
  canManageUsers: [StaffRole.SuperAdmin, StaffRole.OrgAdmin],
  canViewReports: [
    StaffRole.SuperAdmin,
    StaffRole.OrgAdmin,
    StaffRole.Manager,
    StaffRole.Supervisor,
  ],
  canDeleteRecords: [StaffRole.SuperAdmin, StaffRole.OrgAdmin],
  canManageSettings: [StaffRole.SuperAdmin, StaffRole.OrgAdmin],
};

export function hasPermission(role: StaffRole, action: string): boolean {
  const allowed = PERMISSION_MATRIX[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

/** Merge class names, filtering falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
