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
import { formatRelativeTimestamp } from "@/lib/format";
import { useBriefings } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { HeaderSearchButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";

const moduleKey = "briefings";
const priorityFilters = [
  { label: "All", value: "" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
] as const;

export default function BriefingsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const briefingsQuery = useBriefings();
  const rows = briefingsQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;
  const selectedPriority = filtersState.priority;
  const selectedPriorityLabel =
    priorityFilters.find((filter) => filter.value === selectedPriority)?.label ??
    "All";
  const styles = createStyles(colors, layout, typography);

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const matchesQuery =
          !query ||
          [item.title, item.preview, item.author]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());

        const matchesPriority =
          !selectedPriority || item.priority === selectedPriority;
        return matchesQuery && matchesPriority;
      }),
    [rows, query, selectedPriority]
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
              const match = priorityFilters.find((filter) => filter.label === value);
              setFilter(moduleKey, { priority: match?.value ?? "" });
            }}
            options={priorityFilters.map((filter) => filter.label)}
            selected={selectedPriorityLabel}
          />
          <Button
            label="New Briefing"
            onPress={() => router.push("/briefings/new")}
            variant="secondary"
          />
        </View>
        }
        gutter="none"
        nativeHeader
        onRefresh={() => {
          void briefingsQuery.refetch();
        }}
        refreshing={briefingsQuery.isRefetching}
        subtitle="Shift briefings and operational notes in a mobile-first reading surface."
        title="Briefings"
      >
      <View style={styles.section}>
        <SectionHeader title="Briefing feed" />
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/briefings/[id]",
                    params: { id: item.id },
                  })
                }
                style={styles.card}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>{item.title}</Text>
                  <PriorityBadge priority={item.priority} />
                </View>
                <Text style={styles.copy}>{item.preview}</Text>
                <Text style={styles.meta}>
                  {item.author} · {formatRelativeTimestamp(item.createdAt)}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No briefings match the current search and filter.
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
      color: colors.textSecondary,
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
      flex: 1,
      fontWeight: "700",
      paddingRight: 12,
    },
  });
}
