import { useRouter, Stack } from "expo-router";
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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatShortDateTime } from "@/lib/format";
import { useWorkOrders } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { HeaderSearchButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";

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
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
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
  const styles = createStyles(colors, layout, typography);

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
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderSearchButton onPress={() => router.push("/search")} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        accessory={
          <View style={styles.accessory}>
            <FilterChips
            onSelect={(value) => {
              const match = statusFilters.find((filter) => filter.label === value);
              setFilter(moduleKey, { status: match?.value ?? "" });
            }}
            options={statusFilters.map((filter) => filter.label)}
            selected={selectedStatusLabel}
          />
          <Button
            label="New Work Order"
            onPress={() => router.push("/work-orders/new")}
            variant="secondary"
          />
        </View>
        }
        gutter="none"
        nativeHeader
        onRefresh={() => {
          void workOrdersQuery.refetch();
        }}
        refreshing={workOrdersQuery.isRefetching}
        subtitle="Facilities and safety work tracked in the same operational shell as incidents and dispatch."
        title="Work Orders"
      >
      <View style={styles.section}>
        <SectionHeader title="Maintenance queue" />
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/work-orders/[id]",
                    params: { id: item.id },
                  })
                }
                style={styles.card}
              >
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
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No work orders match the current search and filter.
            </Text>
          )}
        </View>
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
    accessory: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      gap: 8,
      padding: layout.listItemPadding,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    list: {
      gap: layout.gridGap,
    },
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
    },
    meta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    rowBetween: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
      flex: 1,
      paddingRight: 12,
    },
    type: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
  });
}
