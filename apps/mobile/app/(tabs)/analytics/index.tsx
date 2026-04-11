import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import {
  useDispatchResponseTimes,
  useIncidentsByStatus,
  useIncidentsByType,
  useIncidentsOverTime,
  useModuleActivityCounts,
  usePatronFlagDistribution,
} from "@/lib/queries/analytics";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, layout, typography);
  const byStatusQuery = useIncidentsByStatus();
  const byTypeQuery = useIncidentsByType();
  const overTimeQuery = useIncidentsOverTime();
  const responseQuery = useDispatchResponseTimes();
  const flagsQuery = usePatronFlagDistribution();
  const moduleCountsQuery = useModuleActivityCounts();
  const response = responseQuery.data;

  const breakdownRows = [
    ...(byTypeQuery.data ?? []).slice(0, 5).map((item) => ({
      label: item.label,
      subtitle: `${item.count} incidents`,
    })),
    ...(flagsQuery.data ?? []).slice(0, 5).map((item) => ({
      label: `Patron · ${item.label}`,
      subtitle: `${item.count} patrons`,
    })),
    ...(moduleCountsQuery.data ?? []).map((item) => ({
      label: item.label,
      subtitle: `${item.count} records in the last 30 days`,
    })),
    ...(overTimeQuery.data ?? []).slice(-7).map((item) => ({
      label: item.date,
      subtitle: `${item.count} incidents`,
    })),
  ];

  return (
    <ScreenContainer
      gutter="none"
      onRefresh={() => {
        void Promise.all([
          byStatusQuery.refetch(),
          byTypeQuery.refetch(),
          overTimeQuery.refetch(),
          responseQuery.refetch(),
          flagsQuery.refetch(),
          moduleCountsQuery.refetch(),
        ]);
      }}
      refreshing={
        byStatusQuery.isRefetching ||
        byTypeQuery.isRefetching ||
        overTimeQuery.isRefetching ||
        responseQuery.isRefetching ||
        flagsQuery.isRefetching ||
        moduleCountsQuery.isRefetching
      }
      subtitle="Response times, incident volume, and activity trends."
      title="Analytics"
    >
      <View style={styles.section}>
        <SectionHeader title="Current KPIs" />
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg response</Text>
            <Text style={styles.statValue}>{response?.avgMinutes ?? 0}m</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Median response</Text>
            <Text style={styles.statValue}>{response?.medianMinutes ?? 0}m</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Status buckets</Text>
            <Text style={styles.statValue}>{byStatusQuery.data?.length ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active modules</Text>
            <Text style={styles.statValue}>
              {moduleCountsQuery.data?.length ?? 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Incident status" />
        {(byStatusQuery.data ?? []).length ? (
          <GroupedCard>
            {(byStatusQuery.data ?? []).map((item, index) => (
              <View key={item.label}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={item.label}
                  subtitle={`${item.count} incidents`}
                />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>No incident status metrics yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Breakdowns" />
        {breakdownRows.length ? (
          <GroupedCard>
            {breakdownRows.map((item, index) => (
              <View key={`${item.label}-${index}`}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow label={item.label} subtitle={item.subtitle} />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>No breakdown data is available yet.</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    emptyState: {
      backgroundColor: colors.surfaceTintSubtle,
      borderColor: colors.borderLight,
      borderRadius: 18,
      borderWidth: 1,
      marginHorizontal: layout.horizontalPadding,
      padding: 16,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
      paddingHorizontal: layout.horizontalPadding,
    },
    section: {
      gap: 8,
    },
    statCard: {
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 20,
      borderWidth: 1,
      flexBasis: layout.isRegularWidth ? layout.minGridColumnWidth : "47%",
      flexGrow: 1,
      minWidth: layout.isRegularWidth ? layout.minGridColumnWidth : undefined,
      padding: layout.cardPadding,
    },
    statLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    statValue: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      marginTop: 10,
    },
  });
}
