import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { RequireAuth } from "@/components/auth/RouteGate";
import { getBlurTabHeaderOptions } from "@/theme/headers";
import { useThemeColors } from "@/theme";

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <RequireAuth>
      <Tabs
        screenOptions={{
          ...getBlurTabHeaderOptions(colors.background),
          headerTitle: "",
          headerTintColor: colors.textPrimary,
          tabBarActiveTintColor: colors.primaryStrong,
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
        <Tabs.Screen
          name="dashboard/index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="daily-log/index"
          options={{
            title: "Daily Log",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="dispatch/index"
          options={{
            title: "Dispatch",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="radio-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="incidents/index"
          options={{
            title: "Incidents",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more/index"
          options={{
            title: "More",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </RequireAuth>
  );
}
