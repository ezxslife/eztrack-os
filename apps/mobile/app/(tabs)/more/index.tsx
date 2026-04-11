import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import { NAV_BOTTOM_ITEMS, NAV_ITEMS } from "@eztrack/shared";
import { useQueryClient } from "@tanstack/react-query";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { HeaderSettingsButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { GlassAlert } from "@/components/ui/glass/GlassAlert";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { signOutCurrentUser } from "@/lib/auth";
import { clearUserScopedAppData } from "@/lib/user-scoped-data";
import { getPrimaryTabLabelsForRole } from "@/navigation/tab-specs";
import { useAuthStore } from "@/stores/auth-store";
import { useCoachMarkStore } from "@/stores/coach-mark-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useThemeColors } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const availableModuleHrefs = new Set([
  "/anonymous-reports",
  "/analytics",
  "/briefings",
  "/cases",
  "/contacts",
  "/lost-found",
  "/personnel",
  "/patrons",
  "/reports",
  "/vehicles",
  "/visitors",
  "/work-orders",
]);

const availableGlobalHrefs = new Set(["/alerts", "/notifications", "/settings"]);

const extraMobileMenuItems = [
  { href: "/anonymous-reports", label: "Anonymous Reports" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/contacts", label: "Contacts" },
] as const;

const extraGlobalDestinations = [{ href: "/sync-center", label: "Sync Center" }] as const;

const destinationDetails: Record<string, string> = {
  "/alerts": "Urgent updates and follow-up items.",
  "/analytics": "Performance and activity trends.",
  "/anonymous-reports": "Confidential submissions and review.",
  "/contacts": "People and organization records.",
  "/notifications": "Inbox activity for your account.",
  "/reports": "Operational exports and summaries.",
  "/settings": "Preferences, devices, and admin tools.",
  "/sync-center": "Queued changes and sync health.",
  "/vehicles": "Vehicle records and assignments.",
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
  const primaryTabs = getPrimaryTabLabelsForRole(profile?.role);
  const moduleItems = [
    ...NAV_ITEMS.map((item) => ({ href: item.href, label: item.label })),
    ...extraMobileMenuItems,
  ];
  const readyModules = moduleItems.filter(
    (item) => !primaryTabs.has(item.label) && availableModuleHrefs.has(item.href)
  );
  const globalDestinations = NAV_BOTTOM_ITEMS.filter((item) =>
    availableGlobalHrefs.has(item.href)
  );
  const visibleGlobalDestinations = [
    ...extraGlobalDestinations,
    ...globalDestinations.map((item) => ({
      href: item.href,
      label: item.label,
    })),
  ];

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
        <ScreenTitleStrip title="More" />
      {!syncCoachMarkDismissed ? (
        <View style={styles.alertWrap}>
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
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Operator" />
        <GroupedCard>
          <SettingsListRow
            label={profile?.full_name ?? "Unknown operator"}
            subtitle={profile?.email ?? "No email"}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Role"
            value={profile?.role ?? "Unknown"}
            subtitle={previewMode ? "Preview session" : "Signed in"}
          />
        </GroupedCard>
        <View style={styles.buttonRow}>
          <Button
            label={previewMode ? "Exit Preview" : "Sign Out"}
            loading={submitting}
            onPress={handleSignOut}
            variant="secondary"
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Operational sync" />
        <GroupedCard>
          <SettingsListRow
            label="Queue health"
            subtitle="Pending actions and items that need review."
            value={`${pendingQueueCount} · ${deadLetterCount}`}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Open Sync Center"
            onPress={() => router.push("/sync-center")}
            subtitle="Review queued changes for this device."
          />
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Available destinations" />
        {readyModules.length ? (
          <GroupedCard>
            {readyModules.map((item, index) => (
              <View key={item.label}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={item.label}
                  onPress={() => router.push(item.href as never)}
                  subtitle={destinationDetails[item.href] ?? "Open module"}
                />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <GroupedCard>
            <SettingsListRow
              label="No extra destinations"
              subtitle="Your primary tabs already cover the tools available to you."
            />
          </GroupedCard>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Global destinations" />
        <GroupedCard>
          {visibleGlobalDestinations.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                label={item.label}
                onPress={() => router.push(item.href as never)}
                subtitle={destinationDetails[item.href] ?? "Open destination"}
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
    alertWrap: {
      paddingHorizontal: layout.horizontalPadding,
    },
    buttonRow: {
      paddingHorizontal: layout.horizontalPadding,
    },
    section: {
      gap: 8,
    },
  });
}
