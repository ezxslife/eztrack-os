import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import {
  buildReportRoute,
  getDefaultReportDateRange,
} from "@eztrack/shared";
import { useRouter } from "expo-router";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { HeaderAddButton, HeaderFilterButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsIconTile } from "@/components/ui/SettingsIconTile";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { useReportCatalog } from "@/lib/queries/reports";
import { useIsDark, useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

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

// Dark / light palette pairs [dark, light] for report icon tiles
const REPORT_TILE_PALETTE: Record<string, { bg: [string, string]; fg: [string, string] }> = {
  "case-status":           { bg: ["#312E81", "#EDE9FE"], fg: ["#A78BFA", "#7C3AED"] },
  "daily-activity":        { bg: ["#1E3A5F", "#E0F2FE"], fg: ["#38BDF8", "#0284C7"] },
  "dispatch-performance":  { bg: ["#172554", "#DBEAFE"], fg: ["#60A5FA", "#2563EB"] },
  "incident-summary":      { bg: ["#7F1D1D", "#FEE2E2"], fg: ["#F87171", "#DC2626"] },
  "lost-found-inventory":  { bg: ["#78350F", "#FEF3C7"], fg: ["#FBBF24", "#D97706"] },
  "patron-flags":          { bg: ["#14532D", "#DCFCE7"], fg: ["#4ADE80", "#16A34A"] },
  "savings-losses":        { bg: ["#164E63", "#CCFBF1"], fg: ["#2DD4BF", "#0D9488"] },
  "visitor-log":           { bg: ["#1E293B", "#E0E7FF"], fg: ["#93C5FD", "#4F46E5"] },
};
const DEFAULT_REPORT_PALETTE = { bg: ["#1C1917", "#F5F5F4"] as [string, string], fg: ["#A8A29E", "#57534E"] as [string, string] };

function formatActivityDate(value: string | null) {
  if (!value) {
    return "No activity yet";
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
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const isDark = useIsDark();
  const styles = createStyles(colors, typography, layout);
  const router = useRouter();
  const catalogQuery = useReportCatalog();
  const catalog = catalogQuery.data ?? [];

  const reportTileFor = useMemo(() => {
    return (slug: string) => {
      const pal = REPORT_TILE_PALETTE[slug] ?? DEFAULT_REPORT_PALETTE;
      const iconName = REPORT_SYMBOLS[slug] ?? "doc.text.fill";
      return (
        <SettingsIconTile
          backgroundColor={isDark ? pal.bg[0] : pal.bg[1]}
          icon={
            <AppSymbol
              name={iconName}
              size={17}
              color={isDark ? pal.fg[0] : pal.fg[1]}
              weight="semibold"
            />
          }
        />
      );
    };
  }, [isDark]);

  const groupedCatalog = useMemo(() => {
    return catalog.reduce<Record<string, typeof catalog>>((groups, report) => {
      groups[report.category] = [...(groups[report.category] ?? []), report];
      return groups;
    }, {});
  }, [catalog]);

  const quickReports = catalog.filter((report) => report.quick).slice(0, 4);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderAddButton onPress={() => router.push("/reports/new")} />
              <HeaderFilterButton onPress={() => {}} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        gutter="none"
        onRefresh={() => {
          void catalogQuery.refetch();
        }}
        refreshing={catalogQuery.isRefetching}
        title="Reports"
      >
      {quickReports.length ? (
        <View style={styles.section}>
          <SectionHeader title="Favorites" />
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
        </View>
      ) : null}

      {Object.entries(groupedCatalog).map(([category, reports]) => (
        <View key={category} style={styles.section}>
          <SectionHeader title={category} />
          <GroupedCard>
            {reports.map((report, index) => (
              <View key={report.slug}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  leading={reportTileFor(report.slug)}
                  label={report.name}
                  onPress={() =>
                    router.push({
                      pathname: "/reports/[type]",
                      params: { type: report.slug },
                    })
                  }
                  subtitle={`${report.recordCount.toLocaleString()} records · latest activity ${formatActivityDate(report.latestActivity)} · ${report.formats.join(" · ")}`}
                />
              </View>
            ))}
          </GroupedCard>
        </View>
      ))}
      </ScreenContainer>
    </>
    );
}

export default function ReportsScreen() {
  return (
    <RequireLiveSession
      detail="Reports are available when you're signed in with a live account."
      title="Reports"
    >
      <ReportsContent />
    </RequireLiveSession>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    quickChip: {
      backgroundColor: colors.surfaceTintMedium,
      borderColor: colors.borderLight,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    quickChipLabel: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    quickList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
    },
  });
}
