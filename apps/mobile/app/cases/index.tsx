import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { useCases } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const moduleKey = "cases";
const statusFilters = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "On Hold", value: "on_hold" },
  { label: "Closed", value: "closed" },
] as const;

export default function CasesScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const casesQuery = useCases();
  const rows = casesQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;
  const selectedStatus = filtersState.status;
  const selectedStatusLabel =
    statusFilters.find((filter) => filter.value === selectedStatus)?.label ??
    "All";
  const { nativeIOSHeader } = useIOSNativeSearchHeader({
    placeholder: "Search case number, type, synopsis, or investigator",
    query,
    setQuery: (value) => setFilter(moduleKey, { search: value }),
    title: "Cases",
  });
  const styles = createStyles(colors, layout, typography);

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const matchesQuery =
          !query ||
          [
            item.caseNumber,
            item.caseType,
            item.synopsis,
            item.leadInvestigator,
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
          {!nativeIOSHeader ? (
            <SearchField
              onChangeText={(value) => setFilter(moduleKey, { search: value })}
              placeholder="Search case number, type, synopsis, or investigator"
              style={styles.searchField}
              value={query}
            />
          ) : null}
          <FilterChips
            onSelect={(value) => {
              const match = statusFilters.find((filter) => filter.label === value);
              setFilter(moduleKey, { status: match?.value ?? "" });
            }}
            options={statusFilters.map((filter) => filter.label)}
            selected={selectedStatusLabel}
          />
          <Button
            label="New Case"
            onPress={() => router.push("/cases/new")}
            variant="secondary"
          />
        </View>
      }
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void casesQuery.refetch();
      }}
      refreshing={casesQuery.isRefetching}
      subtitle="Case tracking, lead ownership, and escalation state in a field-friendly queue."
      title="Cases"
    >
      <SectionCard
        subtitle={
          casesQuery.isLoading
            ? "Loading case queue"
            : `${filtered.length} cases visible`
        }
        title="Active cases"
      >
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/cases/[id]",
                    params: { id: item.id },
                  })
                }
                style={styles.card}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>{item.caseNumber}</Text>
                  <PriorityBadge priority={item.priority ?? "none"} />
                </View>
                <Text style={styles.type}>{item.caseType}</Text>
                <Text style={styles.copy}>
                  {item.synopsis ?? "No synopsis recorded for this case."}
                </Text>
                <View style={styles.rowBetween}>
                  <StatusBadge status={item.status} />
                  <Text style={styles.meta}>
                    {item.leadInvestigator ?? "Unassigned"}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  Opened {formatRelativeTimestamp(item.created)}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No cases match the current search and filter.
            </Text>
          )}
        </View>
      </SectionCard>
    </ScreenContainer>
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
      borderRadius: 18,
      gap: 8,
      padding: layout.listItemPadding,
    },
    copy: {
      ...typography.subheadline,
      color: colors.textSecondary,
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
    rowBetween: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    searchField: {
      width: "100%",
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
      color: colors.accent,
      fontWeight: "600",
    },
  });
}
