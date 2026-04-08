import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { FilterChips } from "@/components/ui/FilterChips";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatShortDateTime } from "@/lib/format";
import { useWorkOrders } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors } from "@/theme";

const moduleKey = "work-orders";
const statusFilters = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "Assigned", value: "assigned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
] as const;

export default function WorkOrdersScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const workOrdersQuery = useWorkOrders();
  const rows = workOrdersQuery.data ?? [];
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
            item.woNumber,
            item.title,
            item.category,
            item.assignedTo,
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
            placeholder="Search work order number, title, category, or assignee"
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
        void workOrdersQuery.refetch();
      }}
      refreshing={workOrdersQuery.isRefetching}
      subtitle="Facilities and safety work tracked in the same operational shell as incidents and dispatch."
      title="Work Orders"
    >
      <SectionCard
        subtitle={
          workOrdersQuery.isLoading
            ? "Loading work orders"
            : `${filtered.length} work orders visible`
        }
        title="Maintenance queue"
      >
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>{item.woNumber}</Text>
                  <PriorityBadge priority={item.priority} />
                </View>
                <Text style={styles.type}>{item.title}</Text>
                <View style={styles.rowBetween}>
                  <StatusBadge status={item.status} />
                  <Text style={styles.meta}>{item.category}</Text>
                </View>
                <Text style={styles.meta}>
                  {item.assignedTo ?? "Unassigned"} ·{" "}
                  {item.dueDate ? `Due ${formatShortDateTime(item.dueDate)}` : "No due date"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No work orders match the current search and filter.
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
    type: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
