export type NotificationType =
  | "briefing_shared"
  | "case_update"
  | "dispatch_alert"
  | "follow_up_required"
  | "form_completed"
  | "incident_assigned"
  | "incident_created"
  | "share_received"
  | "status_change"
  | "system_alert";

export const NOTIFICATION_DEFAULT_ROUTES: Record<NotificationType, string> = {
  briefing_shared: "/briefings",
  case_update: "/cases",
  dispatch_alert: "/dispatch",
  follow_up_required: "/incidents",
  form_completed: "/incidents",
  incident_assigned: "/incidents",
  incident_created: "/incidents",
  share_received: "/briefings",
  status_change: "/notifications",
  system_alert: "/notifications",
};

export interface DeviceRegistrationRecord {
  active: boolean;
  appVersion: string | null;
  expoPushToken: string;
  installationId: string;
  lastSeenAt: string;
  orgId: string;
  platform: "android" | "ios";
  userId: string;
}

export interface DeviceRegistrationPayload {
  appVersion: string | null;
  expoPushToken: string;
  installationId: string;
  platform: "android" | "ios";
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function normalizeActionUrl(actionUrl?: null | string) {
  if (!actionUrl) {
    return null;
  }

  if (actionUrl.startsWith("/")) {
    return actionUrl;
  }

  try {
    const parsed = new URL(actionUrl);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export function resolveNotificationRoute(input: {
  actionUrl?: null | string;
  metadata?: Record<string, unknown> | null;
  type: string;
}) {
  const directRoute = normalizeActionUrl(input.actionUrl);
  if (directRoute) {
    return directRoute;
  }

  const type = input.type as NotificationType;
  const metadata = input.metadata;

  switch (type) {
    case "incident_assigned":
    case "incident_created":
    case "follow_up_required":
    case "form_completed": {
      const id = getMetadataString(metadata, [
        "incidentId",
        "incident_id",
        "recordId",
        "record_id",
      ]);
      return id ? `/incidents/${id}` : NOTIFICATION_DEFAULT_ROUTES[type];
    }
    case "dispatch_alert": {
      const id = getMetadataString(metadata, [
        "dispatchId",
        "dispatch_id",
        "recordId",
        "record_id",
      ]);
      return id ? `/dispatch/${id}` : NOTIFICATION_DEFAULT_ROUTES[type];
    }
    case "briefing_shared":
    case "share_received": {
      const id = getMetadataString(metadata, [
        "briefingId",
        "briefing_id",
        "recordId",
        "record_id",
      ]);
      return id ? `/briefings/${id}` : NOTIFICATION_DEFAULT_ROUTES[type];
    }
    case "case_update": {
      const id = getMetadataString(metadata, [
        "caseId",
        "case_id",
        "recordId",
        "record_id",
      ]);
      return id ? `/cases/${id}` : NOTIFICATION_DEFAULT_ROUTES[type];
    }
    case "status_change":
    case "system_alert":
    default:
      return NOTIFICATION_DEFAULT_ROUTES[type] ?? "/notifications";
  }
}
