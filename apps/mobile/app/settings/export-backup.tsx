import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  Alert,
  Pressable,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

interface BackupState {
  autoBackupEnabled: boolean;
  lastBackupDate: string | null;
  retentionDays: number;
}

export default function ExportBackupScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const [backupState, setBackupState] = useState<BackupState>({
    autoBackupEnabled: true,
    lastBackupDate: "2026-04-11 02:30 AM",
    retentionDays: 90,
  });

  const handleExportData = () => {
    triggerImpactHaptic();
    Alert.alert(
      "Export Data",
      "Export all organization data including incidents, dispatches, personnel, and more?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Export",
          onPress: () => {
            triggerImpactHaptic();
            Alert.alert(
              "Success",
              "Data exported successfully. File saved to Downloads."
            );
          },
        },
      ]
    );
  };

  const handleBackupNow = () => {
    triggerImpactHaptic();
    Alert.alert(
      "Backup Now",
      "Start a backup of all data now?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Backup",
          onPress: () => {
            triggerImpactHaptic();
            setBackupState((prev) => ({
              ...prev,
              lastBackupDate: new Date().toLocaleString(),
            }));
            Alert.alert("Success", "Backup completed successfully");
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    triggerImpactHaptic();
    Alert.alert(
      "Clear Local Cache",
      "This will remove all cached data but keep your account settings. Continue?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Clear Cache",
          onPress: () => {
            triggerImpactHaptic();
            Alert.alert("Success", "Local cache cleared");
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleResetApp = () => {
    triggerImpactHaptic();
    Alert.alert(
      "Reset App Data",
      "This will delete ALL local app data and reset the app to initial state. This cannot be undone!",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            triggerImpactHaptic();
            Alert.alert("Success", "App data reset. Please restart the app.");
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Export & Backup" }} />
      <ScreenContainer title="Export & Backup">

        {/* Export Data Section */}
        <View style={styles.section}>
          <SectionHeader title="Export Data" />
          <MaterialSurface variant="chrome" style={styles.card}>
            <Text style={styles.description}>
              Export all organization data including incidents, dispatches,
              personnel, vehicles, and reports to a file.
            </Text>
            <Button
              variant="primary"
              label="Export All Data"
              icon="download"
              onPress={handleExportData}
            />
          </MaterialSurface>
        </View>

        {/* Backup Section */}
        <View style={styles.section}>
          <SectionHeader title="Backup Settings" />
          <GroupedCard>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text style={styles.label}>Automatic Backup</Text>
                <Text style={styles.sublabel}>
                  Back up data daily at 2:30 AM
                </Text>
              </View>
              <Switch
                value={backupState.autoBackupEnabled}
                onValueChange={(value) => {
                  triggerImpactHaptic();
                  setBackupState((prev) => ({
                    ...prev,
                    autoBackupEnabled: value,
                  }));
                }}
              />
            </View>
            <GroupedCardDivider />
            <SettingsListRow
              label="Last Backup"
              subtitle={
                backupState.lastBackupDate || "No backup yet"
              }
            />
            <GroupedCardDivider />
            <SettingsListRow
              label="Data Retention"
              subtitle={`Data kept for ${backupState.retentionDays} days`}
            />
          </GroupedCard>

          <Button
            variant="primary"
            label="Backup Now"
            icon="refresh"
            onPress={handleBackupNow}
          />
        </View>

        {/* Data Retention Section */}
        <View style={styles.section}>
          <SectionHeader title="Data Retention" />
          <MaterialSurface variant="chrome" style={styles.card}>
            <View style={styles.infoBox}>
              <AppSymbol
                iosName="info.circle.fill"
                fallbackName="info"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                Your organization retains all data for {backupState.retentionDays} days.
                Older records are archived but accessible upon request.
              </Text>
            </View>
          </MaterialSurface>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <SectionHeader title="Danger Zone" />
          <MaterialSurface
            variant="chrome"
            style={[styles.card, styles.dangerCard]}
          >
            <View style={styles.dangerContent}>
              <Text style={styles.dangerDescription}>
                Clear all cached data from your device. Your account will remain
                intact.
              </Text>
              <Pressable
                onPress={handleClearCache}
                style={styles.dangerButton}
              >
                <AppSymbol
                  iosName="trash.fill"
                  fallbackName="trash-outline"
                  size={20}
                  color={colors.error}
                />
                <Text style={styles.dangerButtonText}>Clear Local Cache</Text>
              </Pressable>
            </View>
          </MaterialSurface>

          <MaterialSurface
            variant="chrome"
            style={[styles.card, styles.dangerCard]}
          >
            <View style={styles.dangerContent}>
              <Text style={styles.dangerDescription}>
                Reset the app to its initial state. This will delete all local
                data and sign you out.
              </Text>
              <Pressable
                onPress={handleResetApp}
                style={styles.dangerButton}
              >
                <AppSymbol
                  iosName="exclamationmark.triangle.fill"
                  fallbackName="alert-circle"
                  size={20}
                  color={colors.error}
                />
                <Text style={styles.dangerButtonText}>Reset App Data</Text>
              </Pressable>
            </View>
          </MaterialSurface>
        </View>
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    section: {
      gap: 8,
      marginBottom: 24,
      paddingHorizontal: layout.horizontalPadding,
    },
    card: {
      paddingHorizontal: layout.listItemPadding,
      paddingVertical: 16,
      gap: 12,
    },
    dangerCard: {
      borderWidth: 1,
      borderColor: colors.error,
      opacity: 0.95,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 4,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    settingLabel: {
      flex: 1,
      gap: 4,
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    sublabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    infoBox: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: layout.listItemPadding,
      paddingVertical: 12,
      backgroundColor: colors.surfaceTintMedium,
      borderRadius: 8,
    },
    infoText: {
      ...typography.body,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    dangerContent: {
      gap: 12,
    },
    dangerDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    dangerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: layout.listItemPadding,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: colors.surfaceTintMedium,
    },
    dangerButtonText: {
      ...typography.subheadline,
      color: colors.error,
      fontWeight: "600",
    },
  });
}
