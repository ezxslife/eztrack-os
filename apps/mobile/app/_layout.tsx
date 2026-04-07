import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProviders } from "@/providers/AppProviders";
import { useAuthStore } from "@/stores/auth-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { useUIStore } from "@/stores/ui-store";
import {
  ThemeProvider,
  useIsDark,
  useThemeColors,
} from "@/theme";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

function RootNavigator() {
  const colors = useThemeColors();
  const isDark = useIsDark();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const authHydrated = useAuthStore((state) => state._hasHydrated);
  const uiHydrated = useUIStore((state) => state._hasHydrated);
  const orgHydrated = useOrganizationStore((state) => state._hasHydrated);

  if (!authHydrated || !uiHydrated || !orgHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProviders>
          <RootNavigator />
        </AppProviders>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
