import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { persistStorage } from "@/lib/storage";
import type { ThemePreference } from "@/theme/colors";

interface UIStore {
  _hasHydrated: boolean;
  colorSchemePreference: ThemePreference;
  setColorSchemePreference: (preference: ThemePreference) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      colorSchemePreference: "dark",
      setColorSchemePreference: (colorSchemePreference) => set({ colorSchemePreference }),
    }),
    {
      name: "eztrack-mobile-ui",
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        colorSchemePreference: state.colorSchemePreference,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[UIStore] Hydration error, using defaults", error);
        }

        queueMicrotask(() => {
          useUIStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
