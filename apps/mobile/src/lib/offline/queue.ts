import type { DispatchStatus } from "@eztrack/shared";

import type { MutationProfile } from "@/lib/services/mutation-profile";
import { createDailyLogRecord } from "@/lib/services/daily-logs";
import { updateDispatchStatusRecord } from "@/lib/services/dispatches";
import { createIncidentRecord } from "@/lib/services/incidents";
import { useOfflineStore } from "@/stores/offline-store";
import type {
  OfflineAction,
  OfflineActionByKind,
  OfflineActionDraft,
  QueuedCreateDailyLogInput,
  QueuedCreateIncidentInput,
  QueuedUpdateDispatchStatusInput,
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

async function processOfflineAction(
  action: OfflineAction,
  profile: MutationProfile
) {
  switch (action.kind) {
    case "create-incident":
      await createIncidentRecord(action.payload, profile);
      return;
    case "create-daily-log":
      await createDailyLogRecord(action.payload, profile);
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
    case "create-daily-log":
      return action.payload.topic;
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
    case "create-daily-log":
      return `${action.payload.topic} at ${action.payload.locationName ?? "Unknown location"}`;
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
