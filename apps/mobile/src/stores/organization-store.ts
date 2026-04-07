import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { persistStorage } from "@/lib/storage";

interface OrganizationStore {
  _hasHydrated: boolean;
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (id: string | null) => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      selectedOrganizationId: null,
      setSelectedOrganizationId: (selectedOrganizationId) =>
        set({ selectedOrganizationId }),
    }),
    {
      name: "eztrack-mobile-org",
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        selectedOrganizationId: state.selectedOrganizationId,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[OrganizationStore] Hydration error, using defaults", error);
        }

        queueMicrotask(() => {
          useOrganizationStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
