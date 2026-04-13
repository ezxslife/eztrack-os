import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function IncidentStatsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, layout, typography);

  // Mock data
  const stats = {
    totalIncidents: 127,
    avgResponseTime: "4m 23s",
    resolutionRate: 87.5,
    activeCount: 12,
  };

  const severityBreakdown = [
    { severity: "Critical", count: 8, percentage: 6.3 },
    { severity: "High", count: 24, percentage: 18.9 },
    { severity: "Medium", count: 61, percentage: 48.0 },
    { severity: "Low", count: 34, percentage: 26.8 },
  ];

  const typeDistribution = [
    { type: "Traffic Collision", count: 38, percentage: 29.9 },
    { type: "Welfare Check", count: 31, percentage: 24.4 },
    { type: "Disturbance", count: 28, percentage: 22.0 },
    { type: "Property Crime", count: 18, percentage: 14.2 },
    { type: "Other", count: 12, percentage: 9.5 },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Incident Statistics",
        }}
      />
      <ScreenContainer nativeHeader>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <MaterialSurface variant="chrome" style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Incidents</Text>
            <Text style={styles.kpiValue}>{stats.totalIncidents}</Text>
            <Text style={styles.kpiMeta}>This month</Text>
          </MaterialSurface>
          <MaterialSurface variant="chrome" style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Avg Response</Text>
            <Text style={styles.kpiValue}>{stats.avgResponseTime}</Text>
            <Text style={styles.kpiMeta}>30-day average</Text>
          </MaterialSurface>
          <MaterialSurface variant="chrome" style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Resolution Rate</Text>
            <Text style={styles.kpiValue}>{stats.resolutionRate}%</Text>
            <Text style={styles.kpiMeta}>Closed incidents</Text>
          </MaterialSurface>
          <MaterialSurface variant="chrome" style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Active Now</Text>
            <Text style={styles.kpiValue}>{stats.activeCount}</Text>
            <Text style={styles.kpiMeta}>Open incidents</Text>
          </MaterialSurface>
        </View>

        {/* Severity Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Breakdown</Text>
          <View style={styles.chartContainer}>
            {severityBreakdown.map((item) => (
              <View key={item.severity} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{item.severity}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: getSeverityColor(item.severity, colors),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartValue}>
                  {item.count} ({item.percentage.toFixed(1)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Type Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Types</Text>
          <View style={styles.typeList}>
            {typeDistribution.map((item) => (
              <View key={item.type} style={styles.typeItem}>
                <View style={styles.typeHeader}>
                  <Text style={styles.typeLabel}>{item.type}</Text>
                  <Text style={styles.typeCount}>{item.count}</Text>
                </View>
                <View style={styles.percentBar}>
                  <View
                    style={[
                      styles.percentFill,
                      { width: `${item.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.typePercent}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Time of Day Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time of Day Distribution</Text>
          <View style={styles.timeBarContainer}>
            {[
              { hour: "12am", count: 3 },
              { hour: "3am", count: 2 },
              { hour: "6am", count: 5 },
              { hour: "9am", count: 14 },
              { hour: "12pm", count: 18 },
              { hour: "3pm", count: 22 },
              { hour: "6pm", count: 28 },
              { hour: "9pm", count: 35 },
            ].map((item) => (
              <View key={item.hour} style={styles.timeBar}>
                <View
                  style={[
                    styles.timeFill,
                    { height: `${(item.count / 35) * 100}%` },
                  ]}
                />
                <Text style={styles.timeLabel}>{item.hour}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScreenContainer>
    </>
  );
}

function getSeverityColor(
  severity: string,
  colors: ReturnType<typeof useThemeColors>
): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "#FF3B30";
    case "high":
      return "#FF9500";
    case "medium":
      return "#FFCC00";
    case "low":
      return "#34C759";
    default:
      return colors.primary;
  }
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
      marginBottom: layout.gridGap,
    },
    kpiCard: {
      flex: 1,
      minWidth: layout.isRegularWidth ? "48%" : "100%",
      gap: 6,
    },
    kpiLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    kpiValue: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    kpiMeta: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    section: {
      gap: 12,
      marginBottom: layout.gridGap,
    },
    sectionTitle: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    chartContainer: {
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    chartRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    chartLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      width: 60,
    },
    barContainer: {
      flex: 1,
      height: 20,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 4,
      overflow: "hidden",
    },
    bar: {
      height: "100%",
      borderRadius: 4,
    },
    chartValue: {
      ...typography.caption1,
      color: colors.textTertiary,
      width: 70,
      textAlign: "right",
    },
    typeList: {
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    typeItem: {
      gap: 6,
    },
    typeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    typeLabel: {
      ...typography.subheadline,
      color: colors.textPrimary,
      flex: 1,
    },
    typeCount: {
      ...typography.footnote,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    percentBar: {
      height: 6,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 3,
      overflow: "hidden",
    },
    percentFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    typePercent: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    timeBarContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-around",
      gap: 4,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      height: 200,
    },
    timeBar: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      justifyContent: "flex-end",
    },
    timeFill: {
      width: "80%",
      backgroundColor: colors.primary,
      borderRadius: 4,
      minHeight: 4,
    },
    timeLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontSize: 10,
    },
  });
}
