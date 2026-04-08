import type {
  DispatchStatus,
  IncidentSeverity,
} from "@eztrack/shared";

export interface OfflineActionScope {
  orgId: string;
  propertyId: string | null;
  userId: string;
}

export type OfflineSyncState = "dead_letter" | "pending";

export interface QueuedCreateIncidentInput {
  incidentType: string;
  locationId: string;
  locationName?: string;
  reportedBy?: string;
  severity: IncidentSeverity;
  synopsis: string;
}

export interface QueuedCreateDailyLogInput {
  locationId: string;
  locationName?: string;
  priority: "low" | "medium" | "high";
  synopsis: string;
  topic: string;
}

export interface QueuedUpdateDispatchStatusInput {
  currentStatus: DispatchStatus | string;
  dispatchId: string;
  locationName?: string;
  nextStatus: DispatchStatus;
  officerName?: string | null;
  recordNumber: string;
}

interface OfflineActionBase<TKind extends string, TPayload> {
  attempts: number;
  createdAt: string;
  deadLetteredAt: string | null;
  error: string | null;
  id: string;
  kind: TKind;
  lastAttemptAt: string | null;
  payload: TPayload;
  scope: OfflineActionScope;
  syncState: OfflineSyncState;
}

export type OfflineCreateIncidentAction = OfflineActionBase<
  "create-incident",
  QueuedCreateIncidentInput
>;

export type OfflineCreateDailyLogAction = OfflineActionBase<
  "create-daily-log",
  QueuedCreateDailyLogInput
>;

export type OfflineUpdateDispatchStatusAction = OfflineActionBase<
  "update-dispatch-status",
  QueuedUpdateDispatchStatusInput
>;

export type OfflineAction =
  | OfflineCreateIncidentAction
  | OfflineCreateDailyLogAction
  | OfflineUpdateDispatchStatusAction;

export type OfflineActionByKind<TKind extends OfflineAction["kind"]> = Extract<
  OfflineAction,
  { kind: TKind }
>;

export type OfflineActionDraft<TKind extends OfflineAction["kind"]> = Omit<
  OfflineActionByKind<TKind>,
  "deadLetteredAt" | "syncState"
>;

export function createOfflineActionId(kind: OfflineAction["kind"]) {
  return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isOfflineActionPending(action: OfflineAction) {
  return action.syncState === "pending";
}

export function isOfflineActionDeadLetter(action: OfflineAction) {
  return action.syncState === "dead_letter";
}
