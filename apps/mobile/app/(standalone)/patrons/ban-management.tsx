import { useLocalSearchParams, Stack } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View, ScrollView } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { formatShortDateTime } from "@/lib/format";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function PatronBanManagementScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const params = useLocalSearchParams<{ patronId?: string }>();
  const patronId = params.patronId || "";
  const styles = createStyles(colors, typography, layout);

  // TODO: Replace with real ban management hook
  // const banStatusQuery = useBanStatus(patronId);
  // const liftBanMutation = useLiftBanMutation();
  // const issueBanMutation = useIssueBanMutation();

  // Mock state
  const [hasActiveBan] = useState(true);
  const [showIssueBanForm, setShowIssueBanForm] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState("temporary");
  const [banEndDate, setBanEndDate] = useState("");

  const mockActiveBan = {
    reason: "Disruptive behavior and verbal altercation with staff",
    startDate: "2026-03-15",
    endDate: "2026-06-15",
    issuedBy: "Rodriguez, M.",
  };

  const mockBanHistory = [
    {
      id: "1",
      reason: "Trespassing after hours",
      startDate: "2025-08-20",
      endDate: "2025-09-20",
      liftedDate: "2025-09-15",
      issuedBy: "Chen, L.",
    },
    {
      id: "2",
      reason: "Damage to property",
      startDate: "2024-12-01",
      endDate: "2025-01-01",
      liftedDate: "2024-12-28",
      issuedBy: "Martinez, A.",
    },
  ];

  const handleLiftBan = () => {
    Alert.alert("Lift Ban", "Are you sure you want to lift this ban?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Lift Ban",
        onPress: () => {
          // TODO: Call liftBanMutation
          Alert.alert("Success", "Ban has been lifted.");
        },
      },
    ]);
  };

  const handleIssueBan = () => {
    if (!banReason.trim()) {
      Alert.alert("Required", "Please provide a reason for the ban.");
      return;
    }
    if (banType === "temporary" && !banEndDate) {
      Alert.alert("Required", "Please select an end date for the temporary ban.");
      return;
    }

    // TODO: Call issueBanMutation
    Alert.alert("Success", "Ban has been issued.");
    setBanReason("");
    setBanType("temporary");
    setBanEndDate("");
    setShowIssueBanForm(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Ban Management" }} />
      <ScreenContainer title="Ban Management">

        {/* Current Ban Status */}
        <View style={styles.section}>
          <SectionHeader title="Current Status" />
          {hasActiveBan ? (
            <>
              <MaterialSurface style={styles.statusCard}>
                <View style={styles.statusBadgeContainer}>
                  <StatusBadge status="error" label="Ban Active" />
                </View>
                <View style={styles.statusDetails}>
                  <Text style={styles.statusDetailLabel}>Reason</Text>
                  <Text style={styles.statusDetailValue}>
                    {mockActiveBan.reason}
                  </Text>

                  <View style={styles.dateRow}>
                    <View>
                      <Text style={styles.statusDetailLabel}>Start Date</Text>
                      <Text style={styles.statusDetailValue}>
                        {mockActiveBan.startDate}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.statusDetailLabel}>End Date</Text>
                      <Text style={styles.statusDetailValue}>
                        {mockActiveBan.endDate}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.statusDetailLabel}>Issued By</Text>
                  <Text style={styles.statusDetailValue}>
                    {mockActiveBan.issuedBy}
                  </Text>
                </View>
              </MaterialSurface>
              <Button
                label="Lift Ban"
                variant="secondary"
                onPress={handleLiftBan}
              />
            </>
          ) : (
            <MaterialSurface style={styles.statusCard}>
              <View style={styles.statusBadgeContainer}>
                <StatusBadge status="success" label="No Active Ban" />
              </View>
              <Text style={styles.noBanText}>This patron has no active bans.</Text>
            </MaterialSurface>
          )}
        </View>

        {/* Issue Ban Section */}
        {!hasActiveBan && (
          <View style={styles.section}>
            {!showIssueBanForm ? (
              <Button
                label="Issue New Ban"
                variant="secondary"
                onPress={() => setShowIssueBanForm(true)}
              />
            ) : (
              <>
                <SectionHeader title="Issue Ban" />
                <View style={styles.formSection}>
                  <TextField
                    label="Reason"
                    placeholder="Enter reason for ban..."
                    value={banReason}
                    onChangeText={setBanReason}
                    multiline
                    numberOfLines={4}
                  />

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Ban Type</Text>
                    <View style={styles.banTypeOptions}>
                      {["temporary", "permanent"].map((type) => (
                        <MaterialSurface
                          key={type}
                          style={[
                            styles.banTypeOption,
                            banType === type &&
                              styles.banTypeOptionSelected,
                          ]}
                          onPress={() => setBanType(type)}
                        >
                          <Text
                            style={[
                              styles.banTypeOptionText,
                              banType === type &&
                                styles.banTypeOptionTextSelected,
                            ]}
                          >
                            {type === "temporary"
                              ? "Temporary"
                              : "Permanent"}
                          </Text>
                        </MaterialSurface>
                      ))}
                    </View>
                  </View>

                  {banType === "temporary" && (
                    <TextField
                      label="End Date"
                      placeholder="YYYY-MM-DD"
                      value={banEndDate}
                      onChangeText={setBanEndDate}
                    />
                  )}

                  <View style={styles.formActions}>
                    <Button
                      label="Cancel"
                      variant="secondary"
                      onPress={() => {
                        setShowIssueBanForm(false);
                        setBanReason("");
                        setBanType("temporary");
                        setBanEndDate("");
                      }}
                    />
                    <Button
                      label="Issue Ban"
                      onPress={handleIssueBan}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Ban History */}
        <View style={styles.section}>
          <SectionHeader title="Ban History" />
          {mockBanHistory.length > 0 ? (
            <GroupedCard>
              {mockBanHistory.map((ban, index) => (
                <View key={ban.id}>
                  {index > 0 ? <GroupedCardDivider /> : null}
                  <View style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemReason}>{ban.reason}</Text>
                      {ban.liftedDate && (
                        <StatusBadge status="success" label="Lifted" />
                      )}
                    </View>
                    <Text style={styles.historyItemDate}>
                      {ban.startDate} to {ban.endDate}
                    </Text>
                    {ban.liftedDate && (
                      <Text style={styles.historyItemLiftedDate}>
                        Lifted: {ban.liftedDate}
                      </Text>
                    )}
                    <Text style={styles.historyItemIssuedBy}>
                      by {ban.issuedBy}
                    </Text>
                  </View>
                </View>
              ))}
            </GroupedCard>
          ) : (
            <Text style={styles.emptyText}>No ban history available.</Text>
          )}
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
    banTypeOption: {
      alignItems: "center",
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      paddingVertical: 12,
    },
    banTypeOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    banTypeOptionText: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    banTypeOptionTextSelected: {
      color: colors.surfacePrimary,
    },
    banTypeOptions: {
      flexDirection: "row",
      gap: 12,
    },
    dateRow: {
      flexDirection: "row",
      gap: 16,
      justifyContent: "space-between",
      marginTop: 12,
    },
    emptyText: {
      ...typography.body,
      color: colors.textTertiary,
      marginHorizontal: layout.horizontalPadding,
      textAlign: "center",
    },
    formActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
    },
    formGroup: {
      gap: 8,
      marginTop: 16,
    },
    formLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    formSection: {
      gap: 16,
      marginHorizontal: layout.horizontalPadding,
      paddingBottom: 24,
    },
    historyItem: {
      gap: 6,
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: 12,
    },
    historyItemDate: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    historyItemHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    historyItemIssuedBy: {
      ...typography.caption2,
      color: colors.textTertiary,
    },
    historyItemLiftedDate: {
      ...typography.caption1,
      color: colors.success,
    },
    historyItemReason: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
      fontWeight: "600",
    },
    noBanText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 12,
      textAlign: "center",
    },
    section: {
      gap: 12,
      marginBottom: 24,
    },
    statusBadgeContainer: {
      marginBottom: 16,
    },
    statusCard: {
      marginHorizontal: layout.horizontalPadding,
      padding: 16,
    },
    statusDetailLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "700",
      marginTop: 12,
    },
    statusDetailValue: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
      marginTop: 4,
    },
    statusDetails: {
      gap: 0,
    },
  });
}
