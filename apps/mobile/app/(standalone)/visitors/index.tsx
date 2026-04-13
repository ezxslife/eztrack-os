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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { useVisitors } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { HeaderSearchButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";

const moduleKey = "visitors";
const statusFilters = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Signed In", value: "signed_in" },
  { label: "Signed Out", value: "signed_out" },
] as const;

export default function VisitorsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
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
  const styles = createStyles(colors, layout, typography);

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
            label="New Visitor"
            onPress={() => router.push("/visitors/new")}
            variant="secondary"
          />
        </View>
        }
        gutter="none"
        nativeHeader
        onRefresh={() => {
          void visitorsQuery.refetch();
        }}
        refreshing={visitorsQuery.isRefetching}
        subtitle="Visitor movement, host assignment, and sign-in state in a concise front-desk queue."
        title="Visitors"
      >
      <View style={styles.section}>
        <SectionHeader title="Visitor queue" />

        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/visitors/[id]",
                    params: { id: item.id },
                  })
                }
                style={styles.card}
              >
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
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No visitors match the current search and filter.
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
    copy: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    list: {
      gap: layout.gridGap,
    },
    meta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
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
  });
}
