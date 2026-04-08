import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProviders } from "@/providers/AppProviders";
import { useAuthStore } from "@/stores/auth-store";
import { useDraftStore } from "@/stores/draft-store";
import { useFilterStore } from "@/stores/filter-store";
import { useOfflineStore } from "@/stores/offline-store";
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
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(detail)"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="(create)"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="patrons" />
        <Stack.Screen name="cases" />
        <Stack.Screen name="lost-found" />
        <Stack.Screen name="briefings" />
        <Stack.Screen name="work-orders" />
        <Stack.Screen name="visitors" />
        <Stack.Screen name="vehicles" />
        <Stack.Screen name="contacts" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const authHydrated = useAuthStore((state) => state._hasHydrated);
  const draftHydrated = useDraftStore((state) => state._hasHydrated);
  const filterHydrated = useFilterStore((state) => state._hasHydrated);
  const offlineHydrated = useOfflineStore((state) => state._hasHydrated);
  const uiHydrated = useUIStore((state) => state._hasHydrated);
  const orgHydrated = useOrganizationStore((state) => state._hasHydrated);

  if (
    !authHydrated ||
    !draftHydrated ||
    !filterHydrated ||
    !offlineHydrated ||
    !uiHydrated ||
    !orgHydrated
  ) {
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
