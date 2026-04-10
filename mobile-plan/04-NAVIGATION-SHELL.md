# Phase 4: Navigation Shell & Header Patterns

> **Goal:** Build the complete navigation structure — role-based tab bars with native iOS tabs, stack navigators for each module, header patterns (blur/seamless/transparent), and the root layout with provider chain.
> **Duration:** 2–3 days
> **Prerequisites:** Phase 1–3 complete
> **Reference:** EZXS-OS `apps/mobile/app/(tabs)/_layout.tsx`, `src/navigation/`

---

## 4.1 Root Layout — Provider Chain

### `app/_layout.tsx`

The root layout gates on hydration, wraps all providers, and registers all route groups.

```typescript
import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { ThemeProvider } from "@/theme";
import { AuthProvider } from "@/providers/AuthProvider";
import { OrgProvider } from "@/providers/OrgProvider";
import { queryClient } from "@/lib/api/queryClient";
import { authStore } from "@/stores/authStore";
import { uiStore } from "@/stores/uiStore";

export default function RootLayout() {
  // Hydration gate: never render before MMKV loads
  const authHydrated = authStore((s) => s._hasHydrated);
  const uiHydrated = uiStore((s) => s._hasHydrated);

  if (!authHydrated || !uiHydrated) {
    return null; // Native splash stays visible
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <OrgProvider>
                <BottomSheetModalProvider>
                  <RootNavigator />
                </BottomSheetModalProvider>
              </OrgProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const isAuthenticated = authStore((s) => s.isAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth screens */}
      <Stack.Screen name="(auth)" />

      {/* Main app — tab navigator */}
      <Stack.Screen name="(tabs)" />

      {/* Detail screens — pushed on top of tabs */}
      <Stack.Screen
        name="(detail)"
        options={{ presentation: "card" }}
      />

      {/* Create/edit screens — modal presentation */}
      <Stack.Screen
        name="(create)"
        options={{ presentation: "fullScreenModal" }}
      />

      {/* Settings stack */}
      <Stack.Screen name="settings" />

      {/* Standalone screens */}
      <Stack.Screen name="analytics" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="alerts" />
    </Stack>
  );
}
```

---

## 4.2 Auth Layout

### `app/(auth)/_layout.tsx`

```typescript
import { Redirect, Stack } from "expo-router";
import { authStore } from "@/stores/authStore";
import { useThemeColors } from "@/theme";

export default function AuthLayout() {
  const isAuthenticated = authStore((s) => s.isAuthenticated);
  const colors = useThemeColors();

  // Already logged in → go to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

---

## 4.3 Tab Bar — Role-Based Navigation

### Tab Definitions

EZTrack uses **role-based tabs**. Different roles see different primary tabs.

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
|------|-------|-------|-------|-------|-------|
| Super Admin / Org Admin | Dashboard | Incidents | Dispatch | Analytics | More |
| Manager | Dashboard | Incidents | Dispatch | Personnel | More |
| Dispatcher | Dashboard | Dispatch | Incidents | Daily Log | More |
| Supervisor / Staff | Dashboard | Daily Log | Incidents | Dispatch | More |
| Viewer | Dashboard | Incidents | Daily Log | Reports | More |

### `src/navigation/tabSpecs.ts`

```typescript
import { StaffRole } from "@eztrack/shared";

export interface TabSpec {
  name: string;
  title: string;
  sfSymbol: { default: string; selected: string };
  lucideIcon: string;
  href: string;
}

const DASHBOARD: TabSpec = {
  name: "dashboard", title: "Dashboard",
  sfSymbol: { default: "rectangle.3.group", selected: "rectangle.3.group.fill" },
  lucideIcon: "LayoutDashboard", href: "/(tabs)/dashboard",
};

const DAILY_LOG: TabSpec = {
  name: "daily-log", title: "Daily Log",
  sfSymbol: { default: "list.clipboard", selected: "list.clipboard.fill" },
  lucideIcon: "ClipboardList", href: "/(tabs)/daily-log",
};

const INCIDENTS: TabSpec = {
  name: "incidents", title: "Incidents",
  sfSymbol: { default: "shield.lefthalf.filled.trianglebadge.exclamationmark", selected: "shield.lefthalf.filled" },
  lucideIcon: "ShieldAlert", href: "/(tabs)/incidents",
};

const DISPATCH: TabSpec = {
  name: "dispatch", title: "Dispatch",
  sfSymbol: { default: "antenna.radiowaves.left.and.right", selected: "antenna.radiowaves.left.and.right" },
  lucideIcon: "Radio", href: "/(tabs)/dispatch",
};

const ANALYTICS: TabSpec = {
  name: "analytics", title: "Analytics",
  sfSymbol: { default: "chart.bar", selected: "chart.bar.fill" },
  lucideIcon: "BarChart3", href: "/(tabs)/analytics",
};

const PERSONNEL: TabSpec = {
  name: "personnel", title: "Personnel",
  sfSymbol: { default: "person.2", selected: "person.2.fill" },
  lucideIcon: "UserCog", href: "/(tabs)/personnel",
};

const REPORTS: TabSpec = {
  name: "reports", title: "Reports",
  sfSymbol: { default: "doc.text", selected: "doc.text.fill" },
  lucideIcon: "BarChart3", href: "/(tabs)/reports",
};

const MORE: TabSpec = {
  name: "more", title: "More",
  sfSymbol: { default: "ellipsis", selected: "ellipsis" },
  lucideIcon: "MoreHorizontal", href: "/(tabs)/more",
};

export function getTabsForRole(role: StaffRole): TabSpec[] {
  switch (role) {
    case StaffRole.SuperAdmin:
    case StaffRole.OrgAdmin:
      return [DASHBOARD, INCIDENTS, DISPATCH, ANALYTICS, MORE];

    case StaffRole.Manager:
      return [DASHBOARD, INCIDENTS, DISPATCH, PERSONNEL, MORE];

    case StaffRole.Dispatcher:
      return [DASHBOARD, DISPATCH, INCIDENTS, DAILY_LOG, MORE];

    case StaffRole.Supervisor:
    case StaffRole.Staff:
      return [DASHBOARD, DAILY_LOG, INCIDENTS, DISPATCH, MORE];

    case StaffRole.Viewer:
      return [DASHBOARD, INCIDENTS, DAILY_LOG, REPORTS, MORE];

    default:
      return [DASHBOARD, DAILY_LOG, INCIDENTS, DISPATCH, MORE];
  }
}

// "More" menu items — everything not in the tab bar
export const MORE_MENU_ITEMS = [
  { label: "Daily Log", icon: "ClipboardList", href: "/daily-log" },
  { label: "Patrons", icon: "Users", href: "/patrons" },
  { label: "Lost & Found", icon: "Package", href: "/lost-found" },
  { label: "Briefings", icon: "MessageSquare", href: "/briefings" },
  { label: "Cases", icon: "FolderSearch", href: "/cases" },
  { label: "Work Orders", icon: "Wrench", href: "/work-orders" },
  { label: "Visitors", icon: "UserCheck", href: "/visitors" },
  { label: "Vehicles", icon: "Car", href: "/vehicles" },
  { label: "Contacts", icon: "BookUser", href: "/contacts" },
  { label: "Reports", icon: "BarChart3", href: "/reports" },
  { label: "Analytics", icon: "TrendingUp", href: "/analytics" },
  { label: "Alerts", icon: "AlertTriangle", href: "/alerts" },
  { label: "Notifications", icon: "Bell", href: "/notifications" },
  { label: "Settings", icon: "Settings", href: "/settings" },
];
```

### `app/(tabs)/_layout.tsx`

```typescript
import React from "react";
import { Platform } from "react-native";
import { Redirect } from "expo-router";
import { authStore } from "@/stores/authStore";
import { useThemeColors, useTheme } from "@/theme";
import { getBlurTabHeaderOptions } from "@/theme/glass";
import { getTabsForRole } from "@/navigation/tabSpecs";
import { StaffRole } from "@eztrack/shared";
import { brand } from "@/theme/colors";

// Conditional native tabs import
const USE_NATIVE_TABS = Platform.OS === "ios";

export default function TabLayout() {
  const isAuthenticated = authStore((s) => s.isAuthenticated);
  const profile = authStore((s) => s.profile);
  const colors = useThemeColors();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = (profile?.role as StaffRole) ?? StaffRole.Staff;
  const tabs = getTabsForRole(role);
  const headerOptions = getBlurTabHeaderOptions(colors.background);

  if (USE_NATIVE_TABS) {
    // Import dynamically to avoid Android errors
    const { NativeTabs, NativeTabTrigger } = require("expo-router");

    return (
      <NativeTabs
        tintColor={brand.primary}
        minimizeBehavior="onScrollDown"
      >
        {tabs.map((tab) => (
          <NativeTabTrigger
            key={tab.name}
            name={tab.name}
            contentStyle={{ backgroundColor: colors.background }}
          >
            <NativeTabTrigger.Icon
              sf={{ default: tab.sfSymbol.default, selected: tab.sfSymbol.selected }}
            />
            <NativeTabTrigger.Label>{tab.title}</NativeTabTrigger.Label>
          </NativeTabTrigger>
        ))}
      </NativeTabs>
    );
  }

  // Android fallback: Expo Router Tabs
  const { Tabs } = require("expo-router");
  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: brand.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        />
      ))}
    </Tabs>
  );
}
```

---

## 4.4 Header Patterns

### Three Header Types (matching EZXS-OS patterns)

**1. Blur Tab Headers** — Tab root screens (Dashboard, Incidents list, Dispatch board)
- iOS 26+: `scrollEdgeEffects: { top: 'automatic' }` for native glass transitions
- iOS <26: `headerBlurEffect: 'systemChromeMaterial'`
- Keep `headerTitle` minimal; real title in `ScreenTitleStrip`

**2. Seamless Headers** — Detail/form screens (Incident detail, Create incident)
- Solid background matching page background
- Back button + action buttons in header
- Full title in `ScreenTitleStrip`

**3. Transparent Headers** — Immersive screens (only if hero image/map)
- Transparent background
- Animated opacity on scroll
- Rare in EZTrack (maybe incident photo view)

### Native Header Button Builders

### `src/navigation/nativeHeaderOptions.tsx`

```typescript
import React from "react";
import { Platform, Pressable, View, Text } from "react-native";
import { useThemeColors } from "@/theme";
import { brand } from "@/theme/colors";
import { safeHaptics } from "@/lib/safeHaptics";

interface SfButtonOptions {
  sfSymbolName: string;
  onPress: () => void;
  accessibilityLabel: string;
  tintColor?: string;
}

export function makeNativeSfButtonItem({
  sfSymbolName,
  onPress,
  accessibilityLabel,
  tintColor,
}: SfButtonOptions) {
  if (Platform.OS === "ios") {
    // Return native SF Symbol header button config
    return {
      headerRight: () => ({
        sfSymbol: sfSymbolName,
        onPress: () => {
          safeHaptics.light();
          onPress();
        },
        accessibilityLabel,
        tintColor: tintColor ?? brand.primary,
      }),
    };
  }

  // Android: Lucide icon pressable
  return {
    headerRight: () => (
      <Pressable
        onPress={() => {
          safeHaptics.light();
          onPress();
        }}
        accessibilityLabel={accessibilityLabel}
        style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center" }}
      >
        {/* Lucide icon here */}
      </Pressable>
    ),
  };
}
```

---

## 4.5 Screen Container Pattern

### `src/components/layout/ScreenContainer.tsx`

Standard wrapper for all screens — handles safe area insets and blur header offset.

```typescript
import React from "react";
import { View, StyleSheet, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/theme";

interface ScreenContainerProps extends ViewProps {
  /** Add top padding for transparent/blur headers */
  blurHeader?: boolean;
  /** Disable default horizontal padding */
  noPadding?: boolean;
}

export function ScreenContainer({
  children,
  blurHeader = false,
  noPadding = false,
  style,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        blurHeader && { paddingTop: insets.top + 44 },
        !noPadding && styles.padding,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padding: { paddingHorizontal: 16 },
});
```

---

## 4.6 "More" Screen

### `app/(tabs)/more/index.tsx`

The "More" tab is a menu of all modules not in the current role's tab bar.

```typescript
import React from "react";
import { ScrollView, Pressable, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme";
import { ScreenTitleStrip } from "@/components/ui/ScreenTitleStrip";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MORE_MENU_ITEMS } from "@/navigation/tabSpecs";
import { iconMap } from "@/components/ui/icons";
import { safeHaptics } from "@/lib/safeHaptics";

export default function MoreScreen() {
  const router = useRouter();
  const { colors, typography: type, spacing } = useTheme();

  return (
    <ScreenContainer blurHeader>
      <ScreenTitleStrip title="More" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {MORE_MENU_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <Pressable
              key={item.href}
              onPress={() => {
                safeHaptics.light();
                router.push(item.href as any);
              }}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.surfaceElevated : "transparent" },
              ]}
            >
              <View style={[styles.iconBg, { backgroundColor: colors.surfaceElevated }]}>
                {Icon && <Icon size={20} color={colors.textSecondary} />}
              </View>
              <Text style={[type.body, { color: colors.textPrimary, flex: 1 }]}>
                {item.label}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
```

---

## 4.7 Auth Gate (Route Protection)

### Navigation guard in root layout:

```typescript
// In RootNavigator, redirect based on auth state:
function RootNavigator() {
  const isAuthenticated = authStore((s) => s.isAuthenticated);
  const isLoading = authStore((s) => s.isLoading);

  if (isLoading) return null; // Splash still showing

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="(auth)" />
      ) : (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(detail)" options={{ presentation: "card" }} />
          <Stack.Screen name="(create)" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="settings" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="alerts" />
        </>
      )}
    </Stack>
  );
}
```

---

## 4.8 Verification Checklist

- [ ] Root layout renders provider chain without crash
- [ ] Hydration gate prevents flash before MMKV loads
- [ ] Unauthenticated users see login screen only
- [ ] Authenticated users see tab bar with correct role-based tabs
- [ ] NativeTabs render on iOS with SF Symbols and brand tint
- [ ] Tab bar hides on scroll down (`minimizeBehavior`)
- [ ] Blur headers show glass effect on iOS 26+ simulator
- [ ] "More" screen lists all modules not in active tabs
- [ ] Back navigation works from detail → tab screens
- [ ] Modal presentation works for create screens
- [ ] Header buttons have 44pt touch targets
- [ ] Theme colors propagate to navigation headers and tab bar

---

**Previous:** [← Phase 3 — Auth & Data Layer](./03-AUTH-DATA-LAYER.md)
**Next:** [Phase 5 — Core Modules →](./05-CORE-MODULES.md)
