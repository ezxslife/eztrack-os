import { Link, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { useIncidents } from "@/lib/queries/incidents";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors } from "@/theme";

const moduleKey = "incidents";
const filters = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "Assigned", value: "assigned" },
  { label: "Follow Up", value: "follow_up" },
] as const;

export default function IncidentsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const incidentsQuery = useIncidents();
  const incidents = incidentsQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;
  const selectedFilterValue = filtersState.status;
  const selectedFilterLabel =
    filters.find((filter) => filter.value === selectedFilterValue)?.label ??
    "All";

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesQuery =
        !query ||
        incident.recordNumber.toLowerCase().includes(query.toLowerCase()) ||
        incident.type.toLowerCase().includes(query.toLowerCase()) ||
        incident.location.toLowerCase().includes(query.toLowerCase());

      const normalizedStatus = incident.status.toLowerCase();
      const matchesFilter =
        !selectedFilterValue ||
        normalizedStatus === selectedFilterValue.toLowerCase();

      return matchesQuery && matchesFilter;
    });
  }, [incidents, query, selectedFilterValue]);

  return (
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          <SearchField
            onChangeText={(value) => setFilter(moduleKey, { search: value })}
            placeholder="Search by record, type, or location"
            value={query}
          />
          <FilterChips
            onSelect={(value) => {
              const match = filters.find((filter) => filter.label === value);
              setFilter(moduleKey, { status: match?.value ?? "" });
            }}
            options={filters.map((filter) => filter.label)}
            selected={selectedFilterLabel}
          />
        </View>
      }
      onRefresh={() => {
        void incidentsQuery.refetch();
      }}
      refreshing={incidentsQuery.isRefetching}
      subtitle="Use native navigation for the high-level structure, then keep the incident queue dense and readable."
      title="Incidents"
    >
      <SectionCard
        footer={
          <Button
            label="Create Incident"
            onPress={() => router.push("/incidents/new")}
            variant="plain"
          />
        }
        subtitle={
          incidentsQuery.isLoading
            ? "Loading live incident queue"
            : `${filtered.length} items visible`
        }
        title="Active incident queue"
      >
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((incident) => (
              <Link
                key={incident.id}
                asChild
                href={{
                  pathname: "/incidents/[id]",
                  params: { id: incident.id },
                }}
              >
                <Pressable style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.title}>{incident.recordNumber}</Text>
                    <PriorityBadge priority={incident.severity} />
                  </View>
                  <Text style={styles.type}>{incident.type}</Text>
                  <Text style={styles.synopsis}>{incident.synopsis}</Text>
                  <View style={styles.row}>
                    <StatusBadge status={incident.status} />
                    <Text style={styles.meta}>{incident.location}</Text>
                  </View>
                  <Text style={styles.reported}>
                    Reported {formatRelativeTimestamp(incident.createdAt)}
                  </Text>
                </Pressable>
              </Link>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No incidents match the current search and filter.
            </Text>
          )}
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
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      padding: 14,
    },
    emptyCopy: {
      color: colors.textTertiary,
      fontSize: 14,
      lineHeight: 20,
    },
    list: {
      gap: 12,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    reported: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 8,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    synopsis: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    type: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 8,
    },
  });
}
