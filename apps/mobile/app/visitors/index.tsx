import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { useVisitors } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors } from "@/theme";

const moduleKey = "visitors";
const statusFilters = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Signed In", value: "signed_in" },
  { label: "Signed Out", value: "signed_out" },
] as const;

export default function VisitorsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const visitorsQuery = useVisitors();
  const rows = visitorsQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;
  const selectedStatus = filtersState.status;
  const selectedStatusLabel =
    statusFilters.find((filter) => filter.value === selectedStatus)?.label ??
    "All";

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const matchesQuery =
          !query ||
          [
            item.firstName,
            item.lastName,
            item.purpose,
            item.hostName,
            item.company,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());

        const matchesStatus = !selectedStatus || item.status === selectedStatus;
        return matchesQuery && matchesStatus;
      }),
    [rows, query, selectedStatus]
  );

  return (
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          <SearchField
            onChangeText={(value) => setFilter(moduleKey, { search: value })}
            placeholder="Search visitor, host, company, or purpose"
            value={query}
          />
          <FilterChips
            onSelect={(value) => {
              const match = statusFilters.find((filter) => filter.label === value);
              setFilter(moduleKey, { status: match?.value ?? "" });
            }}
            options={statusFilters.map((filter) => filter.label)}
            selected={selectedStatusLabel}
          />
        </View>
      }
      onRefresh={() => {
        void visitorsQuery.refetch();
      }}
      refreshing={visitorsQuery.isRefetching}
      subtitle="Visitor movement, host assignment, and sign-in state in a concise front-desk queue."
      title="Visitors"
    >
      <SectionCard
        subtitle={
          visitorsQuery.isLoading
            ? "Loading visitor queue"
            : `${filtered.length} visits visible`
        }
        title="Visitor queue"
      >
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.copy}>{item.purpose}</Text>
                <Text style={styles.meta}>
                  {item.hostName ?? "No host"} · {item.company ?? "No company"}
                </Text>
                <Text style={styles.meta}>
                  {item.checkedInAt
                    ? `Checked in ${formatRelativeTimestamp(item.checkedInAt)}`
                    : item.checkedOutAt
                      ? `Checked out ${formatRelativeTimestamp(item.checkedOutAt)}`
                      : `${item.expectedDate ?? "Unscheduled"}${item.expectedTime ? ` at ${item.expectedTime}` : ""}`}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No visitors match the current search and filter.
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
      gap: 8,
      padding: 14,
    },
    copy: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
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
    rowBetween: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
