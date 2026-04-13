import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import { useQueryClient } from "@tanstack/react-query";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { HeaderSettingsButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { GlassAlert } from "@/components/ui/glass/GlassAlert";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsIconTile } from "@/components/ui/SettingsIconTile";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { signOutCurrentUser } from "@/lib/auth";
import { clearUserScopedAppData } from "@/lib/user-scoped-data";
import { useAuthStore } from "@/stores/auth-store";
import { useCoachMarkStore } from "@/stores/coach-mark-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useIsDark, useThemeColors } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

// ---------------------------------------------------------------------------
// Icon tile color palettes (bg + fg pairs, dark-mode aware)
// ---------------------------------------------------------------------------

function useTilePalettes() {
  const isDark = useIsDark();

  return useMemo(
    () => ({
      // Operator
      person: {
        bg: isDark ? "#1E293B" : "#E0E7FF",
        fg: isDark ? "#93C5FD" : "#4F46E5",
      },
      role: {
        bg: isDark ? "#1E293B" : "#DBEAFE",
        fg: isDark ? "#60A5FA" : "#2563EB",
      },
      // Operational sync
      sync: {
        bg: isDark ? "#172554" : "#DBEAFE",
        fg: isDark ? "#60A5FA" : "#2563EB",
      },
      syncCenter: {
        bg: isDark ? "#172554" : "#E0F2FE",
        fg: isDark ? "#38BDF8" : "#0284C7",
      },
      // Modules
      cases: {
        bg: isDark ? "#312E81" : "#EDE9FE",
        fg: isDark ? "#A78BFA" : "#7C3AED",
      },
      patrons: {
        bg: isDark ? "#164E63" : "#CCFBF1",
        fg: isDark ? "#2DD4BF" : "#0D9488",
      },
      lostFound: {
        bg: isDark ? "#78350F" : "#FEF3C7",
        fg: isDark ? "#FBBF24" : "#D97706",
      },
      visitors: {
        bg: isDark ? "#1E3A5F" : "#DBEAFE",
        fg: isDark ? "#60A5FA" : "#2563EB",
      },
      vehicles: {
        bg: isDark ? "#1C1917" : "#F5F5F4",
        fg: isDark ? "#A8A29E" : "#57534E",
      },
      contacts: {
        bg: isDark ? "#14532D" : "#DCFCE7",
        fg: isDark ? "#4ADE80" : "#16A34A",
      },
      workOrders: {
        bg: isDark ? "#7C2D12" : "#FFEDD5",
        fg: isDark ? "#FB923C" : "#EA580C",
      },
      briefings: {
        bg: isDark ? "#1E3A5F" : "#E0F2FE",
        fg: isDark ? "#38BDF8" : "#0284C7",
      },
      // Tools
      alerts: {
        bg: isDark ? "#7F1D1D" : "#FEE2E2",
        fg: isDark ? "#F87171" : "#DC2626",
      },
      reports: {
        bg: isDark ? "#78350F" : "#FEF3C7",
        fg: isDark ? "#FBBF24" : "#D97706",
      },
      syncTool: {
        bg: isDark ? "#172554" : "#DBEAFE",
        fg: isDark ? "#60A5FA" : "#2563EB",
      },
      // Account
      organization: {
        bg: isDark ? "#1E293B" : "#F1F5F9",
        fg: isDark ? "#94A3B8" : "#475569",
      },
      settings: {
        bg: isDark ? "#1C1917" : "#F5F5F4",
        fg: isDark ? "#A8A29E" : "#57534E",
      },
      notifications: {
        bg: isDark ? "#7F1D1D" : "#FEE2E2",
        fg: isDark ? "#F87171" : "#DC2626",
      },
      // App
      appearance: {
        bg: isDark ? "#312E81" : "#EDE9FE",
        fg: isDark ? "#A78BFA" : "#7C3AED",
      },
      security: {
        bg: isDark ? "#14532D" : "#DCFCE7",
        fg: isDark ? "#4ADE80" : "#16A34A",
      },
      dataStorage: {
        bg: isDark ? "#1E3A5F" : "#E0F2FE",
        fg: isDark ? "#38BDF8" : "#0284C7",
      },
    }),
    [isDark]
  );
}

// Icon name + palette key for each destination
const ICON_MAP: Record<string, { icon: string; palette: string }> = {
  "/cases": { icon: "folder", palette: "cases" },
  "/patrons": { icon: "person.2", palette: "patrons" },
  "/lost-found": { icon: "tray.full", palette: "lostFound" },
  "/visitors": { icon: "person.badge.clock", palette: "visitors" },
  "/vehicles": { icon: "car", palette: "vehicles" },
  "/contacts": { icon: "person.crop.rectangle.stack", palette: "contacts" },
  "/work-orders": { icon: "wrench.and.screwdriver", palette: "workOrders" },
  "/briefings": { icon: "doc.text", palette: "briefings" },
  "/alerts": { icon: "bell.badge", palette: "alerts" },
  "/anonymous-reports": { icon: "exclamationmark.bubble", palette: "reports" },
  "/sync-center": { icon: "arrow.triangle.2.circlepath", palette: "syncTool" },
  "/settings/organization": { icon: "building.2", palette: "organization" },
  "/settings": { icon: "gearshape", palette: "settings" },
  "/notifications": { icon: "bell", palette: "notifications" },
  "/settings/appearance": { icon: "paintbrush", palette: "appearance" },
  "/settings/security": { icon: "lock.shield", palette: "security" },
  "/settings/data-storage": { icon: "internaldrive", palette: "dataStorage" },
};

const moduleDestinations = [
  { href: "/cases", label: "Cases" },
  { href: "/patrons", label: "Patrons" },
  { href: "/lost-found", label: "Lost & Found" },
  { href: "/visitors", label: "Visitors" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/contacts", label: "Contacts" },
  { href: "/work-orders", label: "Work Orders" },
  { href: "/briefings", label: "Briefings" },
] as const;

const toolDestinations = [
  { href: "/alerts", label: "Alerts" },
  { href: "/anonymous-reports", label: "Anonymous Reports" },
  { href: "/sync-center", label: "Sync Center" },
] as const;

const accountDestinations = [
  { href: "/settings/organization", label: "Organization" },
  { href: "/settings", label: "Settings" },
  { href: "/notifications", label: "Notifications" },
] as const;

const appDestinations = [
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/data-storage", label: "Data & Storage" },
] as const;

const destinationDetails: Record<string, string> = {
  "/alerts": "Urgent updates and follow-up items.",
  "/anonymous-reports": "Confidential submissions and review.",
  "/briefings": "Shift briefings and team updates.",
  "/cases": "Case management and tracking.",
  "/contacts": "People and organization records.",
  "/lost-found": "Lost and found items.",
  "/notifications": "Inbox activity for your account.",
  "/patrons": "Patron records and management.",
  "/sync-center": "Queued changes and sync health.",
  "/vehicles": "Vehicle records and assignments.",
  "/visitors": "Visitor logs and management.",
  "/work-orders": "Work order creation and tracking.",
  "/settings": "General settings and preferences.",
  "/settings/appearance": "Theme and display preferences.",
  "/settings/security": "Biometric and access controls.",
  "/settings/data-storage": "Cache and offline data management.",
  "/settings/organization": "Organization profile and details.",
};

const syncCoachMarkId = "more-sync-center";

export default function MoreScreen() {
  const colors = useThemeColors();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, layout);
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useAuthStore((state) => state.profile);
  const previewMode = useAuthStore((state) => state.previewMode);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);
  const syncCoachMarkDismissed = useCoachMarkStore((state) =>
    state.isDismissed(syncCoachMarkId)
  );
  const dismissCoachMark = useCoachMarkStore((state) => state.dismissCoachMark);
  const pendingQueueCount = useOfflineStore(
    (state) =>
      state.pendingActions.filter((action) => action.syncState === "pending")
        .length
  );
  const deadLetterCount = useOfflineStore(
    (state) =>
      state.pendingActions.filter((action) => action.syncState === "dead_letter")
        .length
  );
  const [submitting, setSubmitting] = useState(false);
  const palettes = useTilePalettes();

  /** Build a SettingsIconTile for a given destination href. */
  const tileFor = (href: string) => {
    const mapping = ICON_MAP[href];
    if (!mapping) return undefined;
    const palette = palettes[mapping.palette as keyof typeof palettes];
    if (!palette) return undefined;
    return (
      <SettingsIconTile
        backgroundColor={palette.bg}
        icon={<AppSymbol name={mapping.icon} size={17} color={palette.fg} weight="semibold" />}
      />
    );
  };

  const handleSignOut = async () => {
    setSubmitting(true);

    try {
      if (!previewMode) {
        await signOutCurrentUser();
      } else {
        await clearUserScopedAppData();
        queryClient.clear();
        setSignedOut(null, "preview_exit");
        router.replace("/login");
      }
    } catch (error) {
      Alert.alert(
        "Sign out failed",
        error instanceof Error ? error.message : "Could not sign out."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderSettingsButton onPress={() => router.push("/settings")} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        gutter="none"
        title="More"
      >
      {!syncCoachMarkDismissed ? (
        <GlassAlert
          actions={[
            {
              label: "Open Sync Center",
              onPress: () => {
                dismissCoachMark(syncCoachMarkId);
                router.push("/sync-center");
              },
            },
            {
              icon: "checkmark",
              label: "Dismiss",
              onPress: () => dismissCoachMark(syncCoachMarkId),
            },
          ]}
          message="Review queued changes and items that need attention before they slow down the shift."
          title="Sync Center"
          tone="info"
        />
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Operator" />
        <GroupedCard>
          <SettingsListRow
            leading={
              <SettingsIconTile
                backgroundColor={palettes.person.bg}
                icon={<AppSymbol name="person.fill" size={17} color={palettes.person.fg} weight="semibold" />}
              />
            }
            label={profile?.full_name ?? "Unknown operator"}
            subtitle={profile?.email ?? "No email"}
          />
          <GroupedCardDivider />
          <SettingsListRow
            leading={
              <SettingsIconTile
                backgroundColor={palettes.role.bg}
                icon={<AppSymbol name="person.text.rectangle" size={17} color={palettes.role.fg} weight="semibold" />}
              />
            }
            label="Role"
            value={profile?.role ?? "Unknown"}
            subtitle={previewMode ? "Preview session" : "Signed in"}
          />
        </GroupedCard>
        <Button
          label={previewMode ? "Exit Preview" : "Sign Out"}
          loading={submitting}
          onPress={handleSignOut}
          variant="secondary"
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Operational sync" />
        <GroupedCard>
          <SettingsListRow
            leading={
              <SettingsIconTile
                backgroundColor={palettes.sync.bg}
                icon={<AppSymbol name="arrow.clockwise" size={17} color={palettes.sync.fg} weight="semibold" />}
              />
            }
            label="Queue health"
            subtitle="Pending actions and items that need review."
            value={`${pendingQueueCount} · ${deadLetterCount}`}
          />
          <GroupedCardDivider />
          <SettingsListRow
            leading={tileFor("/sync-center")}
            label="Open Sync Center"
            onPress={() => router.push("/sync-center")}
            subtitle="Review queued changes for this device."
          />
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Modules" />
        <GroupedCard>
          {moduleDestinations.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                leading={tileFor(item.href)}
                label={item.label}
                onPress={() => router.push(item.href as never)}
                subtitle={destinationDetails[item.href] ?? "Open module"}
              />
            </View>
          ))}
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Tools" />
        <GroupedCard>
          {toolDestinations.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                leading={tileFor(item.href)}
                label={item.label}
                onPress={() => router.push(item.href as never)}
                subtitle={destinationDetails[item.href] ?? "Open tool"}
              />
            </View>
          ))}
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <GroupedCard>
          {accountDestinations.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                leading={tileFor(item.href)}
                label={item.label}
                onPress={() => router.push(item.href as never)}
                subtitle={destinationDetails[item.href] ?? "Open settings"}
              />
            </View>
          ))}
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="App" />
        <GroupedCard>
          {appDestinations.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                leading={tileFor(item.href)}
                label={item.label}
                onPress={() => router.push(item.href as never)}
                subtitle={destinationDetails[item.href] ?? "Manage settings"}
              />
            </View>
          ))}
        </GroupedCard>
      </View>
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
    },
  });
}
