import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import {
  USER_SCOPED_STORAGE_KEYS,
  appStorage,
} from "@/lib/storage";

interface OrganizationStore {
  _hasHydrated: boolean;
  selectedOrganizationId: string | null;
  selectedPropertyId: string | null;
  reset: () => void;
  setContext: (input: {
    organizationId: string | null;
    propertyId: string | null;
  }) => void;
  setSelectedOrganizationId: (id: string | null) => void;
  setSelectedPropertyId: (id: string | null) => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      reset: () =>
        set({
          selectedOrganizationId: null,
          selectedPropertyId: null,
        }),
      selectedOrganizationId: null,
      selectedPropertyId: null,
      setContext: ({ organizationId, propertyId }) =>
        set({
          selectedOrganizationId: organizationId,
          selectedPropertyId: propertyId,
        }),
      setSelectedOrganizationId: (selectedOrganizationId) =>
        set({ selectedOrganizationId }),
      setSelectedPropertyId: (selectedPropertyId) =>
        set({ selectedPropertyId }),
    }),
    {
      name: USER_SCOPED_STORAGE_KEYS.organization,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        selectedOrganizationId: state.selectedOrganizationId,
        selectedPropertyId: state.selectedPropertyId,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn(
            "[OrganizationStore] Hydration error, using defaults",
            error
          );
        }

        queueMicrotask(() => {
          useOrganizationStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
