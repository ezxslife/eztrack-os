import type { DispatchStatus } from "@eztrack/shared";

import type { MutationProfile } from "@/lib/services/mutation-profile";
import {
  createDailyLogRecord,
  updateDailyLogRecord,
} from "@/lib/services/daily-logs";
import {
  assignDispatchOfficer,
  updateDispatchStatusRecord,
} from "@/lib/services/dispatches";
import {
  createIncidentRecord,
  createIncidentNarrativeRecord,
  updateIncidentRecord,
} from "@/lib/services/incidents";
import { useOfflineStore } from "@/stores/offline-store";
import type {
  OfflineAction,
  OfflineActionByKind,
  OfflineActionDraft,
  QueuedCreateIncidentNarrativeInput,
  QueuedAssignDispatchInput,
  QueuedCreateDailyLogInput,
  QueuedCreateIncidentInput,
  QueuedUpdateDailyLogInput,
  QueuedUpdateDispatchStatusInput,
  QueuedUpdateIncidentInput,
} from "@/lib/offline/types";
import {
  createOfflineActionId,
  isOfflineActionPending,
} from "@/lib/offline/types";

const MAX_SYNC_ATTEMPTS = 3;

export interface QueuedMutationResult {
  id: string;
  queued: true;
  record_number: string;
}

export interface QueuedDispatchStatusResult {
  id: string;
  queued: true;
  status: DispatchStatus;
}

export interface QueuedDispatchAssignmentResult {
  assigned_staff_id: null | string;
  id: string;
  queued: true;
}

export interface QueuedIncidentNarrativeResult {
  id: string;
  queued: true;
  title: string;
}

export interface QueueProcessingResult {
  deadLetterCount: number;
  failedCount: number;
  processedCount: number;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "The action could not be synced.";
}

function isPermanentSyncError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("forbidden") ||
    message.includes("unauthorized") ||
    message.includes("permission") ||
    message.includes("required") ||
    message.includes("violates") ||
    message.includes("not-null") ||
    message.includes("duplicate key")
  );
}

export function shouldQueueMutationError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("connection") ||
    message.includes("timeout")
  );
}

function shouldDeadLetterAction(action: OfflineAction, error: unknown) {
  return (
    isPermanentSyncError(error) ||
    action.attempts >= MAX_SYNC_ATTEMPTS
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled offline action: ${JSON.stringify(value)}`);
}

function createScopedAction<TKind extends OfflineAction["kind"]>(
  action: OfflineActionDraft<TKind>
): OfflineActionByKind<TKind> {
  return {
    ...action,
    deadLetteredAt: null,
    syncState: "pending",
  } as OfflineActionByKind<TKind>;
}

export function queueIncidentCreate(
  profile: MutationProfile,
  input: QueuedCreateIncidentInput
): QueuedMutationResult {
  const action = createScopedAction({
    attempts: 0,
    createdAt: new Date().toISOString(),
    error: null,
    id: createOfflineActionId("create-incident"),
    kind: "create-incident" as const,
    lastAttemptAt: null,
    payload: input,
    scope: {
      orgId: profile.orgId,
      propertyId: profile.propertyId,
      userId: profile.id,
    },
  });

  useOfflineStore.getState().enqueueAction(action);

  return {
    id: action.id,
    queued: true,
    record_number: "INC-QUEUED",
  };
}

export function queueDailyLogCreate(
  profile: MutationProfile,
  input: QueuedCreateDailyLogInput
): QueuedMutationResult {
  const action = createScopedAction({
    attempts: 0,
    createdAt: new Date().toISOString(),
    error: null,
    id: createOfflineActionId("create-daily-log"),
    kind: "create-daily-log" as const,
    lastAttemptAt: null,
    payload: input,
    scope: {
      orgId: profile.orgId,
      propertyId: profile.propertyId,
      userId: profile.id,
    },
  });

  useOfflineStore.getState().enqueueAction(action);

  return {
    id: action.id,
    queued: true,
    record_number: "DL-QUEUED",
  };
}

export function queueIncidentUpdate(
  profile: MutationProfile,
  input: QueuedUpdateIncidentInput
): QueuedMutationResult {
  const action = createScopedAction({
    attempts: 0,
    createdAt: new Date().toISOString(),
    error: null,
    id: createOfflineActionId("update-incident"),
    kind: "update-incident" as const,
    lastAttemptAt: null,
    payload: input,
    scope: {
      orgId: profile.orgId,
      propertyId: profile.propertyId,
      userId: profile.id,
    },
  });

  useOfflineStore.getState().enqueueAction(action);

  return {
    id: input.incidentId,
    queued: true,
    record_number: input.recordNumber,
  };
}

export function queueIncidentNarrativeCreate(
  profile: MutationProfile,
  input: QueuedCreateIncidentNarrativeInput
): QueuedIncidentNarrativeResult {
  const action = createScopedAction({
    attempts: 0,
    createdAt: new Date().toISOString(),
    error: null,
    id: createOfflineActionId("create-incident-narrative"),
    kind: "create-incident-narrative" as const,
    lastAttemptAt: null,
    payload: input,
    scope: {
      orgId: profile.orgId,
      propertyId: profile.propertyId,
      userId: profile.id,
    },
  });

  useOfflineStore.getState().enqueueAction(action);

  return {
    id: action.id,
    queued: true,
    title: input.title?.trim() || "Narrative",
  };
}

export function queueDailyLogUpdate(
  profile: MutationProfile,
  input: QueuedUpdateDailyLogInput
): QueuedMutationResult {
  const action = createScopedAction({
    attempts: 0,
    createdAt: new Date().toISOString(),
    error: null,
    id: createOfflineActionId("update-daily-log"),
    kind: "update-daily-log" as const,
    lastAttemptAt: null,
    payload: input,
    scope: {
      orgId: profile.orgId,
      propertyId: profile.propertyId,
      userId: profile.id,
    },
  });

  useOfflineStore.getState().enqueueAction(action);

  return {
    id: input.dailyLogId,
    queued: true,
    record_number: input.recordNumber,
  };
}

export function queueDispatchStatusUpdate(
  profile: MutationProfile,
  input: QueuedUpdateDispatchStatusInput
): QueuedDispatchStatusResult {
  const action = createScopedAction({
    attempts: 0,
    createdAt: new Date().toISOString(),
    error: null,
    id: createOfflineActionId("update-dispatch-status"),
    kind: "update-dispatch-status" as const,
    lastAttemptAt: null,
    payload: input,
    scope: {
      orgId: profile.orgId,
      propertyId: profile.propertyId,
      userId: profile.id,
    },
  });

  useOfflineStore.getState().enqueueAction(action);

  return {
    id: action.id,
    queued: true,
    status: input.nextStatus,
  };
}

export function queueDispatchAssignment(
  profile: MutationProfile,
  input: QueuedAssignDispatchInput
): QueuedDispatchAssignmentResult {
  const action = createScopedAction({
    attempts: 0,
    createdAt: new Date().toISOString(),
    error: null,
    id: createOfflineActionId("assign-dispatch"),
    kind: "assign-dispatch" as const,
    lastAttemptAt: null,
    payload: input,
    scope: {
      orgId: profile.orgId,
      propertyId: profile.propertyId,
      userId: profile.id,
    },
  });

  useOfflineStore.getState().enqueueAction(action);

  return {
    assigned_staff_id: input.nextOfficerId,
    id: input.dispatchId,
    queued: true,
  };
}

async function processOfflineAction(
  action: OfflineAction,
  profile: MutationProfile
) {
  switch (action.kind) {
    case "create-incident":
      await createIncidentRecord(action.payload, profile);
      return;
    case "create-incident-narrative":
      await createIncidentNarrativeRecord(action.payload, profile);
      return;
    case "create-daily-log":
      await createDailyLogRecord(action.payload, profile);
      return;
    case "update-incident":
      await updateIncidentRecord(action.payload, profile);
      return;
    case "update-daily-log":
      await updateDailyLogRecord(action.payload, profile);
      return;
    case "assign-dispatch":
      await assignDispatchOfficer(action.payload);
      return;
    case "update-dispatch-status":
      await updateDispatchStatusRecord(action.payload);
      return;
    default:
      return assertNever(action);
  }
}

export function getOfflineActionTitle(action: OfflineAction) {
  switch (action.kind) {
    case "create-incident":
      return "Queued incident";
    case "create-incident-narrative":
      return action.payload.incidentRecordNumber;
    case "create-daily-log":
      return action.payload.topic;
    case "update-incident":
      return action.payload.recordNumber;
    case "update-daily-log":
      return action.payload.recordNumber;
    case "assign-dispatch":
      return action.payload.recordNumber;
    case "update-dispatch-status":
      return action.payload.recordNumber;
    default:
      return assertNever(action);
  }
}

export function getOfflineActionDescription(action: OfflineAction) {
  switch (action.kind) {
    case "create-incident":
      return `${action.payload.incidentType} at ${action.payload.locationName ?? "Unknown location"}`;
    case "create-incident-narrative":
      return action.payload.title?.trim() || "Narrative";
    case "create-daily-log":
      return `${action.payload.topic} at ${action.payload.locationName ?? "Unknown location"}`;
    case "update-incident":
      return `${action.payload.status.replace(/_/g, " ")} · ${action.payload.incidentType}`;
    case "update-daily-log":
      return `${action.payload.status.replace(/_/g, " ")} · ${action.payload.topic}`;
    case "assign-dispatch":
      return action.payload.nextOfficerName
        ? `Assign to ${action.payload.nextOfficerName}`
        : "Clear assignment";
    case "update-dispatch-status":
      return `${action.payload.currentStatus} -> ${action.payload.nextStatus}`;
    default:
      return assertNever(action);
  }
}

export function processPendingActions(
  profile: MutationProfile
): Promise<QueueProcessingResult> {
  const store = useOfflineStore.getState();

  if (store.processing) {
    return Promise.resolve({
      deadLetterCount: 0,
      failedCount: 0,
      processedCount: 0,
    });
  }

  store.setProcessing(true);

  return (async () => {
    let deadLetterCount = 0;
    let failedCount = 0;
    let processedCount = 0;

    try {
      const actions = [...useOfflineStore.getState().pendingActions];

      for (const action of actions) {
        if (!isOfflineActionPending(action)) {
          continue;
        }

        if (
          action.scope.userId !== profile.id ||
          action.scope.orgId !== profile.orgId
        ) {
          useOfflineStore.getState().removeAction(action.id);
          continue;
        }

        try {
          useOfflineStore.getState().markActionAttempt(action.id, null);
          await processOfflineAction(action, profile);
          processedCount += 1;
          useOfflineStore.getState().removeAction(action.id);
        } catch (error) {
          failedCount += 1;
          const errorMessage = getErrorMessage(error);
          const attemptedAction =
            useOfflineStore
              .getState()
              .pendingActions.find((candidate) => candidate.id === action.id) ??
            action;

          if (shouldDeadLetterAction(attemptedAction, error)) {
            deadLetterCount += 1;
            useOfflineStore.getState().markActionDeadLetter(action.id, errorMessage);
          } else {
            useOfflineStore.getState().setActionError(action.id, errorMessage);
          }
        }
      }

      useOfflineStore
        .getState()
        .setLastProcessedAt(new Date().toISOString());

      return {
        deadLetterCount,
        failedCount,
        processedCount,
      };
    } finally {
      useOfflineStore.getState().setProcessing(false);
    }
  })();
}
