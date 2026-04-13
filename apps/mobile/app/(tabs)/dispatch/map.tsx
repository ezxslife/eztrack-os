import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function DispatchMapScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  // TODO: Replace with real dispatches hook
  // const dispatchesQuery = useDispatches();

  // Mock data
  const [showBottomSheet] = useState(true);
  const mockDispatches = [
    {
      id: "1",
      type: "Security Patrol",
      location: "North Tower - 3rd Floor",
      status: "on-scene",
      priority: "normal",
      assignedTo: "Martinez, A.",
      createdAt: "2026-04-11T14:30:00Z",
    },
    {
      id: "2",
      type: "Alarm Response",
      location: "East Wing - Entrance",
      status: "in-progress",
      priority: "high",
      assignedTo: "Chen, L.",
      createdAt: "2026-04-11T13:45:00Z",
    },
    {
      id: "3",
      type: "Wellness Check",
      location: "Main Lobby",
      status: "pending",
      priority: "normal",
      assignedTo: "Unassigned",
      createdAt: "2026-04-11T13:00:00Z",
    },
  ];

  const handleCenterOnLocation = () => {
    // TODO: Implement location centering
    Alert.alert("Centering", "Map centered on your current location");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-scene":
        return colors.success;
      case "in-progress":
        return colors.warning;
      case "pending":
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Dispatch Map" }} />
      <ScreenContainer
        gutter="none"
        nativeHeader
      >
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>🗺️ Map View</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Interactive dispatch map coming soon
            </Text>
          </View>

          {/* Center on Location Floating Button */}
          <View style={styles.floatingButtonContainer}>
            <MaterialSurface
              style={styles.floatingButton}
              onPress={handleCenterOnLocation}
            >
              <Text style={styles.floatingButtonText}>📍</Text>
            </MaterialSurface>
          </View>
        </View>

        {/* Active Dispatches Bottom Sheet */}
        {showBottomSheet && (
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetContent}>
              <Text style={styles.bottomSheetTitle}>Active Dispatches</Text>

              <GroupedCard>
                {mockDispatches.map((dispatch, index) => (
                  <View key={dispatch.id}>
                    {index > 0 ? <GroupedCardDivider /> : null}
                    <View style={styles.dispatchCard}>
                      <View style={styles.dispatchHeader}>
                        <View style={styles.dispatchHeaderLeft}>
                          <Text style={styles.dispatchType}>
                            {dispatch.type}
                          </Text>
                          <StatusBadge
                            status={
                              dispatch.status === "on-scene"
                                ? "success"
                                : dispatch.status === "in-progress"
                                  ? "warning"
                                  : "info"
                            }
                            label={dispatch.status.replace("-", " ")}
                          />
                        </View>
                        <Text style={styles.dispatchPriority}>
                          {dispatch.priority}
                        </Text>
                      </View>

                      <Text style={styles.dispatchLocation}>
                        📍 {dispatch.location}
                      </Text>

                      <View style={styles.dispatchMeta}>
                        <Text style={styles.dispatchMetaText}>
                          {dispatch.assignedTo}
                        </Text>
                        <Text style={styles.dispatchMetaText}>
                          {formatRelativeTimestamp(dispatch.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </GroupedCard>

              <GlassButton
                label="View All Dispatches"
                onPress={() => {
                  // TODO: Navigate to full dispatch list
                }}
                style={styles.viewAllButton}
              />
            </View>
          </View>
        )}
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
    bottomSheet: {
      backgroundColor: colors.surfacePrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderLight,
      flex: 0.4,
      minHeight: 200,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    bottomSheetContent: {
      gap: 16,
      paddingBottom: layout.verticalPadding,
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: 16,
    },
    bottomSheetHandle: {
      alignSelf: "center",
      backgroundColor: colors.borderLight,
      borderRadius: 2,
      height: 4,
      marginTop: 8,
      width: 32,
    },
    bottomSheetTitle: {
      ...typography.title3,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    dispatchCard: {
      gap: 8,
      paddingVertical: 12,
    },
    dispatchHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dispatchHeaderLeft: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: 8,
    },
    dispatchLocation: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    dispatchMeta: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    dispatchMetaText: {
      ...typography.caption2,
      color: colors.textTertiary,
    },
    dispatchPriority: {
      ...typography.caption1,
      color: colors.warning,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    dispatchType: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    floatingButton: {
      alignItems: "center",
      borderRadius: 50,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    floatingButtonContainer: {
      bottom: 20,
      position: "absolute",
      right: 20,
    },
    floatingButtonText: {
      fontSize: 24,
    },
    mapContainer: {
      flex: 0.6,
      position: "relative",
    },
    mapPlaceholder: {
      alignItems: "center",
      backgroundColor: colors.surfaceTintSubtle,
      flex: 1,
      justifyContent: "center",
    },
    mapPlaceholderSubtext: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 8,
    },
    mapPlaceholderText: {
      ...typography.title2,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    viewAllButton: {
      marginTop: 8,
    },
  });
}
