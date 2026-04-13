import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

type MetricComparison = {
  label: string;
  periodA: number | string;
  periodB: number | string;
  unit?: string;
};

export default function ComparisonScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const [periodA, setPeriodA] = useState("April 1-7");
  const [periodB, setPeriodB] = useState("April 8-14");
  const styles = createStyles(colors, layout, typography);

  // Mock comparison data
  const metrics: MetricComparison[] = [
    { label: "Incidents", periodA: 54, periodB: 62, unit: "" },
    { label: "Response Time", periodA: "5m 12s", periodB: "4m 38s" },
    { label: "Resolution Rate", periodA: 84, periodB: 89, unit: "%" },
    { label: "Dispatches", periodA: 89, periodB: 103, unit: "" },
  ];

  const getDeltaIndicator = (a: number | string, b: number | string) => {
    if (typeof a === "string" || typeof b === "string") return null;

    const delta = (b as number) - (a as number);
    if (delta > 0) {
      return { icon: "arrow.up.right", color: "#34C759", value: `+${delta}` };
    } else if (delta < 0) {
      return { icon: "arrow.down.right", color: "#FF3B30", value: `${delta}` };
    }
    return null;
  };

  const handlePeriodPress = (period: "a" | "b") => {
    triggerImpactHaptic();
    Alert.alert(`Select ${period === "a" ? "Period A" : "Period B"} Date Range`, "", [
      { text: "This Week", onPress: () => {} },
      { text: "This Month", onPress: () => {} },
      { text: "Last Month", onPress: () => {} },
      { text: "Custom Range", onPress: () => {} },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Period Comparison",
        }}
      />
      <ScreenContainer nativeHeader>
        {/* Period Selectors */}
        <View style={styles.periodRow}>
          <Pressable
            style={styles.periodSelector}
            onPress={() => handlePeriodPress("a")}
          >
            <Text style={styles.periodLabel}>Period A</Text>
            <View style={styles.periodValue}>
              <Text style={styles.periodDate}>{periodA}</Text>
              <AppSymbol
                iosName="calendar"
                fallbackName="calendar"
                size={16}
                color={colors.primary}
              />
            </View>
          </Pressable>

          <View style={styles.periodDivider} />

          <Pressable
            style={styles.periodSelector}
            onPress={() => handlePeriodPress("b")}
          >
            <Text style={styles.periodLabel}>Period B</Text>
            <View style={styles.periodValue}>
              <Text style={styles.periodDate}>{periodB}</Text>
              <AppSymbol
                iosName="calendar"
                fallbackName="calendar"
                size={16}
                color={colors.primary}
              />
            </View>
          </Pressable>
        </View>

        {/* Comparison Metrics */}
        <View style={styles.metricsContainer}>
          {metrics.map((metric, index) => {
            const delta = getDeltaIndicator(metric.periodA, metric.periodB);
            return (
              <View key={index} style={styles.metricCard}>
                <MaterialSurface variant="chrome" style={styles.metricContent}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    {delta && (
                      <View style={styles.deltaIndicator}>
                        <AppSymbol
                          iosName={delta.icon as any}
                          fallbackName="arrow-forward"
                          size={16}
                          color={delta.color}
                        />
                        <Text style={[styles.deltaValue, { color: delta.color }]}>
                          {delta.value}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Two Column Comparison */}
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonColumn}>
                      <Text style={styles.comparisonLabel}>Period A</Text>
                      <Text style={styles.comparisonValue}>
                        {metric.periodA}
                        {metric.unit && (
                          <Text style={styles.comparisonUnit}>{metric.unit}</Text>
                        )}
                      </Text>
                    </View>

                    <View style={styles.comparisonDivider} />

                    <View style={styles.comparisonColumn}>
                      <Text style={styles.comparisonLabel}>Period B</Text>
                      <Text style={styles.comparisonValue}>
                        {metric.periodB}
                        {metric.unit && (
                          <Text style={styles.comparisonUnit}>{metric.unit}</Text>
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar Comparison */}
                  <View style={styles.barComparison}>
                    <View
                      style={[
                        styles.comparisonBar,
                        {
                          flex:
                            typeof metric.periodA === "number"
                              ? metric.periodA
                              : 50,
                        },
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <View style={styles.barSpacer} />
                    <View
                      style={[
                        styles.comparisonBar,
                        {
                          flex:
                            typeof metric.periodB === "number"
                              ? metric.periodB
                              : 50,
                        },
                        {
                          backgroundColor:
                            typeof metric.periodB === "number" &&
                            typeof metric.periodA === "number" &&
                            metric.periodB > metric.periodA
                              ? "#34C759"
                              : "#FF3B30",
                        },
                      ]}
                    />
                  </View>
                </MaterialSurface>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <MaterialSurface variant="chrome" style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <View
                style={[styles.summaryIndicator, { backgroundColor: "#34C759" }]}
              />
              <Text style={styles.summaryText}>2 metrics improved</Text>
            </View>
            <View style={styles.summaryItem}>
              <View
                style={[styles.summaryIndicator, { backgroundColor: "#FF3B30" }]}
              />
              <Text style={styles.summaryText}>2 metrics declined</Text>
            </View>
          </View>
        </MaterialSurface>
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    periodRow: {
      flexDirection: "row",
      gap: layout.gridGap,
      marginBottom: layout.gridGap,
    },
    periodSelector: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: layout.listItemPadding,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      gap: 4,
    },
    periodLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: "600",
    },
    periodValue: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    periodDate: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
      flex: 1,
    },
    periodDivider: {
      width: 2,
      backgroundColor: colors.border,
    },
    metricsContainer: {
      gap: layout.gridGap,
      marginBottom: layout.gridGap,
    },
    metricCard: {
      overflow: "hidden",
    },
    metricContent: {
      gap: 12,
    },
    metricHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    metricLabel: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    deltaIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 6,
    },
    deltaValue: {
      ...typography.caption1,
      fontWeight: "700",
    },
    comparisonRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    comparisonColumn: {
      flex: 1,
      gap: 4,
      paddingVertical: 8,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      paddingHorizontal: layout.cardPadding,
    },
    comparisonLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: "600",
    },
    comparisonValue: {
      ...typography.title2,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    comparisonUnit: {
      ...typography.subheadline,
      fontSize: 14,
      fontWeight: "400",
    },
    comparisonDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    barComparison: {
      flexDirection: "row",
      alignItems: "center",
      height: 6,
      gap: 4,
      borderRadius: 3,
      overflow: "hidden",
    },
    comparisonBar: {
      height: "100%",
      borderRadius: 3,
      minWidth: 4,
    },
    barSpacer: {
      width: 8,
    },
    summaryCard: {
      gap: 12,
    },
    summaryTitle: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    summaryContent: {
      gap: 10,
    },
    summaryItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    summaryIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    summaryText: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
  });
}
