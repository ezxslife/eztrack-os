import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { NAV_ITEMS, ROLE_DISPLAY } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { useSessionContext } from "@/hooks/useSessionContext";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useDashboardStats,
  useRecentActivity,
} from "@/lib/queries/dashboard";
import { useOperationalSearch } from "@/lib/queries/search";
import { useRecentSearchStore } from "@/stores/recent-search-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const searchScope = "dashboard-global";

export default function DashboardScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const recentSearches = useRecentSearchStore(
    (state) => state.entriesByScope[searchScope] ?? []
  );
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
    title: "Operations Overview",
  });
  const styles = createStyles(colors, layout, typography);
  const { profile, usePreviewData } = useSessionContext();
  const statsQuery = useDashboardStats();
  const activityQuery = useRecentActivity(8);
  const searchQuery = useOperationalSearch(query);

  const showSearchResults = query.trim().length >= 2;
  const stats = statsQuery.data;
  const statCards = stats
    ? [
        { label: "Open Incidents", value: stats.totalIncidents },
        { label: "Active Dispatches", value: stats.activeDispatches },
        { label: "Daily Logs Today", value: stats.dailyLogsToday },
        { label: "Staff On Duty", value: stats.officersOnDuty },
      ]
    : [];
  const recentActivity = activityQuery.data ?? [];
  const searchResults = searchQuery.data;

  return (
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
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void Promise.all([
          statsQuery.refetch(),
          activityQuery.refetch(),
          showSearchResults ? searchQuery.refetch() : Promise.resolve(null),
        ]);
      }}
      refreshing={statsQuery.isRefetching || activityQuery.isRefetching || searchQuery.isRefetching}
      subtitle="A native command surface for the same incident and dispatch modules that already exist on the web app."
      title="Operations Overview"
    >
      <MaterialSurface intensity={84} style={styles.hero} variant="panel">
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>Current Shift</Text>
          <Text style={styles.heroTitle}>{profile?.full_name ?? "Harbor Pavilion Command"}</Text>
          <Text style={styles.heroCopy}>
            Dispatch, incident intake, and field notes stay one gesture away. Keep the top layer
            fast and the operational data dense underneath it.
          </Text>
          {usePreviewData ? <Text style={styles.preview}>Preview data only</Text> : null}
        </View>
        <View style={styles.heroActions}>
          <Button label="New Incident" onPress={() => router.push("/incidents/new")} />
          <Button label="Quick Log" onPress={() => router.push("/daily-log/new")} variant="secondary" />
        </View>
      </MaterialSurface>

      {showSearchResults ? (
        <SectionCard
          subtitle={searchQuery.isLoading ? "Searching live operational records" : "Cross-module results"}
          title="Search Results"
        >
          <View style={styles.list}>
            <SearchGroup
              emptyCopy="No matching incidents"
              hrefBase="/incidents"
              items={searchResults?.incidents ?? []}
              title="Incidents"
            />
            <SearchGroup
              emptyCopy="No matching dispatches"
              hrefBase="/dispatch"
              items={searchResults?.dispatches ?? []}
              title="Dispatches"
            />
            <SearchGroup
              emptyCopy="No matching daily logs"
              hrefBase="/daily-log"
              items={searchResults?.dailyLogs ?? []}
              title="Daily Log"
            />
          </View>
        </SectionCard>
      ) : (
        <>
          {recentSearches.length ? (
            <SectionCard
              subtitle="Persisted per operator on this device."
              title="Recent searches"
            >
              <View style={styles.recentSearchList}>
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
                <Button
                  label="Clear Recent Searches"
                  onPress={() => clearRecentSearches(searchScope)}
                  variant="plain"
                />
              </View>
            </SectionCard>
          ) : null}

          <View style={styles.statsGrid}>
            {statCards.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <SectionCard
            subtitle={activityQuery.isLoading ? "Loading live activity feed" : `${recentActivity.length} recent entries`}
            title="Recent activity"
          >
            <View style={styles.list}>
              {recentActivity.map((item) => (
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

          <SectionCard subtitle="The primary app map comes from shared route metadata." title="Operational modules">
            <View style={styles.list}>
              {NAV_ITEMS.slice(0, 6).map((item) => (
                <View key={item.label} style={styles.row}>
                  <Text style={styles.rowTitle}>{item.label}</Text>
                  <Text style={styles.rowMeta}>Route {item.href}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard subtitle="Shared roles already available to the mobile shell." title="Role model">
            <View style={styles.list}>
              {Object.entries(ROLE_DISPLAY).slice(0, 4).map(([key, label]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.rowTitle}>{label}</Text>
                  <Text style={styles.rowMeta}>{key}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </>
      )}
    </ScreenContainer>
  );
}

interface SearchGroupProps {
  emptyCopy: string;
  hrefBase: "/daily-log" | "/dispatch" | "/incidents";
  items: Array<{ id: string; subtitle: string | null; title: string }>;
  title: string;
}

function SearchGroup({
  emptyCopy,
  hrefBase,
  items,
  title,
}: SearchGroupProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, layout, typography);

  return (
    <View style={styles.list}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {items.length ? (
        items.map((item) => (
          <Link
            key={`${title}-${item.id}`}
            asChild
            href={hrefBase === "/incidents" ? { pathname: "/incidents/[id]", params: { id: item.id } } : hrefBase}
          >
            <Pressable style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>{item.subtitle ?? "No record number"}</Text>
            </Pressable>
          </Link>
        ))
      ) : (
        <Text style={styles.emptyCopy}>{emptyCopy}</Text>
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
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    hero: {
      gap: layout.gridGap,
      padding: layout.cardPadding,
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    heroCopy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    heroEyebrow: {
      ...typography.caption1,
      color: colors.accentSoft,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    heroHeader: {
      gap: 6,
    },
    heroTitle: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    list: {
      gap: layout.gridGap,
    },
    preview: {
      ...typography.footnote,
      color: colors.accentSoft,
      fontWeight: "700",
    },
    recentSearchChip: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    recentSearchChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    recentSearchLabel: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    recentSearchList: {
      gap: 14,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      paddingHorizontal: layout.listItemPadding,
      paddingVertical: layout.listItemPadding - 2,
    },
    rowMeta: {
      ...typography.footnote,
      color: colors.textTertiary,
      marginTop: 4,
    },
    rowTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    searchField: {
      width: "100%",
    },
    sectionLabel: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    statCard: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.divider,
      borderRadius: 22,
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
