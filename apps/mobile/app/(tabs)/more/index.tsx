import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { NAV_BOTTOM_ITEMS, NAV_ITEMS } from "@eztrack/shared";
import { useQueryClient } from "@tanstack/react-query";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { GlassAlert } from "@/components/ui/glass/GlassAlert";
import { signOutCurrentUser } from "@/lib/auth";
import { clearUserScopedAppData } from "@/lib/user-scoped-data";
import { getPrimaryTabLabelsForRole } from "@/navigation/tab-specs";
import { useAuthStore } from "@/stores/auth-store";
import { useCoachMarkStore } from "@/stores/coach-mark-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useThemeColors } from "@/theme";

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

const availableGlobalHrefs = new Set([
  "/alerts",
  "/notifications",
  "/settings",
]);

const extraMobileMenuItems = [
  { href: "/anonymous-reports", label: "Anonymous Reports" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/contacts", label: "Contacts" },
] as const;

const extraGlobalDestinations = [
  { href: "/sync-center", label: "Sync Center" },
] as const;

const syncCoachMarkId = "more-sync-center";

export default function MoreScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
    (item) =>
      !primaryTabs.has(item.label) && availableModuleHrefs.has(item.href)
  );
  const queuedModules = moduleItems.filter(
    (item) =>
      !primaryTabs.has(item.label) && !availableModuleHrefs.has(item.href)
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
      Alert.alert("Sign out failed", error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      subtitle="The first mobile tranche stays focused. Everything else is still visible as grouped destinations."
      title="More"
    >
      <MaterialSurface intensity={72} variant="panel">
        <Text style={styles.bannerTitle}>Native-first, module-second</Text>
        <Text style={styles.bannerCopy}>
          Use the system for the shell. Use grouped rows and clear hierarchy for everything that
          hangs off the core tabs.
        </Text>
      </MaterialSurface>

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
          message="Queued writes already replay automatically. Sync Center is where operators can inspect pending work and dead letters before they become support incidents."
          title="Operational hint"
          tone="info"
        />
      ) : null}

      <SectionCard subtitle={previewMode ? "Preview mode" : "Live session"} title="Operator">
        <View style={styles.list}>
          <View style={styles.row}>
            <Text style={styles.title}>{profile?.full_name ?? "Unknown operator"}</Text>
            <Text style={styles.meta}>{profile?.email ?? "No email"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.title}>Role</Text>
            <Text style={styles.meta}>{profile?.role ?? "unknown"}</Text>
          </View>
          <Button
            label={previewMode ? "Exit Preview" : "Sign Out"}
            loading={submitting}
            onPress={handleSignOut}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Recovery and replay controls for the offline queue now live outside Settings."
        title="Operational sync"
      >
        <View style={styles.list}>
          <View style={styles.row}>
            <Text style={styles.title}>Queue health</Text>
            <Text style={styles.meta}>
              {pendingQueueCount} pending · {deadLetterCount} needs review
            </Text>
          </View>
          <Button
            label="Open Sync Center"
            onPress={() => router.push("/sync-center")}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle="These routes are now registered in the mobile shell."
        title="Available destinations"
      >
        <View style={styles.list}>
          {readyModules.length ? (
            readyModules.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.href as never)}
                style={styles.row}
              >
                <Text style={styles.title}>{item.label}</Text>
                <Text style={styles.meta}>{item.href}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.meta}>Your current role already uses the available module tabs.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Global destinations">
        <View style={styles.list}>
          {visibleGlobalDestinations.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href as never)}
              style={styles.row}
            >
              <Text style={styles.title}>{item.label}</Text>
              <Text style={styles.meta}>{item.href}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        subtitle="These modules still need their native screens and workflows."
        title="Still queued for port"
      >
        <View style={styles.list}>
          {queuedModules.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.title}>{item.label}</Text>
              <Text style={styles.meta}>{item.href}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    bannerCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    bannerTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    list: {
      gap: 12,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
      marginTop: 4,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
