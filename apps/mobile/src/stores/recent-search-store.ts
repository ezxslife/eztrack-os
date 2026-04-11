import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import {
  USER_SCOPED_STORAGE_KEYS,
  appStorage,
} from "@/lib/storage";

const MAX_RECENT_SEARCHES_PER_SCOPE = 8;
const EMPTY_RECENT_SEARCHES: RecentSearchEntry[] = [];

export interface RecentSearchEntry {
  query: string;
  updatedAt: string;
}

interface RecentSearchStore {
  _hasHydrated: boolean;
  entriesByScope: Record<string, RecentSearchEntry[]>;
  addRecentSearch: (scope: string, query: string) => void;
  clearRecentSearches: (scope?: string) => void;
  getRecentSearches: (scope: string) => RecentSearchEntry[];
  removeRecentSearch: (scope: string, query: string) => void;
  reset: () => void;
}

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function selectRecentSearches(scope: string) {
  return (state: RecentSearchStore) =>
    state.entriesByScope[scope] ?? EMPTY_RECENT_SEARCHES;
}

export const useRecentSearchStore = create<RecentSearchStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      entriesByScope: {},
      addRecentSearch: (scope, query) => {
        const normalizedQuery = normalizeQuery(query);

        if (normalizedQuery.length < 2) {
          return;
        }

        const now = new Date().toISOString();

        set((state) => {
          const currentEntries = state.entriesByScope[scope] ?? EMPTY_RECENT_SEARCHES;
          const nextEntries = [
            {
              query: normalizedQuery,
              updatedAt: now,
            },
            ...currentEntries.filter(
              (entry) =>
                entry.query.toLowerCase() !== normalizedQuery.toLowerCase()
            ),
          ].slice(0, MAX_RECENT_SEARCHES_PER_SCOPE);

          return {
            entriesByScope: {
              ...state.entriesByScope,
              [scope]: nextEntries,
            },
          };
        });
      },
      clearRecentSearches: (scope) =>
        set((state) => {
          if (!scope) {
            return { entriesByScope: {} };
          }

          const nextEntriesByScope = { ...state.entriesByScope };
          delete nextEntriesByScope[scope];

          return {
            entriesByScope: nextEntriesByScope,
          };
        }),
      getRecentSearches: (scope) =>
        get().entriesByScope[scope] ?? EMPTY_RECENT_SEARCHES,
      removeRecentSearch: (scope, query) => {
        const normalizedQuery = normalizeQuery(query);

        set((state) => ({
          entriesByScope: {
            ...state.entriesByScope,
            [scope]: (state.entriesByScope[scope] ?? []).filter(
              (entry) =>
                entry.query.toLowerCase() !== normalizedQuery.toLowerCase()
            ),
          },
        }));
      },
      reset: () => set({ entriesByScope: {} }),
    }),
    {
      name: USER_SCOPED_STORAGE_KEYS.recentSearches,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        entriesByScope: state.entriesByScope,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn(
            "[RecentSearchStore] Hydration error, using defaults",
            error
          );
        }

        queueMicrotask(() => {
          useRecentSearchStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
