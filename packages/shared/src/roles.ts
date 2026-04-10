import { StaffRole } from "./enums";

export interface InviteUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  sendWelcomeEmail: boolean;
}

export interface UserRoleOption {
  label: string;
  staffRole: StaffRole;
  value: string;
}

export const USER_ROLE_OPTIONS: readonly UserRoleOption[] = [
  { label: "Super Admin", staffRole: StaffRole.SuperAdmin, value: "super_admin" },
  { label: "Admin", staffRole: StaffRole.OrgAdmin, value: "admin" },
  { label: "Manager", staffRole: StaffRole.Manager, value: "manager" },
  { label: "Supervisor", staffRole: StaffRole.Supervisor, value: "supervisor" },
  { label: "Officer", staffRole: StaffRole.Dispatcher, value: "officer" },
  { label: "Staff", staffRole: StaffRole.Staff, value: "staff" },
  { label: "Read Only", staffRole: StaffRole.Viewer, value: "readonly" },
] as const;

export const ROLE_ORDER = USER_ROLE_OPTIONS.map((option) => option.label) as readonly string[];

export function mapUiRoleToStaffRole(role: string): StaffRole {
  const normalized = role.trim().toLowerCase();
  const matched = USER_ROLE_OPTIONS.find((option) => option.value === normalized);
  if (matched) {
    return matched.staffRole;
  }

  switch (normalized) {
    case "org_admin":
      return StaffRole.OrgAdmin;
    case "dispatcher":
      return StaffRole.Dispatcher;
    case "viewer":
      return StaffRole.Viewer;
    case "read only":
      return StaffRole.Viewer;
    default:
      return normalized as StaffRole;
  }
}

export function mapStaffRoleToUiRole(role: string) {
  const normalized = role.trim().toLowerCase();
  const matched = USER_ROLE_OPTIONS.find(
    (option) => option.staffRole === normalized
  );
  return matched?.value ?? normalized;
}

export function getUserRoleOption(role: string) {
  const normalized = role.trim().toLowerCase();

  return (
    USER_ROLE_OPTIONS.find((option) => option.value === normalized) ??
    USER_ROLE_OPTIONS.find((option) => option.staffRole === normalized) ??
    null
  );
}

export function formatRoleLabel(role: string) {
  return getUserRoleOption(role)?.label ?? role;
}
