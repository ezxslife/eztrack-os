import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { RequireAuth } from '@/components/auth/RouteGate';
import { useThemeColors } from '@/theme';

/**
 * Events Mode bottom-bar nav. Two tabs in v1: ⚡ Live and 💵 POS.
 * Quick Add / Staff / Incidents tabs land in L2.5 once the mobile shell
 * stabilizes the events-mode chrome contract.
 */
export default function EventsModeTabsLayout() {
  const colors = useThemeColors();

  return (
    <RequireAuth>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryInk,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surfaceElevated,
            borderTopColor: colors.divider,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="live"
          options={{
            title: 'Live',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pulse-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="pos"
          options={{
            title: 'POS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="run-of-show"
          options={{
            title: 'RoS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Staff',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="log-incident"
          options={{
            title: 'Incident',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </RequireAuth>
  );
}
