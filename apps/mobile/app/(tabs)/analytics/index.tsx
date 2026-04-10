import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
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

  return (
    <ScreenContainer
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
      subtitle="Real operational analytics from the existing web parity queries."
      title="Analytics"
    >
      <MaterialSurface intensity={80} style={styles.hero} variant="panel">
        <Text style={styles.eyebrow}>Performance Snapshot</Text>
        <Text style={styles.title}>Operational health at a glance</Text>
        <Text style={styles.copy}>
          This is the first mobile analytics slice: fast KPIs, short feeds, and
          enough context to triage a shift without leaving the app shell.
        </Text>
      </MaterialSurface>

      <SectionCard
        subtitle={
          responseQuery.isLoading
            ? "Loading performance metrics"
            : "Dispatch timing and incident volume"
        }
        title="Current KPIs"
      >
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Response</Text>
            <Text style={styles.statValue}>{response?.avgMinutes ?? 0}m</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Median Response</Text>
            <Text style={styles.statValue}>{response?.medianMinutes ?? 0}m</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Incident Statuses</Text>
            <Text style={styles.statValue}>{byStatusQuery.data?.length ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Modules</Text>
            <Text style={styles.statValue}>{moduleCountsQuery.data?.length ?? 0}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          byStatusQuery.isLoading
            ? "Loading incident status buckets"
            : `${(byStatusQuery.data ?? []).length} buckets`
        }
        title="Incident Status Distribution"
      >
        <View style={styles.list}>
          {(byStatusQuery.data ?? []).map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowMeta}>{item.count} incidents</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Breakdowns">
        <View style={styles.list}>
          {(byTypeQuery.data ?? []).slice(0, 5).map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowMeta}>{item.count} incidents</Text>
            </View>
          ))}
          {(flagsQuery.data ?? []).slice(0, 5).map((item) => (
            <View key={`flag-${item.label}`} style={styles.row}>
              <Text style={styles.rowTitle}>Patron: {item.label}</Text>
              <Text style={styles.rowMeta}>{item.count} patrons</Text>
            </View>
          ))}
          {(moduleCountsQuery.data ?? []).map((item) => (
            <View key={`module-${item.label}`} style={styles.row}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowMeta}>{item.count} records in last 30 days</Text>
            </View>
          ))}
          {(overTimeQuery.data ?? []).slice(-7).map((item) => (
            <View key={`day-${item.date}`} style={styles.row}>
              <Text style={styles.rowTitle}>{item.date}</Text>
              <Text style={styles.rowMeta}>{item.count} incidents</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    copy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    eyebrow: {
      ...typography.caption1,
      color: colors.accentSoft,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    hero: {
      gap: layout.gridGap,
    },
    list: {
      gap: layout.gridGap,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: layout.listItemPadding,
    },
    rowMeta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    rowTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    statCard: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.divider,
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
    title: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
    },
  });
}
