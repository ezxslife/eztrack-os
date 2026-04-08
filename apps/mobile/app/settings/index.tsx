import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useQueryClient } from "@tanstack/react-query";

import type { ThemePreference } from "@/theme/colors";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
import { GlassSwitch } from "@/components/ui/glass/GlassSwitch";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  getOfflineActionDescription,
  getOfflineActionTitle,
  processPendingActions,
} from "@/lib/offline/queue";
import { useAuthStore } from "@/stores/auth-store";
import { useDraftStore } from "@/stores/draft-store";
import { useFilterStore } from "@/stores/filter-store";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useStorageHealthStore } from "@/stores/storage-health-store";
import { useUIStore } from "@/stores/ui-store";
import { useThemeColors } from "@/theme";

const themeOptions: ThemePreference[] = [
  "system",
  "light",
  "dark",
];

const timeoutOptions = [
  { label: "Immediate", seconds: 0 },
  { label: "1 Min", seconds: 60 },
  { label: "5 Min", seconds: 300 },
  { label: "15 Min", seconds: 900 },
];

export default function SettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const queryClient = useQueryClient();
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
  const draftCount = useDraftStore(
    (state) => Object.keys(state.drafts).length
  );
  const filterCount = useFilterStore(
    (state) => Object.keys(state.filters).length
  );
  const clearAllDrafts = useDraftStore((state) => state.clearAllDrafts);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const clearDeadLetters = useOfflineStore((state) => state.clearDeadLetters);
  const removeOfflineAction = useOfflineStore((state) => state.removeAction);
  const retryOfflineAction = useOfflineStore((state) => state.retryAction);
  const queryCache = useStorageHealthStore((state) => state.queryCache);
  const storageTier = useStorageHealthStore((state) => state.tier);
  const [clearing, setClearing] = useState<
    null | "dead_letters" | "drafts" | "filters" | "prefs" | "sync"
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
      Alert.alert("Unavailable", "A signed-in operator profile is required to sync.");
      return;
    }

    setClearing("sync");

    try {
      const result = await processPendingActions({
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      });

      if (result.processedCount > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["dispatches"] }),
          queryClient.invalidateQueries({ queryKey: ["daily-logs"] }),
          queryClient.invalidateQueries({ queryKey: ["incidents"] }),
        ]);
      }

      Alert.alert(
        "Queue processed",
        `${result.processedCount} synced, ${result.failedCount} failed, ${result.deadLetterCount} moved to review.`
      );
    } catch (error) {
      Alert.alert(
        "Sync failed",
        error instanceof Error ? error.message : "Queued actions could not be processed."
      );
    } finally {
      setClearing(null);
    }
  };

  return (
    <ScreenContainer
      subtitle="Preferences, persistence health, and maintenance actions for the current device."
      title="Settings"
    >
      <SectionCard subtitle="Persisted in the preferences tier." title="Appearance">
        <View style={styles.list}>
          <View style={styles.block}>
            <Text style={styles.label}>Theme preference</Text>
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

          <SettingRow
            label="Sensory feedback"
            meta="Controls haptics on primary actions."
            control={
              <GlassSwitch
                onToggle={setSensoryEnabled}
                value={sensoryEnabled}
              />
            }
          />

          <SettingRow
            label="Biometric lock"
            meta="Preference is stored now; auth enforcement lands in the advanced tranche."
            control={
              <GlassSwitch
                onToggle={setBiometricLockEnabled}
                value={biometricLockEnabled}
              />
            }
          />

          {biometricLockEnabled ? (
            <View style={styles.block}>
              <Text style={styles.label}>Biometric timeout</Text>
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
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title="Diagnostics">
        <View style={styles.list}>
          <DiagnosticRow label="Network" value={isOnline ? "online" : "offline"} />
          <DiagnosticRow label="Storage tier" value={storageTier} />
          <DiagnosticRow
            label="Query cache"
            value={
              queryCache.available
                ? queryCache.encrypted
                  ? `encrypted (${queryCache.cipherVersion ?? "cipher"})`
                  : queryCache.backend
                : queryCache.reason ?? "disabled"
            }
          />
          <DiagnosticRow label="Saved drafts" value={String(draftCount)} />
          <DiagnosticRow label="Saved filters" value={String(filterCount)} />
          <DiagnosticRow
            label="Queued offline actions"
            value={`${pendingQueueCount} pending / ${deadLetterCount} needs review`}
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle="Pending actions replay automatically on reconnect. Dead letters stay visible until reviewed."
        title="Offline queue"
      >
        <View style={styles.list}>
          <View style={styles.actions}>
            <Button
              label="Sync Now"
              loading={clearing === "sync"}
              onPress={() => {
                void handleSyncNow();
              }}
              variant="secondary"
            />
            <Button
              label="Clear Failed"
              loading={clearing === "dead_letters"}
              onPress={() => {
                setClearing("dead_letters");
                clearDeadLetters();
                setClearing(null);
                Alert.alert(
                  "Failed actions cleared",
                  "Dead-letter queue entries were removed."
                );
              }}
              variant="secondary"
            />
          </View>

          {pendingActions.length ? (
            pendingActions.map((action) => (
              <View key={action.id} style={styles.queueRow}>
                <Text style={styles.queueTitle}>{getOfflineActionTitle(action)}</Text>
                <Text style={styles.queueMeta}>{getOfflineActionDescription(action)}</Text>
                <Text style={styles.queueMeta}>
                  {action.syncState === "pending" ? "Pending sync" : "Needs review"} ·{" "}
                  {formatRelativeTimestamp(action.createdAt)} · Attempts {action.attempts}/3
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
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No queued actions on this device.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Maintenance">
        <View style={styles.actions}>
          <Button
            label="Clear Drafts"
            loading={clearing === "drafts"}
            onPress={() => {
              setClearing("drafts");
              clearAllDrafts();
              setClearing(null);
              Alert.alert("Drafts cleared", "Saved mobile drafts were removed.");
            }}
            variant="secondary"
          />
          <Button
            label="Clear Filters"
            loading={clearing === "filters"}
            onPress={() => {
              setClearing("filters");
              clearAllFilters();
              setClearing(null);
              Alert.alert("Filters cleared", "Remembered list filters were removed.");
            }}
            variant="secondary"
          />
          <Button
            label="Reset Preferences"
            loading={clearing === "prefs"}
            onPress={() => {
              setClearing("prefs");
              resetPreferences();
              setClearing(null);
              Alert.alert("Preferences reset", "Theme and device preferences were reset.");
            }}
            variant="secondary"
          />
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function SettingRow({
  control,
  label,
  meta,
}: {
  control: React.ReactNode;
  label: string;
  meta: string;
}) {
  const colors = useThemeColors();
  const styles = StyleSheet.create({
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    row: {
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 14,
    },
    rowCopy: {
      flex: 1,
      paddingRight: 16,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });

  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      {control}
    </View>
  );
}

function DiagnosticRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  const styles = StyleSheet.create({
    label: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      padding: 14,
    },
    value: {
      color: colors.textTertiary,
      fontSize: 13,
    },
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: {
      gap: 12,
    },
    block: {
      gap: 10,
    },
    emptyCopy: {
      color: colors.textTertiary,
      fontSize: 14,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    list: {
      gap: 12,
    },
    queueActions: {
      flexDirection: "row",
      gap: 12,
    },
    queueButton: {
      minHeight: 36,
    },
    queueError: {
      color: colors.error,
      fontSize: 12,
      lineHeight: 18,
    },
    queueMeta: {
      color: colors.textTertiary,
      fontSize: 13,
      lineHeight: 18,
    },
    queueRow: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: 14,
    },
    queueTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
