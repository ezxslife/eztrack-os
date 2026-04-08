import { useRouter } from "expo-router";
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
import { formatRelativeTimestamp } from "@/lib/format";
import { useBriefings } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors } from "@/theme";

const moduleKey = "briefings";
const priorityFilters = [
  { label: "All", value: "" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
] as const;

export default function BriefingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          <SearchField
            onChangeText={(value) => setFilter(moduleKey, { search: value })}
            placeholder="Search title, author, or briefing content"
            value={query}
          />
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
      onRefresh={() => {
        void briefingsQuery.refetch();
      }}
      refreshing={briefingsQuery.isRefetching}
      subtitle="Shift briefings and operational notes in a mobile-first reading surface."
      title="Briefings"
    >
      <SectionCard
        subtitle={
          briefingsQuery.isLoading
            ? "Loading briefings"
            : `${filtered.length} briefings visible`
        }
        title="Briefing feed"
      >
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
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
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
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      paddingRight: 12,
    },
  });
}
