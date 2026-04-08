import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import type { OfflineAction } from "@/lib/offline/types";
import {
  USER_SCOPED_STORAGE_KEYS,
  appStorage,
} from "@/lib/storage";

interface OfflineStore {
  _hasHydrated: boolean;
  lastProcessedAt: string | null;
  pendingActions: OfflineAction[];
  processing: boolean;
  clearDeadLetters: () => void;
  enqueueAction: (action: OfflineAction) => void;
  markActionAttempt: (id: string, error?: string | null) => void;
  markActionDeadLetter: (id: string, error: string) => void;
  removeAction: (id: string) => void;
  retryAction: (id: string) => void;
  reset: () => void;
  setActionError: (id: string, error: string | null) => void;
  setLastProcessedAt: (value: string | null) => void;
  setProcessing: (value: boolean) => void;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      lastProcessedAt: null,
      pendingActions: [],
      processing: false,
      clearDeadLetters: () =>
        set((state) => ({
          pendingActions: state.pendingActions.filter(
            (action) => action.syncState !== "dead_letter"
          ),
        })),
      enqueueAction: (action) =>
        set((state) => ({
          pendingActions: state.pendingActions.some(
            (pendingAction) => pendingAction.id === action.id
          )
            ? state.pendingActions
            : [action, ...state.pendingActions],
        })),
      markActionAttempt: (id, error = null) =>
        set((state) => ({
          pendingActions: state.pendingActions.map((action) =>
            action.id === id
              ? {
                  ...action,
                  attempts: action.attempts + 1,
                  deadLetteredAt: null,
                  error,
                  lastAttemptAt: new Date().toISOString(),
                }
              : action
          ),
        })),
      markActionDeadLetter: (id, error) =>
        set((state) => ({
          pendingActions: state.pendingActions.map((action) =>
            action.id === id
              ? {
                  ...action,
                  deadLetteredAt: new Date().toISOString(),
                  error,
                  lastAttemptAt: new Date().toISOString(),
                  syncState: "dead_letter",
                }
              : action
          ),
        })),
      removeAction: (id) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter(
            (action) => action.id !== id
          ),
        })),
      retryAction: (id) =>
        set((state) => ({
          pendingActions: state.pendingActions.map((action) =>
            action.id === id
              ? {
                  ...action,
                  deadLetteredAt: null,
                  error: null,
                  syncState: "pending",
                }
              : action
          ),
        })),
      reset: () =>
        set({
          lastProcessedAt: null,
          pendingActions: [],
          processing: false,
        }),
      setActionError: (id, error) =>
        set((state) => ({
          pendingActions: state.pendingActions.map((action) =>
            action.id === id
              ? {
                  ...action,
                  error,
                }
              : action
          ),
        })),
      setLastProcessedAt: (lastProcessedAt) => set({ lastProcessedAt }),
      setProcessing: (processing) => set({ processing }),
    }),
    {
      name: USER_SCOPED_STORAGE_KEYS.offline,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        lastProcessedAt: state.lastProcessedAt,
        pendingActions: state.pendingActions,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[OfflineStore] Hydration error, using defaults", error);
        }

        if (state) {
          state.pendingActions = state.pendingActions.map((action) => ({
            ...action,
            deadLetteredAt: action.deadLetteredAt ?? null,
            syncState: action.syncState ?? "pending",
          }));
        }

        queueMicrotask(() => {
          useOfflineStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
