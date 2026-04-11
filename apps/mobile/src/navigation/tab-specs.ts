import type { ComponentProps } from "react";

import { Ionicons } from "@expo/vector-icons";
import { StaffRole } from "@eztrack/shared";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type TabRouteName =
  | "analytics/index"
  | "daily-log/index"
  | "dashboard/index"
  | "dispatch/index"
  | "incidents/index"
  | "more/index"
  | "personnel/index"
  | "reports/index";

export interface TabSpec {
  androidIcon: IoniconName;
  href: string;
  nativeRole?: "more" | "search";
  routeName: TabRouteName;
  sfSymbol: {
    default: string;
    selected: string;
  };
  title: string;
}

const DASHBOARD: TabSpec = {
  androidIcon: "grid-outline",
  href: "/dashboard",
  routeName: "dashboard/index",
  sfSymbol: {
    default: "rectangle.grid.2x2",
    selected: "rectangle.grid.2x2.fill",
  },
  title: "Dashboard",
};

const DAILY_LOG: TabSpec = {
  androidIcon: "document-text-outline",
  href: "/daily-log",
  routeName: "daily-log/index",
  sfSymbol: {
    default: "doc.text",
    selected: "doc.text.fill",
  },
  title: "Daily Log",
};

const INCIDENTS: TabSpec = {
  androidIcon: "warning-outline",
  href: "/incidents",
  routeName: "incidents/index",
  sfSymbol: {
    default: "exclamationmark.shield",
    selected: "exclamationmark.shield.fill",
  },
  title: "Incidents",
};

const DISPATCH: TabSpec = {
  androidIcon: "radio-outline",
  href: "/dispatch",
  routeName: "dispatch/index",
  sfSymbol: {
    default: "dot.radiowaves.left.and.right",
    selected: "dot.radiowaves.left.and.right",
  },
  title: "Dispatch",
};

const ANALYTICS: TabSpec = {
  androidIcon: "stats-chart-outline",
  href: "/analytics",
  routeName: "analytics/index",
  sfSymbol: {
    default: "chart.bar",
    selected: "chart.bar.fill",
  },
  title: "Analytics",
};

const PERSONNEL: TabSpec = {
  androidIcon: "people-outline",
  href: "/personnel",
  routeName: "personnel/index",
  sfSymbol: {
    default: "person.2",
    selected: "person.2.fill",
  },
  title: "Personnel",
};

const REPORTS: TabSpec = {
  androidIcon: "reader-outline",
  href: "/reports",
  routeName: "reports/index",
  sfSymbol: {
    default: "doc.text.magnifyingglass",
    selected: "doc.text.fill",
  },
  title: "Reports",
};

const MORE: TabSpec = {
  androidIcon: "ellipsis-horizontal-circle-outline",
  href: "/more",
  nativeRole: "more",
  routeName: "more/index",
  sfSymbol: {
    default: "ellipsis.circle",
    selected: "ellipsis.circle.fill",
  },
  title: "More",
};

export const ALL_TAB_SPECS: TabSpec[] = [
  DASHBOARD,
  DAILY_LOG,
  DISPATCH,
  INCIDENTS,
  ANALYTICS,
  PERSONNEL,
  REPORTS,
  MORE,
];

export function getTabsForRole(role: StaffRole | null | undefined): TabSpec[] {
  switch (role) {
    case StaffRole.SuperAdmin:
    case StaffRole.OrgAdmin:
      return [DASHBOARD, INCIDENTS, DISPATCH, ANALYTICS, MORE];
    case StaffRole.Manager:
      return [DASHBOARD, INCIDENTS, DISPATCH, PERSONNEL, MORE];
    case StaffRole.Dispatcher:
      return [DASHBOARD, DISPATCH, INCIDENTS, DAILY_LOG, MORE];
    case StaffRole.Viewer:
      return [DASHBOARD, INCIDENTS, DAILY_LOG, REPORTS, MORE];
    case StaffRole.Supervisor:
    case StaffRole.Staff:
    default:
      return [DASHBOARD, DAILY_LOG, INCIDENTS, DISPATCH, MORE];
  }
}

export function getPrimaryTabLabelsForRole(
  role: StaffRole | null | undefined
) {
  return new Set(getTabsForRole(role).map((spec) => spec.title));
}
