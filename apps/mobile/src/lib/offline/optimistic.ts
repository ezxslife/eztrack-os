import type { DispatchCard } from "@/lib/queries/dispatches";
import type {
  DashboardStats,
  RecentActivityItem,
} from "@/lib/queries/dashboard";
import type {
  DailyLogDetail,
  DailyLogRow,
} from "@/lib/queries/daily-logs";
import type {
  IncidentDetail,
  IncidentNarrative,
  IncidentRow,
} from "@/lib/queries/incidents";
import type {
  OfflineAction,
  OfflineAssignDispatchAction,
  OfflineCreateDailyLogAction,
  OfflineCreateIncidentAction,
  OfflineCreateIncidentNarrativeAction,
  OfflineUpdateDailyLogAction,
  OfflineUpdateDispatchStatusAction,
  OfflineUpdateIncidentAction,
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

function isUpdateIncidentAction(
  action: OfflineAction
): action is OfflineUpdateIncidentAction {
  return action.kind === "update-incident";
}

function isCreateIncidentNarrativeAction(
  action: OfflineAction
): action is OfflineCreateIncidentNarrativeAction {
  return action.kind === "create-incident-narrative";
}

function isUpdateDailyLogAction(
  action: OfflineAction
): action is OfflineUpdateDailyLogAction {
  return action.kind === "update-daily-log";
}

function isUpdateDispatchStatusAction(
  action: OfflineAction
): action is OfflineUpdateDispatchStatusAction {
  return action.kind === "update-dispatch-status";
}

function isAssignDispatchAction(
  action: OfflineAction
): action is OfflineAssignDispatchAction {
  return action.kind === "assign-dispatch";
}

function sortNewestFirst(left: { createdAt: string }, right: { createdAt: string }) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function sortOldestFirst(left: { createdAt: string }, right: { createdAt: string }) {
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
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

function getPendingActions(actions: OfflineAction[]) {
  return actions.filter(isOfflineActionPending);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled optimistic action: ${JSON.stringify(value)}`);
}

function applyIncidentUpdateToRow(
  incident: IncidentRow,
  action: OfflineUpdateIncidentAction
): IncidentRow {
  return {
    ...incident,
    location: action.payload.locationName ?? incident.location,
    reportedBy: action.payload.reportedBy ?? null,
    severity: action.payload.severity,
    status: action.payload.status,
    synopsis: action.payload.synopsis,
    type: action.payload.incidentType,
  };
}

function applyIncidentUpdateToDetail(
  incident: IncidentDetail,
  action: OfflineUpdateIncidentAction
): IncidentDetail {
  return {
    ...incident,
    description: action.payload.synopsis,
    location: action.payload.locationName ?? incident.location,
    reportedBy: action.payload.reportedBy ?? null,
    severity: action.payload.severity,
    status: action.payload.status,
    synopsis: action.payload.synopsis,
    type: action.payload.incidentType,
    updatedAt: action.createdAt,
  };
}

function applyDailyLogUpdateToRow(
  log: DailyLogRow,
  action: OfflineUpdateDailyLogAction
): DailyLogRow {
  return {
    ...log,
    location: action.payload.locationName ?? log.location,
    priority: action.payload.priority,
    status: action.payload.status,
    synopsis: action.payload.synopsis,
    topic: action.payload.topic,
  };
}

function applyDailyLogUpdateToDetail(
  log: DailyLogDetail,
  action: OfflineUpdateDailyLogAction
): DailyLogDetail {
  return {
    ...log,
    location: action.payload.locationName ?? log.location,
    priority: action.payload.priority,
    status: action.payload.status,
    synopsis: action.payload.synopsis,
    topic: action.payload.topic,
    updatedAt: action.createdAt,
  };
}

function applyDispatchAction(
  dispatch: DispatchCard,
  action: OfflineAssignDispatchAction | OfflineUpdateDispatchStatusAction
) {
  if (action.kind === "assign-dispatch") {
    return {
      ...dispatch,
      officerId: action.payload.nextOfficerId,
      officerName: action.payload.nextOfficerName ?? null,
    };
  }

  return {
    ...dispatch,
    status: action.payload.nextStatus,
  };
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
): IncidentRow[] | undefined {
  const pendingActions = getPendingActions(actions);
  const queuedRows = pendingActions
    .filter(isCreateIncidentAction)
    .map(buildQueuedIncidentRow)
    .sort(sortNewestFirst);
  const updateActions = pendingActions
    .filter(isUpdateIncidentAction)
    .sort(sortOldestFirst);

  if (!rows?.length) {
    return queuedRows.length ? queuedRows : rows;
  }

  const updatedRows = rows.map((row) =>
    updateActions
      .filter((action) => action.payload.incidentId === row.id)
      .reduce(
        (current, action) => applyIncidentUpdateToRow(current, action),
        row
      )
  );

  const seenIds = new Set(updatedRows.map((row) => row.id));
  const mergedQueued = queuedRows.filter((row) => !seenIds.has(row.id));
  return [...mergedQueued, ...updatedRows];
}

export function findQueuedIncidentDetail(
  id: string,
  actions: OfflineAction[]
): IncidentDetail | null {
  const action = actions.find(
    (pendingAction) =>
      isOfflineActionPending(pendingAction) &&
      pendingAction.kind === "create-incident" &&
      pendingAction.id === id
  );

  return action && action.kind === "create-incident"
    ? buildQueuedIncidentDetail(action)
    : null;
}

export function mergePendingIncidentDetail(
  detail: IncidentDetail | null | undefined,
  actions: OfflineAction[],
  id?: string
): IncidentDetail | null | undefined {
  const queuedDetail = id ? findQueuedIncidentDetail(id, actions) : null;
  const baseDetail = detail ?? queuedDetail;

  if (!baseDetail) {
    return detail;
  }

  const updateActions = getPendingActions(actions)
    .filter(isUpdateIncidentAction)
    .filter((action) => action.payload.incidentId === baseDetail.id)
    .sort(sortOldestFirst);

  return updateActions.reduce(
    (current, action) => applyIncidentUpdateToDetail(current, action),
    baseDetail
  );
}

function buildQueuedIncidentNarrative(
  action: OfflineCreateIncidentNarrativeAction
): IncidentNarrative {
  return {
    authorName: "Queued for sync",
    content: action.payload.content,
    createdAt: action.createdAt,
    id: action.id,
    title: action.payload.title?.trim() || "Narrative",
  };
}

export function mergePendingIncidentNarratives(
  rows: IncidentNarrative[] | undefined,
  actions: OfflineAction[],
  incidentId: string
): IncidentNarrative[] | undefined {
  const queuedRows = getPendingActions(actions)
    .filter(isCreateIncidentNarrativeAction)
    .filter((action) => action.payload.incidentId === incidentId)
    .map(buildQueuedIncidentNarrative)
    .sort(sortNewestFirst);

  if (!rows?.length) {
    return queuedRows.length ? queuedRows : rows;
  }

  const seenIds = new Set(rows.map((row) => row.id));
  const mergedQueued = queuedRows.filter((row) => !seenIds.has(row.id));
  return [...mergedQueued, ...rows];
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

export function buildQueuedDailyLogDetail(
  action: OfflineCreateDailyLogAction
): DailyLogDetail {
  return {
    createdAt: action.createdAt,
    createdBy: "Queued for sync",
    id: action.id,
    location: action.payload.locationName ?? "Queued location",
    locationId: action.payload.locationId,
    orgId: action.scope.orgId,
    priority: action.payload.priority,
    propertyId: action.scope.propertyId,
    recordNumber: "DL-QUEUED",
    status: "queued",
    synopsis: action.payload.synopsis,
    topic: action.payload.topic,
    updatedAt: action.createdAt,
  };
}

export function findQueuedDailyLogDetail(
  id: string,
  actions: OfflineAction[]
): DailyLogDetail | null {
  const action = actions.find(
    (pendingAction) =>
      isOfflineActionPending(pendingAction) &&
      pendingAction.kind === "create-daily-log" &&
      pendingAction.id === id
  );

  return action && action.kind === "create-daily-log"
    ? buildQueuedDailyLogDetail(action)
    : null;
}

export function mergePendingDailyLogs(
  rows: DailyLogRow[] | undefined,
  actions: OfflineAction[]
): DailyLogRow[] | undefined {
  const pendingActions = getPendingActions(actions);
  const queuedRows = pendingActions
    .filter(isCreateDailyLogAction)
    .map(buildQueuedDailyLogRow)
    .sort(sortNewestFirst);
  const updateActions = pendingActions
    .filter(isUpdateDailyLogAction)
    .sort(sortOldestFirst);

  if (!rows?.length) {
    return queuedRows.length ? queuedRows : rows;
  }

  const updatedRows = rows.map((row) =>
    updateActions
      .filter((action) => action.payload.dailyLogId === row.id)
      .reduce(
        (current, action) => applyDailyLogUpdateToRow(current, action),
        row
      )
  );

  const seenIds = new Set(updatedRows.map((row) => row.id));
  const mergedQueued = queuedRows.filter((row) => !seenIds.has(row.id));
  return [...mergedQueued, ...updatedRows];
}

export function mergePendingDailyLogDetail(
  detail: DailyLogDetail | null | undefined,
  actions: OfflineAction[],
  id?: string
): DailyLogDetail | null | undefined {
  const queuedDetail = id ? findQueuedDailyLogDetail(id, actions) : null;
  const baseDetail = detail ?? queuedDetail;

  if (!baseDetail) {
    return detail;
  }

  const updateActions = getPendingActions(actions)
    .filter(isUpdateDailyLogAction)
    .filter((action) => action.payload.dailyLogId === baseDetail.id)
    .sort(sortOldestFirst);

  return updateActions.reduce(
    (current, action) => applyDailyLogUpdateToDetail(current, action),
    baseDetail
  );
}

export function mergePendingDashboardStats(
  stats: DashboardStats | undefined,
  actions: OfflineAction[]
) {
  const pendingActions = getPendingActions(actions);
  const queuedIncidents = pendingActions.filter(isCreateIncidentAction).length;
  const queuedDailyLogsToday = pendingActions.filter(
    (action) => isCreateDailyLogAction(action) && isToday(action.createdAt)
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
  const queuedActivity = getPendingActions(actions)
    .map((action): RecentActivityItem => {
      switch (action.kind) {
        case "create-incident":
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
        case "create-daily-log":
          return {
            action: "queued_create",
            actorName: "Offline queue",
            changes: {
              priority: action.payload.priority,
              topic: action.payload.topic,
            },
            createdAt: action.createdAt,
            entityId: action.id,
            entityType: "daily_log",
            id: `${action.id}:activity`,
          };
        case "create-incident-narrative":
          return {
            action: "queued_update",
            actorName: "Offline queue",
            changes: {
              title: action.payload.title?.trim() || "Narrative",
            },
            createdAt: action.createdAt,
            entityId: action.payload.incidentId,
            entityType: "incident",
            id: `${action.id}:activity`,
          };
        case "update-incident":
          return {
            action: "queued_update",
            actorName: "Offline queue",
            changes: {
              severity: action.payload.severity,
              status: action.payload.status,
            },
            createdAt: action.createdAt,
            entityId: action.payload.incidentId,
            entityType: "incident",
            id: `${action.id}:activity`,
          };
        case "update-daily-log":
          return {
            action: "queued_update",
            actorName: "Offline queue",
            changes: {
              priority: action.payload.priority,
              status: action.payload.status,
            },
            createdAt: action.createdAt,
            entityId: action.payload.dailyLogId,
            entityType: "daily_log",
            id: `${action.id}:activity`,
          };
        case "assign-dispatch":
          return {
            action: "queued_assignment",
            actorName: "Offline queue",
            changes: {
              from: action.payload.previousOfficerName ?? null,
              to: action.payload.nextOfficerName ?? null,
            },
            createdAt: action.createdAt,
            entityId: action.payload.dispatchId,
            entityType: "dispatch",
            id: `${action.id}:activity`,
          };
        case "update-dispatch-status":
          return {
            action: "queued_update",
            actorName: "Offline queue",
            changes: {
              from: action.payload.currentStatus,
              to: action.payload.nextStatus,
            },
            createdAt: action.createdAt,
            entityId: action.payload.dispatchId,
            entityType: "dispatch",
            id: `${action.id}:activity`,
          };
        default:
          return assertNever(action);
      }
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
  const pendingDispatchActions = getPendingActions(actions)
    .filter(
      (action) =>
        isAssignDispatchAction(action) || isUpdateDispatchStatusAction(action)
    )
    .sort(sortOldestFirst);

  if (!rows?.length || pendingDispatchActions.length === 0) {
    return rows;
  }

  return rows.map((row) =>
    pendingDispatchActions
      .filter((action) => action.payload.dispatchId === row.id)
      .reduce((current, action) => applyDispatchAction(current, action), row)
  );
}
