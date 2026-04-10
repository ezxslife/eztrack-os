import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  buildReportRoute,
  getDefaultReportDateRange,
} from "@eztrack/shared";
import { useRouter } from "expo-router";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useReportCatalog } from "@/lib/queries/reports";
import { useThemeColors } from "@/theme";

const REPORT_SYMBOLS: Record<string, string> = {
  "case-status": "briefcase.fill",
  "daily-activity": "doc.text.fill",
  "dispatch-performance": "dot.radiowaves.left.and.right",
  "incident-summary": "exclamationmark.triangle.fill",
  "lost-found-inventory": "shippingbox.fill",
  "patron-flags": "shield.fill",
  "savings-losses": "dollarsign.circle.fill",
  "visitor-log": "person.2.fill",
};

function formatActivityDate(value: string | null) {
  if (!value) {
    return "No records yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReportsContent() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const catalogQuery = useReportCatalog();
  const catalog = catalogQuery.data ?? [];

  const groupedCatalog = useMemo(() => {
    return catalog.reduce<Record<string, typeof catalog>>((groups, report) => {
      groups[report.category] = [...(groups[report.category] ?? []), report];
      return groups;
    }, {});
  }, [catalog]);

  const quickReports = catalog.filter((report) => report.quick).slice(0, 4);

  return (
    <ScreenContainer
      onRefresh={() => {
        void catalogQuery.refetch();
      }}
      refreshing={catalogQuery.isRefetching}
      subtitle="Shared report catalog, grouped categories, and quick-generate entry points."
      title="Reports"
    >
      <MaterialSurface intensity={68} style={styles.hero} variant="panel">
        <Text style={styles.eyebrow}>Operational Reporting</Text>
        <Text style={styles.heroTitle}>Generate live reports from the same catalog as web</Text>
        <Text style={styles.copy}>
          Quick generate opens a default date range. Each report route exposes the full config panel,
          then native CSV and PDF sharing.
        </Text>
      </MaterialSurface>

      <SectionCard subtitle="Start with the most common report exports." title="Quick Generate">
        <View style={styles.quickList}>
          {quickReports.map((report) => (
            <Pressable
              key={report.slug}
              onPress={() =>
                router.push(
                  buildReportRoute(
                    report.slug,
                    getDefaultReportDateRange(report.defaultRangeDays ?? 7)
                  ) as never
                )
              }
              style={styles.quickChip}
            >
              <Text style={styles.quickChipLabel}>{report.name}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      {Object.entries(groupedCatalog).map(([category, reports]) => (
        <SectionCard key={category} subtitle={`${reports.length} reports`} title={category}>
          <View style={styles.list}>
            {reports.map((report) => (
              <Pressable
                key={report.slug}
                onPress={() =>
                  router.push({
                    pathname: "/reports/[type]",
                    params: { type: report.slug },
                  })
                }
                style={styles.row}
              >
                <View style={styles.rowHeader}>
                  <View style={styles.iconWrap}>
                    <AppSymbol
                      color={colors.textSecondary}
                      fallbackName="document-text-outline"
                      iosName={(REPORT_SYMBOLS[report.slug] ?? "doc.text.fill") as any}
                      size={18}
                      weight="medium"
                    />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{report.name}</Text>
                    <Text style={styles.rowCopy}>{report.description}</Text>
                    <Text style={styles.rowMeta}>
                      {report.recordCount.toLocaleString()} records · latest activity{" "}
                      {formatActivityDate(report.latestActivity)}
                    </Text>
                    <Text style={styles.rowMeta}>{report.formats.join(" · ")}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </SectionCard>
      ))}
    </ScreenContainer>
  );
}

export default function ReportsScreen() {
  return (
    <RequireLiveSession
      detail="Report catalog metadata and exports depend on live Supabase reporting queries in this tranche."
      title="Reports"
    >
      <ReportsContent />
    </RequireLiveSession>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    eyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    hero: {
      gap: 8,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 30,
    },
    iconWrap: {
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    list: {
      gap: 12,
    },
    quickChip: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    quickChipLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    quickList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      padding: 14,
    },
    rowBody: {
      flex: 1,
      gap: 4,
    },
    rowCopy: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    rowHeader: {
      flexDirection: "row",
      gap: 12,
    },
    rowMeta: {
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 16,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
