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
import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { HeaderAddButton, HeaderFilterButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { useReportCatalog } from "@/lib/queries/reports";
import { useThemeColors, useThemeTypography } from "@/theme";
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
  const styles = createStyles(colors, typography, layout);
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
        <ScreenTitleStrip title="Reports" />
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
                  label={report.name}
                  onPress={() =>
                    router.push({
                      pathname: "/reports/[type]",
                      params: { type: report.slug },
                    })
                  }
                  subtitle={`${report.recordCount.toLocaleString()} records · latest activity ${formatActivityDate(report.latestActivity)} · ${report.formats.join(" · ")}`}
                  trailing={
                    <View style={styles.iconWrap}>
                      <AppSymbol
                        color={colors.textSecondary}
                        fallbackName="document-text-outline"
                        iosName={(REPORT_SYMBOLS[report.slug] ?? "doc.text.fill") as any}
                        size={16}
                        weight="medium"
                      />
                    </View>
                  }
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
    iconWrap: {
      alignItems: "center",
      backgroundColor: colors.surfaceTintMedium,
      borderColor: colors.borderLight,
      borderRadius: 14,
      borderWidth: 1,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
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
      paddingHorizontal: layout.horizontalPadding,
    },
    section: {
      gap: 8,
    },
  });
}
