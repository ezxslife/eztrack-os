import type {
  DispatchCard,
} from "@/lib/queries/dispatches";
import type {
  DashboardStats,
  RecentActivityItem,
} from "@/lib/queries/dashboard";
import type {
  DailyLogRow,
} from "@/lib/queries/daily-logs";
import type {
  IncidentDetail,
  IncidentRow,
} from "@/lib/queries/incidents";
import type {
  OfflineAction,
  OfflineCreateDailyLogAction,
  OfflineCreateIncidentAction,
  OfflineUpdateDispatchStatusAction,
} from "@/lib/offline/types";
import { isOfflineActionPending } from "@/lib/offline/types";

function isCreateIncidentAction(
  action: OfflineAction
): action is OfflineCreateIncidentAction {
  return action.kind === "create-incident";
}

function isCreateDailyLogAction(
  action: OfflineAction
): action is OfflineCreateDailyLogAction {
  return action.kind === "create-daily-log";
}

function isUpdateDispatchStatusAction(
  action: OfflineAction
): action is OfflineUpdateDispatchStatusAction {
  return action.kind === "update-dispatch-status";
}

function sortNewestFirst(left: { createdAt: string }, right: { createdAt: string }) {
  return (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function isToday(isoValue: string) {
  const now = new Date();
  const value = new Date(isoValue);

  return (
    now.getFullYear() === value.getFullYear() &&
    now.getMonth() === value.getMonth() &&
    now.getDate() === value.getDate()
  );
}

export function buildQueuedIncidentRow(
  action: OfflineCreateIncidentAction
): IncidentRow {
  return {
    assignedTo: null,
    createdAt: action.createdAt,
    id: action.id,
    location: action.payload.locationName ?? "Queued location",
    recordNumber: "INC-QUEUED",
    reportedBy: action.payload.reportedBy ?? null,
    severity: action.payload.severity,
    status: "queued",
    synopsis: action.payload.synopsis,
    type: action.payload.incidentType,
  };
}

export function buildQueuedIncidentDetail(
  action: OfflineCreateIncidentAction
): IncidentDetail {
  return {
    createdAt: action.createdAt,
    creatorName: "Queued for sync",
    description: action.payload.synopsis,
    disposition: null,
    id: action.id,
    location: action.payload.locationName ?? "Queued location",
    orgId: action.scope.orgId,
    propertyId: action.scope.propertyId,
    recordNumber: "INC-QUEUED",
    reportedBy: action.payload.reportedBy ?? null,
    severity: action.payload.severity,
    status: "queued",
    synopsis: action.payload.synopsis,
    type: action.payload.incidentType,
    updatedAt: action.createdAt,
  };
}

export function mergePendingIncidentRows(
  rows: IncidentRow[] | undefined,
  actions: OfflineAction[]
) {
  const queuedRows = actions
    .filter(isOfflineActionPending)
    .filter(isCreateIncidentAction)
    .map(buildQueuedIncidentRow)
    .sort(sortNewestFirst);

  if (!rows?.length) {
    return queuedRows.length ? queuedRows : rows;
  }

  const seenIds = new Set(rows.map((row) => row.id));
  const mergedQueued = queuedRows.filter((row) => !seenIds.has(row.id));
  return [...mergedQueued, ...rows];
}

export function findQueuedIncidentDetail(
  id: string,
  actions: OfflineAction[]
) {
  const action = actions.find(
    (pendingAction) =>
      isOfflineActionPending(pendingAction) &&
      pendingAction.kind === "create-incident" && pendingAction.id === id
  );

  return action && action.kind === "create-incident"
    ? buildQueuedIncidentDetail(action)
    : null;
}

export function buildQueuedDailyLogRow(
  action: OfflineCreateDailyLogAction
): DailyLogRow {
  return {
    createdAt: action.createdAt,
    createdBy: "Queued for sync",
    id: action.id,
    location: action.payload.locationName ?? "Queued location",
    priority: action.payload.priority,
    recordNumber: "DL-QUEUED",
    status: "queued",
    synopsis: action.payload.synopsis,
    topic: action.payload.topic,
  };
}

export function mergePendingDailyLogs(
  rows: DailyLogRow[] | undefined,
  actions: OfflineAction[]
) {
  const queuedRows = actions
    .filter(isOfflineActionPending)
    .filter(isCreateDailyLogAction)
    .map(buildQueuedDailyLogRow)
    .sort(sortNewestFirst);

  if (!rows?.length) {
    return queuedRows.length ? queuedRows : rows;
  }

  const seenIds = new Set(rows.map((row) => row.id));
  const mergedQueued = queuedRows.filter((row) => !seenIds.has(row.id));
  return [...mergedQueued, ...rows];
}

export function mergePendingDashboardStats(
  stats: DashboardStats | undefined,
  actions: OfflineAction[]
) {
  const queuedIncidents = actions.filter(
    (action) => isOfflineActionPending(action) && isCreateIncidentAction(action)
  ).length;
  const queuedDailyLogsToday = actions.filter(
    (action) =>
      isOfflineActionPending(action) &&
      isCreateDailyLogAction(action) &&
      isToday(action.createdAt)
  ).length;

  if (!stats && queuedIncidents === 0 && queuedDailyLogsToday === 0) {
    return stats;
  }

  return {
    activeDispatches: stats?.activeDispatches ?? 0,
    dailyLogsToday: (stats?.dailyLogsToday ?? 0) + queuedDailyLogsToday,
    officersOnDuty: stats?.officersOnDuty ?? 0,
    totalIncidents: (stats?.totalIncidents ?? 0) + queuedIncidents,
  };
}

export function mergePendingRecentActivity(
  items: RecentActivityItem[] | undefined,
  actions: OfflineAction[]
) {
  const queuedActivity = actions
    .filter(isOfflineActionPending)
    .map((action): RecentActivityItem => {
      if (action.kind === "create-incident") {
        return {
          action: "queued_create",
          actorName: "Offline queue",
          changes: {
            severity: action.payload.severity,
            synopsis: action.payload.synopsis,
          },
          createdAt: action.createdAt,
          entityId: action.id,
          entityType: "incident",
          id: `${action.id}:activity`,
        };
      }

      return {
        action:
          action.kind === "create-daily-log"
            ? "queued_create"
            : "queued_update",
        actorName: "Offline queue",
        changes:
          action.kind === "create-daily-log"
            ? {
                priority: action.payload.priority,
                topic: action.payload.topic,
              }
            : {
                from: action.payload.currentStatus,
                to: action.payload.nextStatus,
              },
        createdAt: action.createdAt,
        entityId:
          action.kind === "create-daily-log"
            ? action.id
            : action.payload.dispatchId,
        entityType:
          action.kind === "create-daily-log"
            ? "daily_log"
            : "dispatch",
        id: `${action.id}:activity`,
      };
    })
    .sort(sortNewestFirst);

  if (!items?.length) {
    return queuedActivity.length ? queuedActivity : items;
  }

  const seenIds = new Set(items.map((item) => item.id));
  const mergedQueued = queuedActivity.filter((item) => !seenIds.has(item.id));
  return [...mergedQueued, ...items];
}

export function mergePendingDispatchRows(
  rows: DispatchCard[] | undefined,
  actions: OfflineAction[]
) {
  const updates = actions
    .filter(isOfflineActionPending)
    .filter(isUpdateDispatchStatusAction);

  if (!rows?.length || updates.length === 0) {
    return rows;
  }

  const updatesByDispatchId = new Map(
    updates.map((action) => [action.payload.dispatchId, action])
  );

  return rows.map((row) => {
    const pendingUpdate = updatesByDispatchId.get(row.id);

    if (!pendingUpdate) {
      return row;
    }

    return {
      ...row,
      status: pendingUpdate.payload.nextStatus,
    };
  });
}
