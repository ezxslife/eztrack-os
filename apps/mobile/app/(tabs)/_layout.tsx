import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { NativeHeaderProvider } from "@/navigation/NativeHeaderContext";
import { TAB_ROOT_ROUTE_METADATA } from "@/navigation/route-metadata";
import {
  ALL_TAB_SPECS,
  getTabsForRole,
} from "@/navigation/tab-specs";
import { useAuthStore } from "@/stores/auth-store";
import { getBlurTabHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

export default function TabLayout() {
  const colors = useThemeColors();
  const role = useAuthStore((state) => state.profile?.role);
  const visibleTabs = getTabsForRole(role);
  const visibleRoutes = new Set(visibleTabs.map((tab) => tab.routeName));

  return (
    <RequireAuth>
      <NativeHeaderProvider enabled>
        <Tabs
          screenOptions={{
            ...getBlurTabHeaderOptions(colors.background),
            headerTintColor: colors.primaryInk,
            tabBarActiveTintColor: colors.primaryInk,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "600",
            },
            tabBarStyle: {
              backgroundColor: colors.surfaceElevated,
              borderTopColor: colors.divider,
            },
            sceneStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          {ALL_TAB_SPECS.map((spec) => (
            <Tabs.Screen
              key={spec.routeName}
              name={spec.routeName}
              options={{
                headerTitle:
                  TAB_ROOT_ROUTE_METADATA[
                    spec.routeName.replace("/index", "") as keyof typeof TAB_ROOT_ROUTE_METADATA
                  ]?.title ?? spec.title,
                href: visibleRoutes.has(spec.routeName) ? undefined : null,
                title: spec.title,
                tabBarIcon: ({ color, size }) => (
                  <Ionicons
                    color={color}
                    name={spec.androidIcon}
                    size={size}
                  />
                ),
              }}
            />
          ))}
        </Tabs>
      </NativeHeaderProvider>
    </RequireAuth>
  );
}
