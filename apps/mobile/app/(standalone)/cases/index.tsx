import { useRouter, Stack } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { formatRelativeTimestamp } from "@/lib/format";
import { useCases } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { HeaderSearchButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";

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
  const styles = createStyles(colors, typography, layout);

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
              label="New Case"
              onPress={() => router.push("/cases/new")}
              variant="secondary"
            />
          </View>
        }
        gutter="none"
        nativeHeader
        onRefresh={() => {
          void casesQuery.refetch();
        }}
        refreshing={casesQuery.isRefetching}
        subtitle="Case ownership and escalation state."
        title="Cases"
      >
      <View style={styles.section}>
        <SectionHeader title="Active cases" />
        {filtered.length ? (
          <GroupedCard>
            {filtered.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={item.caseNumber}
                  onPress={() =>
                    router.push({
                      pathname: "/cases/[id]",
                      params: { id: item.id },
                    })
                  }
                  subtitle={[
                    item.caseType,
                    item.synopsis ?? "No synopsis recorded for this case.",
                    item.leadInvestigator ?? "Unassigned",
                    `Opened ${formatRelativeTimestamp(item.created)}`,
                  ].join(" · ")}
                  trailing={<PriorityBadge priority={item.priority ?? "none"} />}
                />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>
              No cases match the current search and filter.
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    accessory: {
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
      borderRadius: 12,
      borderWidth: 1,
      marginHorizontal: layout.horizontalPadding,
      padding: 16,
    },
    section: {
      gap: 8,
    },
  });
}
