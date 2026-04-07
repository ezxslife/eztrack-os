import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useDispatches,
  useOnDutyOfficers,
} from "@/lib/queries/dispatches";
import { useThemeColors } from "@/theme";

const filters = ["All", "Critical", "Scheduled", "On Scene"];

export default function DispatchScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const dispatchesQuery = useDispatches();
  const officersQuery = useOnDutyOfficers();

  const dispatches = (dispatchesQuery.data ?? []).filter((dispatch) => {
    const matchesQuery =
      !query ||
      dispatch.recordNumber.toLowerCase().includes(query.toLowerCase()) ||
      dispatch.location.toLowerCase().includes(query.toLowerCase()) ||
      dispatch.description.toLowerCase().includes(query.toLowerCase());

    if (selectedFilter === "All") {
      return matchesQuery;
    }

    if (selectedFilter === "Critical") {
      return matchesQuery && dispatch.priority === "critical";
    }

    return (
      matchesQuery &&
      dispatch.status.replace("_", " ").toLowerCase() === selectedFilter.toLowerCase()
    );
  });

  return (
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          <SearchField
            onChangeText={setQuery}
            placeholder="Search calls, units, and locations"
            value={query}
          />
          <FilterChips onSelect={setSelectedFilter} options={filters} selected={selectedFilter} />
        </View>
      }
      onRefresh={() => {
        void Promise.all([dispatchesQuery.refetch(), officersQuery.refetch()]);
      }}
      refreshing={dispatchesQuery.isRefetching || officersQuery.isRefetching}
      subtitle="The dispatch board should feel glanceable first, actionable second."
      title="Dispatch"
    >
      <MaterialSurface intensity={76} style={styles.summary} variant="panel">
        <Text style={styles.summaryEyebrow}>Live Board</Text>
        <Text style={styles.summaryValue}>{dispatches.length} active calls</Text>
        <Text style={styles.summaryCopy}>
          The tab shell is native. The content layer stays dense, calm, and readable under stress.
        </Text>
      </MaterialSurface>

      <SectionCard title="Live board">
        <View style={styles.list}>
          {dispatches.length ? (
            dispatches.map((dispatch) => (
              <View key={dispatch.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.title}>{dispatch.recordNumber}</Text>
                  <PriorityBadge priority={dispatch.priority} />
                </View>
                <Text style={styles.location}>{dispatch.location}</Text>
                <Text style={styles.description}>{dispatch.description}</Text>
                <View style={styles.row}>
                  <StatusBadge status={dispatch.status} />
                  <Text style={styles.assignee}>{dispatch.officerName ?? "Unassigned"}</Text>
                </View>
                <Text style={styles.meta}>{formatRelativeTimestamp(dispatch.createdAt)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No dispatches match the current view.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={officersQuery.isLoading ? "Loading staff statuses" : `${(officersQuery.data ?? []).length} active staff records`}
        title="Units on duty"
      >
        <View style={styles.list}>
          {(officersQuery.data ?? []).map((officer) => (
            <View key={officer.id} style={styles.officerRow}>
              <View>
                <Text style={styles.title}>{officer.name}</Text>
                <Text style={styles.meta}>{formatRelativeTimestamp(officer.updatedAt)}</Text>
              </View>
              <StatusBadge status={officer.status} />
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    accessory: {
      gap: 12,
    },
    assignee: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 8,
      padding: 14,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    emptyCopy: {
      color: colors.textTertiary,
      fontSize: 14,
    },
    list: {
      gap: 12,
    },
    location: {
      color: colors.primaryStrong,
      fontSize: 14,
      fontWeight: "600",
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 12,
    },
    officerRow: {
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 14,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    summary: {
      gap: 6,
    },
    summaryCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    summaryEyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
