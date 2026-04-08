import type { FilterState } from "@eztrack/shared";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import {
  USER_SCOPED_STORAGE_KEYS,
  appStorage,
} from "@/lib/storage";

export const defaultFilterState: FilterState = {
  dateRange: {
    from: null,
    to: null,
  },
  location_id: null,
  priority: "",
  search: "",
  status: "",
};

interface FilterStore {
  _hasHydrated: boolean;
  filters: Record<string, FilterState>;
  clearAllFilters: () => void;
  clearFilter: (module: string) => void;
  getFilter: (module: string) => FilterState;
  hasActiveFilter: (module: string) => boolean;
  reset: () => void;
  setFilter: (module: string, updates: Partial<FilterState>) => void;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      filters: {},
      clearAllFilters: () => set({ filters: {} }),
      clearFilter: (module) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [module]: { ...defaultFilterState },
          },
        })),
      getFilter: (module) => get().filters[module] ?? defaultFilterState,
      hasActiveFilter: (module) => {
        const filter = get().filters[module];

        if (!filter) {
          return false;
        }

        return Boolean(
          filter.search ||
            filter.status ||
            filter.priority ||
            filter.location_id ||
            filter.dateRange.from ||
            filter.dateRange.to
        );
      },
      reset: () => set({ filters: {} }),
      setFilter: (module, updates) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [module]: {
              ...(state.filters[module] ?? defaultFilterState),
              ...updates,
            },
          },
        })),
    }),
    {
      name: USER_SCOPED_STORAGE_KEYS.filters,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        filters: state.filters,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[FilterStore] Hydration error, using defaults", error);
        }

        queueMicrotask(() => {
          useFilterStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
