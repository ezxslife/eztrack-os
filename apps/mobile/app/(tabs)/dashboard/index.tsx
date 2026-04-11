import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { NAV_ITEMS } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SearchField } from "@/components/ui/SearchField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { HeaderNotificationBell, HeaderSettingsButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useDashboardStats,
  useRecentActivity,
} from "@/lib/queries/dashboard";
import { useOperationalSearch } from "@/lib/queries/search";
import {
  selectRecentSearches,
  useRecentSearchStore,
} from "@/stores/recent-search-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const searchScope = "dashboard-global";
const selectDashboardRecentSearches = selectRecentSearches(searchScope);

type ResultScope = "daily-log" | "dispatch" | "incidents";

export default function DashboardScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const recentSearches = useRecentSearchStore(selectDashboardRecentSearches);
  const addRecentSearch = useRecentSearchStore((state) => state.addRecentSearch);
  const clearRecentSearches = useRecentSearchStore(
    (state) => state.clearRecentSearches
  );
  const handleSearchSubmit = (value: string) => {
    addRecentSearch(searchScope, value);
  };
  const { nativeIOSHeader } = useIOSNativeSearchHeader({
    onSubmit: handleSearchSubmit,
    placeholder: "Search incidents, dispatches, or logs",
    query,
    setQuery,
    title: "Operations",
  });
  const styles = createStyles(colors, layout, typography);
  const statsQuery = useDashboardStats();
  const activityQuery = useRecentActivity(8);
  const searchQuery = useOperationalSearch(query);

  const showSearchResults = query.trim().length >= 2;
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
  const searchResults = searchQuery.data;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderNotificationBell onPress={() => router.push("/notifications")} />
              <HeaderSettingsButton onPress={() => router.push("/settings")} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        accessory={
          !nativeIOSHeader ? (
            <View style={styles.accessory}>
              <SearchField
                onChangeText={setQuery}
                onSubmitEditing={() => handleSearchSubmit(query)}
                placeholder="Search incidents, dispatches, or logs"
                style={styles.searchField}
                value={query}
              />
            </View>
          ) : undefined
        }
        gutter="none"
        iosNativeHeader={nativeIOSHeader}
        onRefresh={() => {
          void Promise.all([
            statsQuery.refetch(),
            activityQuery.refetch(),
            showSearchResults ? searchQuery.refetch() : Promise.resolve(null),
          ]);
        }}
        refreshing={
          statsQuery.isRefetching ||
          activityQuery.isRefetching ||
          searchQuery.isRefetching
        }
        title="Dashboard"
      >
        <ScreenTitleStrip title="Dashboard" />
        {showSearchResults ? (
        <>
          <SearchGroup
            emptyCopy="No matching incidents"
            items={searchResults?.incidents ?? []}
            scope="incidents"
            title="Incidents"
          />
          <SearchGroup
            emptyCopy="No matching dispatches"
            items={searchResults?.dispatches ?? []}
            scope="dispatch"
            title="Dispatches"
          />
          <SearchGroup
            emptyCopy="No matching daily logs"
            items={searchResults?.dailyLogs ?? []}
            scope="daily-log"
            title="Daily log"
          />
        </>
      ) : (
        <>
          {recentSearches.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <SectionHeader title="Recent searches" />
                <Button
                  label="Clear"
                  onPress={() => clearRecentSearches(searchScope)}
                  variant="plain"
                />
              </View>
              <View style={styles.recentSearchChips}>
                {recentSearches.map((entry) => (
                  <Pressable
                    key={entry.query}
                    onPress={() => setQuery(entry.query)}
                    style={styles.recentSearchChip}
                  >
                    <Text style={styles.recentSearchLabel}>{entry.query}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

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
                    label={item.label}
                    onPress={() => router.push(item.href as never)}
                    subtitle={`Open ${item.label.toLowerCase()} tools.`}
                  />
                </View>
              ))}
            </GroupedCard>
          </View>
        </>
      )}
      </ScreenContainer>
    </>
  );
}

interface SearchGroupProps {
  emptyCopy: string;
  items: Array<{ id: string; subtitle: string | null; title: string }>;
  scope: ResultScope;
  title: string;
}

function SearchGroup({ emptyCopy, items, scope, title }: SearchGroupProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const styles = createStyles(colors, layout, typography);

  const openResult = (id: string) => {
    if (scope === "incidents") {
      router.push({ pathname: "/incidents/[id]", params: { id } });
      return;
    }

    if (scope === "dispatch") {
      router.push({ pathname: "/dispatch/[id]", params: { id } });
      return;
    }

    router.push({ pathname: "/daily-log/[id]", params: { id } });
  };

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {items.length ? (
        <GroupedCard>
          {items.map((item, index) => (
            <View key={`${scope}-${item.id}`}>
              {index > 0 ? <GroupedCardDivider /> : null}
              <SettingsListRow
                label={item.title}
                onPress={() => openResult(item.id)}
                subtitle={item.subtitle ?? "No record number"}
              />
            </View>
          ))}
        </GroupedCard>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyCopy}>{emptyCopy}</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    accessory: {
      paddingHorizontal: layout.horizontalPadding,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
      paddingHorizontal: layout.horizontalPadding,
    },
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
    recentSearchChip: {
      backgroundColor: colors.surfaceTintMedium,
      borderColor: colors.borderLight,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    recentSearchChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: layout.horizontalPadding,
    },
    recentSearchLabel: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    searchField: {
      width: "100%",
    },
    section: {
      gap: 8,
    },
    sectionHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: layout.horizontalPadding,
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
      paddingHorizontal: layout.horizontalPadding,
    },
  });
}
