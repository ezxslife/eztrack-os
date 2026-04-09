import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import {
  USER_SCOPED_STORAGE_KEYS,
  appStorage,
} from "@/lib/storage";

interface CoachMarkStore {
  _hasHydrated: boolean;
  dismissedAt: Record<string, string>;
  dismissCoachMark: (id: string) => void;
  isDismissed: (id: string) => boolean;
  reset: () => void;
  resetCoachMark: (id: string) => void;
}

export const useCoachMarkStore = create<CoachMarkStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      dismissedAt: {},
      dismissCoachMark: (id) =>
        set((state) => ({
          dismissedAt: {
            ...state.dismissedAt,
            [id]: new Date().toISOString(),
          },
        })),
      isDismissed: (id) => Boolean(get().dismissedAt[id]),
      reset: () => set({ dismissedAt: {} }),
      resetCoachMark: (id) =>
        set((state) => {
          const nextDismissedAt = { ...state.dismissedAt };
          delete nextDismissedAt[id];

          return {
            dismissedAt: nextDismissedAt,
          };
        }),
    }),
    {
      name: USER_SCOPED_STORAGE_KEYS.coachMarks,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        dismissedAt: state.dismissedAt,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[CoachMarkStore] Hydration error, using defaults", error);
        }

        queueMicrotask(() => {
          useCoachMarkStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
