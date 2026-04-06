import { create } from "zustand";
import type { Dispatch, FilterState } from "@eztrack/shared";

interface DispatchState {
  activeDispatches: Dispatch[];
  filters: FilterState;
  selectedDispatch: Dispatch | null;

  setDispatches: (dispatches: Dispatch[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  selectDispatch: (dispatch: Dispatch | null) => void;
  clearSelection: () => void;
}

const defaultFilters: FilterState = {
  search: "",
  status: "",
  priority: "",
  dateRange: { from: null, to: null },
  location_id: null,
};

export const useDispatchStore = create<DispatchState>()((set) => ({
  activeDispatches: [],
  filters: defaultFilters,
  selectedDispatch: null,

  setDispatches: (activeDispatches) =>
    set({ activeDispatches }),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  selectDispatch: (selectedDispatch) =>
    set({ selectedDispatch }),

  clearSelection: () =>
    set({ selectedDispatch: null }),
}));
