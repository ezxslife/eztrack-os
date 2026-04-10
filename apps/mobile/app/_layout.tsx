import "react-native-gesture-handler";
import "react-native-reanimated";

import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProviders } from "@/providers/AppProviders";
import { useCoachMarkStore } from "@/stores/coach-mark-store";
import { useAuthStore } from "@/stores/auth-store";
import { useDraftStore } from "@/stores/draft-store";
import { useFilterStore } from "@/stores/filter-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { useRecentSearchStore } from "@/stores/recent-search-store";
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
        <Stack.Screen name="anonymous-reports" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="sync-center" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const authHydrated = useAuthStore((state) => state._hasHydrated);
  const coachMarkHydrated = useCoachMarkStore((state) => state._hasHydrated);
  const draftHydrated = useDraftStore((state) => state._hasHydrated);
  const filterHydrated = useFilterStore((state) => state._hasHydrated);
  const offlineHydrated = useOfflineStore((state) => state._hasHydrated);
  const recentSearchHydrated = useRecentSearchStore(
    (state) => state._hasHydrated
  );
  const uiHydrated = useUIStore((state) => state._hasHydrated);
  const orgHydrated = useOrganizationStore((state) => state._hasHydrated);

  if (
    !authHydrated ||
    !coachMarkHydrated ||
    !draftHydrated ||
    !filterHydrated ||
    !offlineHydrated ||
    !recentSearchHydrated ||
    !uiHydrated ||
    !orgHydrated
  ) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProviders>
            <RootNavigator />
          </AppProviders>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
});
