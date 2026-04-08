import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useDashboardStats,
  useRecentActivity,
} from "@/lib/queries/dashboard";
import { useThemeColors } from "@/theme";

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const statsQuery = useDashboardStats();
  const activityQuery = useRecentActivity(6);
  const stats = statsQuery.data;
  const kpis = stats
    ? [
        ["Open Incidents", String(stats.totalIncidents)],
        ["Active Dispatches", String(stats.activeDispatches)],
        ["Daily Logs Today", String(stats.dailyLogsToday)],
        ["Staff On Duty", String(stats.officersOnDuty)],
      ]
    : [];

  return (
    <ScreenContainer
      onRefresh={() => {
        void Promise.all([statsQuery.refetch(), activityQuery.refetch()]);
      }}
      refreshing={statsQuery.isRefetching || activityQuery.isRefetching}
      subtitle="An early analytics surface built on the same live operational data as dashboard."
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
          statsQuery.isLoading
            ? "Loading current KPI set"
            : `${kpis.length} live metrics`
        }
        title="Current KPIs"
      >
        <View style={styles.grid}>
          {kpis.map(([label, value]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          activityQuery.isLoading
            ? "Loading live activity"
            : `${(activityQuery.data ?? []).length} recent events`
        }
        title="Recent changes"
      >
        <View style={styles.list}>
          {(activityQuery.data ?? []).map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>
                {item.actorName ?? "System"} · {item.action.replace(/_/g, " ")}
              </Text>
              <Text style={styles.rowMeta}>
                {item.entityType} · {formatRelativeTimestamp(item.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Next tranche">
        <Text style={styles.copy}>
          KPI drill-downs, charts, and report export still need dedicated
          module work. This screen closes the route gap and gives mobile roles a
          role-aware analytics destination today.
        </Text>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    eyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    hero: {
      gap: 8,
    },
    list: {
      gap: 12,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: 14,
    },
    rowMeta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    statCard: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.divider,
      borderRadius: 20,
      borderWidth: 1,
      flexGrow: 1,
      minWidth: "47%",
      padding: 16,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: "700",
      marginTop: 10,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
    },
  });
}
