import type { RouteScreenMetadata } from "@/navigation/stack-screen-options";

export const TAB_ROOT_ROUTE_METADATA = {
  analytics: {
    headerMode: "tab-root",
    title: "Analytics",
  },
  "daily-log": {
    headerMode: "tab-root",
    title: "Daily Log",
  },
  dashboard: {
    headerMode: "tab-root",
    title: "Operations Overview",
  },
  dispatch: {
    headerMode: "tab-root",
    title: "Dispatch",
  },
  incidents: {
    headerMode: "tab-root",
    title: "Incidents",
  },
  more: {
    headerMode: "tab-root",
    title: "More",
  },
  personnel: {
    headerMode: "tab-root",
    title: "Personnel",
  },
  reports: {
    headerMode: "tab-root",
    title: "Reports",
  },
} satisfies Record<string, RouteScreenMetadata>;

export const STANDALONE_ROUTE_METADATA = {
  "alerts/index": {
    headerMode: "seamless",
    title: "Alerts",
  },
  "anonymous-reports/index": {
    headerMode: "seamless",
    title: "Anonymous Reports",
  },
  "briefings/index": {
    headerMode: "seamless",
    title: "Briefings",
  },
  "cases/index": {
    headerMode: "seamless",
    title: "Cases",
  },
  "contacts/index": {
    headerMode: "seamless",
    title: "Contacts",
  },
  "lost-found/index": {
    headerMode: "seamless",
    title: "Lost & Found",
  },
  "notifications/index": {
    headerMode: "seamless",
    title: "Notifications",
  },
  "patrons/index": {
    headerMode: "seamless",
    title: "Patrons",
  },
  "sync-center/index": {
    headerMode: "seamless",
    title: "Sync Center",
  },
  "vehicles/index": {
    headerMode: "seamless",
    title: "Vehicles",
  },
  "visitors/index": {
    headerMode: "seamless",
    title: "Visitors",
  },
  "work-orders/index": {
    headerMode: "seamless",
    title: "Work Orders",
  },
} satisfies Record<string, RouteScreenMetadata>;

export const SETTINGS_ROUTE_METADATA = {
  dropdowns: {
    headerMode: "seamless",
    title: "Dropdowns",
  },
  "form-templates": {
    headerMode: "seamless",
    title: "Form Templates",
  },
  index: {
    headerMode: "seamless",
    title: "Settings",
  },
  integrations: {
    headerMode: "seamless",
    title: "Integrations",
  },
  locations: {
    headerMode: "seamless",
    title: "Locations",
  },
  "notification-rules": {
    headerMode: "seamless",
    title: "Notification Rules",
  },
  organization: {
    headerMode: "seamless",
    title: "Organization",
  },
  properties: {
    headerMode: "seamless",
    title: "Properties",
  },
  roles: {
    headerMode: "seamless",
    title: "Roles & Permissions",
  },
  users: {
    headerMode: "seamless",
    title: "Users",
  },
} satisfies Record<string, RouteScreenMetadata>;

export const DETAIL_ROUTE_METADATA = {
  "briefings/[id]": {
    headerMode: "seamless",
    title: "Briefing",
  },
  "cases/[id]": {
    headerMode: "seamless",
    title: "Case",
  },
  "contacts/[id]": {
    headerMode: "seamless",
    title: "Contact",
  },
  "daily-log/[id]": {
    headerMode: "immersive",
    title: "Daily Log",
  },
  "dispatch/[id]": {
    headerMode: "immersive",
    title: "Dispatch",
  },
  "incidents/[id]": {
    headerMode: "immersive",
    title: "Incident",
  },
  "lost-found/[id]": {
    headerMode: "seamless",
    title: "Lost & Found",
  },
  "patrons/[id]": {
    headerMode: "seamless",
    title: "Patron",
  },
  "personnel/[id]": {
    headerMode: "seamless",
    title: "Personnel",
  },
  "reports/[type]": {
    headerMode: "seamless",
    title: "Report",
  },
  "vehicles/[id]": {
    headerMode: "seamless",
    title: "Vehicle",
  },
  "visitors/[id]": {
    headerMode: "seamless",
    title: "Visitor",
  },
  "work-orders/[id]": {
    headerMode: "seamless",
    title: "Work Order",
  },
} satisfies Record<string, RouteScreenMetadata>;

export const CREATE_ROUTE_METADATA = {
  "briefings/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Briefing",
  },
  "cases/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Case",
  },
  "contacts/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Contact",
  },
  "daily-log/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Daily Log",
  },
  "dispatch/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Dispatch",
  },
  "incidents/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Incident",
  },
  "lost-found/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Lost & Found",
  },
  "patrons/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Patron",
  },
  "vehicles/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Vehicle",
  },
  "visitors/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Visitor",
  },
  "work-orders/new": {
    headerMode: "modal",
    presentation: "card",
    title: "New Work Order",
  },
} satisfies Record<string, RouteScreenMetadata>;
