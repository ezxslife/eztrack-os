import { create } from "zustand";
import type { DailyLogInput } from "@eztrack/shared";

interface DailyLogState {
  isQuickReportOpen: boolean;
  draft: DailyLogInput | null;

  openQuickReport: () => void;
  closeQuickReport: () => void;
  saveDraft: (draft: DailyLogInput | null) => void;
}

export const useDailyLogStore = create<DailyLogState>()((set) => ({
  isQuickReportOpen: false,
  draft: null,

  openQuickReport: () =>
    set({ isQuickReportOpen: true }),

  closeQuickReport: () =>
    set({ isQuickReportOpen: false }),

  saveDraft: (draft) =>
    set({ draft }),
}));
