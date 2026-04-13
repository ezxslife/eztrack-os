import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { NAV_ITEMS } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsIconTile } from "@/components/ui/SettingsIconTile";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { HeaderNotificationBell, HeaderSearchButton, HeaderSettingsButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useDashboardStats,
  useRecentActivity,
} from "@/lib/queries/dashboard";
import { useIsDark, useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

// ---------------------------------------------------------------------------
// Module icon tiles – dark / light aware palettes
// ---------------------------------------------------------------------------

const MODULE_ICON_MAP: Record<string, { icon: string; bg: [string, string]; fg: [string, string] }> = {
  "/":            { icon: "square.grid.2x2",             bg: ["#1E293B", "#F1F5F9"], fg: ["#94A3B8", "#475569"] },
  "/daily-log":   { icon: "doc.text",                    bg: ["#1E3A5F", "#E0F2FE"], fg: ["#38BDF8", "#0284C7"] },
  "/incidents":   { icon: "exclamationmark.triangle",    bg: ["#7F1D1D", "#FEE2E2"], fg: ["#F87171", "#DC2626"] },
  "/dispatch":    { icon: "dot.radiowaves.left.and.right", bg: ["#172554", "#DBEAFE"], fg: ["#60A5FA", "#2563EB"] },
  "/patrons":     { icon: "person.2",                    bg: ["#164E63", "#CCFBF1"], fg: ["#2DD4BF", "#0D9488"] },
  "/lost-found":  { icon: "tray.full",                   bg: ["#78350F", "#FEF3C7"], fg: ["#FBBF24", "#D97706"] },
  "/briefings":   { icon: "doc.text",                    bg: ["#1E3A5F", "#E0F2FE"], fg: ["#38BDF8", "#0284C7"] },
  "/cases":       { icon: "folder",                      bg: ["#312E81", "#EDE9FE"], fg: ["#A78BFA", "#7C3AED"] },
  "/personnel":   { icon: "person.crop.rectangle.stack", bg: ["#14532D", "#DCFCE7"], fg: ["#4ADE80", "#16A34A"] },
  "/work-orders": { icon: "wrench.and.screwdriver",      bg: ["#7C2D12", "#FFEDD5"], fg: ["#FB923C", "#EA580C"] },
  "/visitors":    { icon: "person.badge.clock",          bg: ["#1E3A5F", "#DBEAFE"], fg: ["#60A5FA", "#2563EB"] },
  "/reports":     { icon: "chart.bar",                   bg: ["#78350F", "#FEF3C7"], fg: ["#FBBF24", "#D97706"] },
  "/analytics":   { icon: "chart.line.uptrend.xyaxis",   bg: ["#14532D", "#DCFCE7"], fg: ["#4ADE80", "#16A34A"] },
};

export default function DashboardScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const isDark = useIsDark();
  const router = useRouter();
  const styles = createStyles(colors, layout, typography);
  const statsQuery = useDashboardStats();
  const activityQuery = useRecentActivity(8);

  const moduleTileFor = useMemo(() => {
    return (href: string) => {
      const mapping = MODULE_ICON_MAP[href];
      if (!mapping) return undefined;
      return (
        <SettingsIconTile
          backgroundColor={isDark ? mapping.bg[0] : mapping.bg[1]}
          icon={
            <AppSymbol
              name={mapping.icon}
              size={17}
              color={isDark ? mapping.fg[0] : mapping.fg[1]}
              weight="semibold"
            />
          }
        />
      );
    };
  }, [isDark]);

  const stats = statsQuery.data;
  const statCards = stats
    ? [
        { label: "Open incidents", value: stats.totalIncidents },
        { label: "Active dispatches", value: stats.activeDispatches },
        { label: "Daily logs today", value: stats.dailyLogsToday },
        { label: "Staff on duty", value: stats.officersOnDuty },
      ]
    : [];
  const recentActivity = activityQuery.data ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderSearchButton onPress={() => router.push("/search")} />
              <HeaderNotificationBell onPress={() => router.push("/notifications")} />
              <HeaderSettingsButton onPress={() => router.push("/settings")} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        gutter="none"
        onRefresh={() => {
          void Promise.all([
            statsQuery.refetch(),
            activityQuery.refetch(),
          ]);
        }}
        refreshing={
          statsQuery.isRefetching ||
          activityQuery.isRefetching
        }
        title="Dashboard"
      >
        <View style={styles.section}>
          <SectionHeader title="Shift overview" />
          <View style={styles.statsGrid}>
            {statCards.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Quick actions" />
          <View style={styles.actionRow}>
            <Button label="New Incident" onPress={() => router.push("/incidents/new")} />
            <Button
              label="Quick Log"
              onPress={() => router.push("/daily-log/new")}
              variant="secondary"
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Recent activity" />
          {recentActivity.length ? (
            <GroupedCard>
              {recentActivity.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <GroupedCardDivider /> : null}
                  <SettingsListRow
                    label={`${item.actorName ?? "System"} · ${item.action.replace(/_/g, " ")}`}
                    subtitle={`${item.entityType} · ${formatRelativeTimestamp(item.createdAt)}`}
                  />
                </View>
              ))}
            </GroupedCard>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyCopy}>No recent activity yet.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Open modules" />
          <GroupedCard>
            {NAV_ITEMS.slice(0, 6).map((item, index) => (
              <View key={item.label}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  leading={moduleTileFor(item.href)}
                  label={item.label}
                  onPress={() => router.push(item.href as never)}
                  subtitle={`Open ${item.label.toLowerCase()} tools.`}
                />
              </View>
            ))}
          </GroupedCard>
        </View>
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
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    emptyState: {
      backgroundColor: colors.surfaceTintSubtle,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
    },
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
    },
    statCard: {
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 16,
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
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    statValue: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      marginTop: 10,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
  });
}
