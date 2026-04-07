import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { NAV_ITEMS, ROLE_DISPLAY } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
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
import { useThemeColors } from "@/theme";

export default function DashboardScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const [query, setQuery] = useState("");
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
        <View style={styles.accessory}>
          <SearchField
            onChangeText={setQuery}
            placeholder="Search incidents, dispatches, or logs"
            value={query}
          />
        </View>
      }
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
  const styles = createStyles(colors);

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

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    accessory: {
      gap: 12,
    },
    emptyCopy: {
      color: colors.textTertiary,
      fontSize: 14,
      lineHeight: 20,
    },
    hero: {
      gap: 16,
      padding: 18,
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    heroEyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    heroHeader: {
      gap: 6,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 25,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    list: {
      gap: 12,
    },
    preview: {
      color: colors.accentSoft,
      fontSize: 13,
      fontWeight: "700",
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    rowMeta: {
      color: colors.textTertiary,
      fontSize: 13,
      marginTop: 4,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    sectionLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    statCard: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.divider,
      borderRadius: 22,
      borderWidth: 1,
      flexGrow: 1,
      minWidth: "47%",
      padding: 16,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: "700",
      marginTop: 10,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
  });
}
