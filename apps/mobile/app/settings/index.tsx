import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import type { ThemePreference } from "@/theme/colors";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { GlassSwitch } from "@/components/ui/glass/GlassSwitch";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  getOfflineActionDescription,
  getOfflineActionTitle,
} from "@/lib/offline/queue";
import { syncOfflineQueueNow } from "@/lib/offline/sync";
import { useToast } from "@/providers/ToastProvider";
import { useAuthStore } from "@/stores/auth-store";
import { useCoachMarkStore } from "@/stores/coach-mark-store";
import { useDraftStore } from "@/stores/draft-store";
import { useFilterStore } from "@/stores/filter-store";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useRecentSearchStore } from "@/stores/recent-search-store";
import { useStorageHealthStore } from "@/stores/storage-health-store";
import { useUIStore } from "@/stores/ui-store";
import { useThemeColors, useThemeTypography } from "@/theme";

const themeOptions: ThemePreference[] = ["system", "light", "dark"];

const timeoutOptions = [
  { label: "Immediate", seconds: 0 },
  { label: "1 Min", seconds: 60 },
  { label: "5 Min", seconds: 300 },
  { label: "15 Min", seconds: 900 },
];

const adminDestinations = [
  { href: "/settings/organization", label: "Organization" },
  { href: "/settings/properties", label: "Properties" },
  { href: "/settings/locations", label: "Locations" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/dropdowns", label: "Dropdowns" },
  { href: "/settings/notification-rules", label: "Notification Rules" },
  { href: "/settings/roles", label: "Roles & Permissions" },
  { href: "/settings/form-templates", label: "Form Templates" },
  { href: "/settings/integrations", label: "Integrations" },
] as const;

export default function SettingsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = createStyles(colors, typography);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const profile = useAuthStore((state) => state.profile);
  const authStatus = useAuthStore((state) => state.status);
  const biometricLockEnabled = useUIStore((state) => state.biometricLockEnabled);
  const biometricTimeoutSeconds = useUIStore(
    (state) => state.biometricTimeoutSeconds
  );
  const colorSchemePreference = useUIStore(
    (state) => state.colorSchemePreference
  );
  const sensoryEnabled = useUIStore((state) => state.sensoryEnabled);
  const resetPreferences = useUIStore((state) => state.resetPreferences);
  const setBiometricLockEnabled = useUIStore(
    (state) => state.setBiometricLockEnabled
  );
  const setBiometricTimeoutSeconds = useUIStore(
    (state) => state.setBiometricTimeoutSeconds
  );
  const setColorSchemePreference = useUIStore(
    (state) => state.setColorSchemePreference
  );
  const setSensoryEnabled = useUIStore((state) => state.setSensoryEnabled);
  const draftCount = useDraftStore((state) => Object.keys(state.drafts).length);
  const filterCount = useFilterStore((state) => Object.keys(state.filters).length);
  const recentSearchCount = useRecentSearchStore((state) =>
    Object.values(state.entriesByScope).reduce(
      (total, entries) => total + entries.length,
      0
    )
  );
  const dismissedCoachMarkCount = useCoachMarkStore(
    (state) => Object.keys(state.dismissedAt).length
  );
  const clearAllDrafts = useDraftStore((state) => state.clearAllDrafts);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const clearRecentSearches = useRecentSearchStore(
    (state) => state.clearRecentSearches
  );
  const resetCoachMarks = useCoachMarkStore((state) => state.reset);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const clearDeadLetters = useOfflineStore((state) => state.clearDeadLetters);
  const removeOfflineAction = useOfflineStore((state) => state.removeAction);
  const retryOfflineAction = useOfflineStore((state) => state.retryAction);
  const queryCache = useStorageHealthStore((state) => state.queryCache);
  const storageTier = useStorageHealthStore((state) => state.tier);
  const [clearing, setClearing] = useState<
    | null
    | "coach_marks"
    | "dead_letters"
    | "drafts"
    | "filters"
    | "prefs"
    | "recent_searches"
    | "sync"
  >(null);

  const selectedThemeLabel =
    colorSchemePreference.charAt(0).toUpperCase() +
    colorSchemePreference.slice(1);
  const selectedTimeoutLabel =
    timeoutOptions.find((option) => option.seconds === biometricTimeoutSeconds)
      ?.label ?? "5 Min";
  const pendingQueueCount = pendingActions.filter(
    (action) => action.syncState === "pending"
  ).length;
  const deadLetterCount = pendingActions.filter(
    (action) => action.syncState === "dead_letter"
  ).length;

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Reconnect before syncing queued actions.");
      return;
    }

    if (authStatus !== "signed_in" || !profile) {
      Alert.alert(
        "Unavailable",
        "A signed-in operator profile is required to sync."
      );
      return;
    }

    setClearing("sync");

    try {
      const result = await syncOfflineQueueNow(queryClient, {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      });

      showToast({
        message: `${result.processedCount} synced, ${result.deadLetterCount} moved to review.`,
        title: "Queue processed",
        tone: result.deadLetterCount > 0 ? "warning" : "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Queued actions could not be processed.",
        title: "Sync failed",
        tone: "error",
      });
    } finally {
      setClearing(null);
    }
  };

  return (
    <ScreenContainer
      subtitle="Preferences, device controls, and operational health."
      title="Settings"
    >
      <View style={styles.section}>
        <SectionHeader title="Admin hub" />
        <GroupedCard>
          {adminDestinations.map((destination, index) => (
            <View key={destination.href}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                label={destination.label}
                onPress={() => router.push(destination.href as never)}
                subtitle="Open setup and access controls."
              />
            </View>
          ))}
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Appearance & device" />
        <GroupedCard>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Theme preference</Text>
            <FilterChips
              onSelect={(value) =>
                setColorSchemePreference(value.toLowerCase() as ThemePreference)
              }
              options={themeOptions.map(
                (option) => option.charAt(0).toUpperCase() + option.slice(1)
              )}
              selected={selectedThemeLabel}
            />
          </View>

          <GroupedCardDivider />
          <SettingsListRow
            label="Sensory feedback"
            subtitle="Haptics on primary actions and confirmations."
            trailing={
              <GlassSwitch onToggle={setSensoryEnabled} value={sensoryEnabled} />
            }
          />

          <GroupedCardDivider />
          <SettingsListRow
            label="Biometric lock"
            subtitle="Require unlock again after the selected idle time."
            trailing={
              <GlassSwitch
                onToggle={setBiometricLockEnabled}
                value={biometricLockEnabled}
              />
            }
          />

          {biometricLockEnabled ? (
            <>
              <GroupedCardDivider />
              <View style={styles.block}>
                <Text style={styles.blockLabel}>Biometric timeout</Text>
                <FilterChips
                  onSelect={(value) => {
                    const match = timeoutOptions.find(
                      (option) => option.label === value
                    );
                    if (match) {
                      setBiometricTimeoutSeconds(match.seconds);
                    }
                  }}
                  options={timeoutOptions.map((option) => option.label)}
                  selected={selectedTimeoutLabel}
                />
              </View>
            </>
          ) : null}
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Diagnostics" />
        <GroupedCard>
          <SettingsListRow label="Network" value={isOnline ? "Online" : "Offline"} />
          <GroupedCardDivider />
          <SettingsListRow label="Storage tier" value={storageTier} />
          <GroupedCardDivider />
          <SettingsListRow
            label="Query cache"
            value={
              queryCache.available
                ? queryCache.encrypted
                  ? `Encrypted (${queryCache.cipherVersion ?? "cipher"})`
                  : queryCache.backend
                : queryCache.reason ?? "Disabled"
            }
          />
          <GroupedCardDivider />
          <SettingsListRow label="Saved drafts" value={String(draftCount)} />
          <GroupedCardDivider />
          <SettingsListRow label="Saved filters" value={String(filterCount)} />
          <GroupedCardDivider />
          <SettingsListRow
            label="Recent searches"
            value={String(recentSearchCount)}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Dismissed coach marks"
            value={String(dismissedCoachMarkCount)}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Offline queue"
            value={`${pendingQueueCount} pending · ${deadLetterCount} review`}
          />
        </GroupedCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Offline queue" />
        <GroupedCard>
          <SettingsListRow
            label="Queue health"
            subtitle="Pending actions replay on reconnect. Failed items stay visible until reviewed."
            value={`${pendingQueueCount} / ${deadLetterCount}`}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Open Sync Center"
            onPress={() => router.push("/sync-center")}
            subtitle="Review everything queued on this device."
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Sync now"
            onPress={() => {
              void handleSyncNow();
            }}
            subtitle="Replay queued actions immediately."
            value={clearing === "sync" ? "Working…" : undefined}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Clear failed"
            onPress={() => {
              setClearing("dead_letters");
              clearDeadLetters();
              setClearing(null);
              showToast({
                message: "Dead-letter queue entries were removed.",
                title: "Failed actions cleared",
                tone: "success",
              });
            }}
            subtitle="Remove items that need manual review."
            value={deadLetterCount ? `${deadLetterCount}` : "0"}
          />
        </GroupedCard>

        {pendingActions.length ? (
          <View style={styles.queueList}>
            {pendingActions.map((action) => (
              <MaterialSurface
                key={action.id}
                style={styles.queueCard}
                variant="panel"
              >
                <Text style={styles.queueTitle}>{getOfflineActionTitle(action)}</Text>
                <Text style={styles.queueMeta}>
                  {getOfflineActionDescription(action)}
                </Text>
                <Text style={styles.queueMeta}>
                  {action.syncState === "pending" ? "Pending sync" : "Needs review"} ·{" "}
                  {formatRelativeTimestamp(action.createdAt)} · Attempts{" "}
                  {action.attempts}/3
                </Text>
                {action.error ? (
                  <Text style={styles.queueError}>{action.error}</Text>
                ) : null}
                <View style={styles.queueActions}>
                  {action.syncState === "dead_letter" ? (
                    <Button
                      label="Retry"
                      onPress={() => {
                        retryOfflineAction(action.id);
                      }}
                      style={styles.queueButton}
                      variant="secondary"
                    />
                  ) : null}
                  <Button
                    label={action.syncState === "dead_letter" ? "Discard" : "Remove"}
                    onPress={() => {
                      removeOfflineAction(action.id);
                    }}
                    style={styles.queueButton}
                    variant="plain"
                  />
                </View>
              </MaterialSurface>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Maintenance" />
        <GroupedCard>
          <SettingsListRow
            label="Clear drafts"
            onPress={() => {
              setClearing("drafts");
              clearAllDrafts();
              setClearing(null);
              showToast({
                message: "Saved mobile drafts were removed.",
                title: "Drafts cleared",
                tone: "success",
              });
            }}
            subtitle="Remove all locally saved incident and log drafts."
            value={clearing === "drafts" ? "Working…" : `${draftCount}`}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Clear filters"
            onPress={() => {
              setClearing("filters");
              clearAllFilters();
              setClearing(null);
              showToast({
                message: "Remembered list filters were removed.",
                title: "Filters cleared",
                tone: "success",
              });
            }}
            subtitle="Reset saved list states across modules."
            value={clearing === "filters" ? "Working…" : `${filterCount}`}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Clear recent searches"
            onPress={() => {
              setClearing("recent_searches");
              clearRecentSearches();
              setClearing(null);
              showToast({
                message: "Saved dashboard search terms were removed.",
                title: "Recent searches cleared",
                tone: "success",
              });
            }}
            subtitle="Remove device-level search history."
            value={
              clearing === "recent_searches" ? "Working…" : `${recentSearchCount}`
            }
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Reset coach marks"
            onPress={() => {
              setClearing("coach_marks");
              resetCoachMarks();
              setClearing(null);
              showToast({
                message: "One-time operational hints will be shown again.",
                title: "Coach marks reset",
                tone: "success",
              });
            }}
            subtitle="Show first-run guidance again."
            value={
              clearing === "coach_marks"
                ? "Working…"
                : `${dismissedCoachMarkCount}`
            }
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Reset preferences"
            onPress={() => {
              setClearing("prefs");
              resetPreferences();
              setClearing(null);
              showToast({
                message: "Theme and device preferences were reset.",
                title: "Preferences reset",
                tone: "success",
              });
            }}
            subtitle="Restore display and device behavior defaults."
            value={clearing === "prefs" ? "Working…" : undefined}
          />
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    block: {
      gap: 12,
      padding: 16,
    },
    blockLabel: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    queueActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 2,
    },
    queueButton: {
      minHeight: 40,
    },
    queueCard: {
      gap: 10,
    },
    queueError: {
      ...typography.footnote,
      color: colors.error,
      fontWeight: "600",
    },
    queueList: {
      gap: 12,
      marginTop: 12,
    },
    queueMeta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    queueTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    section: {
      gap: 8,
    },
  });
}
