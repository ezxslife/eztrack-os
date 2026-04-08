import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import {
  USER_SCOPED_STORAGE_KEYS,
  appStorage,
} from "@/lib/storage";

export interface DraftRecord {
  createdAt: string;
  data: Record<string, unknown>;
  id: string;
  module: string;
  updatedAt: string;
}

interface DraftStore {
  _hasHydrated: boolean;
  drafts: Record<string, DraftRecord>;
  clearAllDrafts: () => void;
  clearModuleDrafts: (module: string) => void;
  deleteDraft: (key: string) => void;
  getDraft: (module: string, draftId?: string) => DraftRecord | null;
  hasDraft: (module: string) => boolean;
  reset: () => void;
  saveDraft: (
    module: string,
    data: Record<string, unknown>,
    draftId?: string
  ) => string;
}

export function getDraftKey(module: string, draftId = "new") {
  return `${module}:${draftId}`;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      drafts: {},
      clearAllDrafts: () => set({ drafts: {} }),
      clearModuleDrafts: (module) =>
        set((state) => ({
          drafts: Object.fromEntries(
            Object.entries(state.drafts).filter(
              ([key]) => !key.startsWith(`${module}:`)
            )
          ),
        })),
      deleteDraft: (key) =>
        set((state) => {
          const nextDrafts = { ...state.drafts };
          delete nextDrafts[key];
          return { drafts: nextDrafts };
        }),
      getDraft: (module, draftId = "new") =>
        get().drafts[getDraftKey(module, draftId)] ?? null,
      hasDraft: (module) =>
        Object.keys(get().drafts).some((key) =>
          key.startsWith(`${module}:`)
        ),
      reset: () => set({ drafts: {} }),
      saveDraft: (module, data, draftId = "new") => {
        const key = getDraftKey(module, draftId);
        const now = new Date().toISOString();
        const existing = get().drafts[key];

        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: {
              createdAt: existing?.createdAt ?? now,
              data,
              id: draftId,
              module,
              updatedAt: now,
            },
          },
        }));

        return key;
      },
    }),
    {
      name: USER_SCOPED_STORAGE_KEYS.drafts,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        drafts: state.drafts,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[DraftStore] Hydration error, using defaults", error);
        }

        queueMicrotask(() => {
          useDraftStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
