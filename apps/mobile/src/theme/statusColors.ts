import {
  OFFICER_STATUS_MAP,
  PATRON_FLAG_MAP,
  PRIORITY_COLORS,
  STATUS_COLORS,
  type UniversalStatus,
} from "@eztrack/shared";

const extendedStatusColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  high_prio: { bg: "#FDE68A", border: "#F59E0B", text: "#92400E" },
  on_scene: { bg: "#DBEAFE", border: "#3B82F6", text: "#1D4ED8" },
  overdue: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
  cleared: { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
  stored: { bg: "#E0F2FE", border: "#38BDF8", text: "#075985" },
  pending_return: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  returned: { bg: "#DCFCE7", border: "#22C55E", text: "#166534" },
  disposed: { bg: "#E5E7EB", border: "#9CA3AF", text: "#374151" },
  on_hold: { bg: "#EDE9FE", border: "#8B5CF6", text: "#5B21B6" },
};

export function getStatusStyle(status: string) {
  return extendedStatusColors[status] ?? STATUS_COLORS[status as UniversalStatus] ?? STATUS_COLORS.archived;
}

export function getPriorityStyle(priority: string) {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.none;
}

export function getOfficerStatusStyle(officerStatus: string) {
  const mapped = OFFICER_STATUS_MAP[officerStatus] ?? "archived";
  return getStatusStyle(mapped);
}

export function getPatronFlagStyle(flag: string) {
  const mapped = PATRON_FLAG_MAP[flag] ?? "archived";
  return getStatusStyle(mapped);
}
