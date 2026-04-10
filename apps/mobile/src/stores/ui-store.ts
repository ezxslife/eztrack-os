import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import { prefsStorage } from "@/lib/storage";
import type { ThemePreference } from "@/theme/colors";

interface UIStore {
  _hasHydrated: boolean;
  biometricLockEnabled: boolean;
  biometricTimeoutSeconds: number;
  colorSchemePreference: ThemePreference;
  sensoryEnabled: boolean;
  resetPreferences: () => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setBiometricTimeoutSeconds: (seconds: number) => void;
  setColorSchemePreference: (preference: ThemePreference) => void;
  setSensoryEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      biometricLockEnabled: false,
      biometricTimeoutSeconds: 300,
      colorSchemePreference: "system",
      sensoryEnabled: true,
      resetPreferences: () =>
        set({
          biometricLockEnabled: false,
          biometricTimeoutSeconds: 300,
          colorSchemePreference: "system",
          sensoryEnabled: true,
        }),
      setBiometricLockEnabled: (biometricLockEnabled) =>
        set({ biometricLockEnabled }),
      setBiometricTimeoutSeconds: (biometricTimeoutSeconds) =>
        set({ biometricTimeoutSeconds }),
      setColorSchemePreference: (colorSchemePreference) =>
        set({ colorSchemePreference }),
      setSensoryEnabled: (sensoryEnabled) => set({ sensoryEnabled }),
    }),
    {
      name: "eztrack-mobile-ui",
      storage: createJSONStorage(() => prefsStorage),
      partialize: (state) => ({
        biometricLockEnabled: state.biometricLockEnabled,
        biometricTimeoutSeconds: state.biometricTimeoutSeconds,
        colorSchemePreference: state.colorSchemePreference,
        sensoryEnabled: state.sensoryEnabled,
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
