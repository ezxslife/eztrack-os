import { create } from "zustand";
import type { Incident, FilterState } from "@eztrack/shared";

interface IncidentState {
  currentIncident: Incident | null;
  activeTab: string;
  filters: FilterState;

  setIncident: (incident: Incident | null) => void;
  setActiveTab: (tab: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
}

const defaultFilters: FilterState = {
  search: "",
  status: "",
  priority: "",
  dateRange: { from: null, to: null },
  location_id: null,
};

export const useIncidentStore = create<IncidentState>()((set) => ({
  currentIncident: null,
  activeTab: "details",
  filters: defaultFilters,

  setIncident: (currentIncident) =>
    set({ currentIncident }),

  setActiveTab: (activeTab) =>
    set({ activeTab }),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),
}));
