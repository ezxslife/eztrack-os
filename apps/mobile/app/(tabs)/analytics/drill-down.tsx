import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { GlassPill } from "@/components/ui/glass/GlassPill";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function AnalyticsDrillDownScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const params = useLocalSearchParams<{ metric?: string }>();
  const metricName = params.metric || "Metric Details";
  const styles = createStyles(colors, typography, layout);

  // TODO: Replace with real analytics hook when available
  // const analyticsQuery = useAnalyticsDrillDown(metricName);

  // Mock data
  const mockMetricValue = 847;
  const mockTrend = "+12%";
  const mockChartData = [
    { date: "Mon", value: 600 },
    { date: "Tue", value: 680 },
    { date: "Wed", value: 720 },
    { date: "Thu", value: 790 },
    { date: "Fri", value: 847 },
    { date: "Sat", value: 825 },
    { date: "Sun", value: 800 },
  ];

  const mockBreakdownRows = [
    { label: "Location · North Tower", subtitle: "342 occurrences" },
    { label: "Location · East Wing", subtitle: "298 occurrences" },
    { label: "Location · Main Lobby", subtitle: "207 occurrences" },
    { label: "Type · Security", subtitle: "521 occurrences" },
    { label: "Type · Maintenance", subtitle: "326 occurrences" },
    { label: "Officer · Martinez, A.", subtitle: "189 occurrences" },
    { label: "Officer · Chen, L.", subtitle: "167 occurrences" },
  ];

  const dateRangePresets = [
    { label: "7D", selected: true },
    { label: "30D", selected: false },
    { label: "90D", selected: false },
    { label: "1Y", selected: false },
  ];

  return (
    <>
      <Stack.Screen options={{ title: metricName }} />
      <ScreenContainer nativeHeader>

        {/* Date Range Selector */}
        <View style={styles.dateRangeSection}>
          <View style={styles.dateRangeChips}>
            {dateRangePresets.map((preset) => (
              <GlassPill
                key={preset.label}
                label={preset.label}
                selected={preset.selected}
                onPress={() => {}}
                size="sm"
              />
            ))}
          </View>
        </View>

        {/* KPI Card - Large Metric Display */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Current Value</Text>
          <Text style={styles.kpiValue}>{mockMetricValue}</Text>
          <Text style={styles.kpiTrend}>{mockTrend} vs previous period</Text>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <SectionHeader title="Trend" />
          <MaterialSurface style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Chart visualization</Text>
            <Text style={styles.chartPlaceholderSubtext}>
              7-day trend of metric values
            </Text>
          </MaterialSurface>
        </View>

        {/* Breakdown Section */}
        <View style={styles.breakdownSection}>
          <SectionHeader title="Breakdown by Dimension" />
          <View style={styles.breakdownList}>
            {mockBreakdownRows.map((row, index) => (
              <View key={`${row.label}-${index}`}>
                <SettingsListRow
                  label={row.label}
                  subtitle={row.subtitle}
                  onPress={() => {}}
                />
              </View>
            ))}
          </View>
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
    breakdownList: {
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: colors.surfaceFrosted,
      overflow: "hidden",
      marginHorizontal: layout.horizontalPadding,
    },
    breakdownSection: {
      gap: 8,
      paddingBottom: layout.verticalPadding,
    },
    chartPlaceholder: {
      alignItems: "center",
      height: 200,
      justifyContent: "center",
      marginHorizontal: layout.horizontalPadding,
    },
    chartPlaceholderSubtext: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 4,
    },
    chartPlaceholderText: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    chartSection: {
      gap: 8,
    },
    dateRangeChips: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
    },
    dateRangeSection: {
      gap: 8,
      marginBottom: 16,
    },
    kpiCard: {
      alignItems: "center",
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 16,
      borderWidth: 1,
      marginHorizontal: layout.horizontalPadding,
      marginBottom: 24,
      paddingVertical: 32,
    },
    kpiLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    kpiTrend: {
      ...typography.body,
      color: colors.success,
      marginTop: 8,
    },
    kpiValue: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      marginTop: 12,
    },
  });
}
