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
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { usePatrons } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const moduleKey = "patrons";
const flagFilters = [
  { label: "All", value: "" },
  { label: "Watch", value: "watch" },
  { label: "VIP", value: "vip" },
  { label: "Banned", value: "banned" },
  { label: "Warning", value: "warning" },
] as const;

export default function PatronsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const patronsQuery = usePatrons();
  const patrons = patronsQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;
  const selectedFlag = filtersState.status;
  const selectedFlagLabel =
    flagFilters.find((filter) => filter.value === selectedFlag)?.label ?? "All";
  const { nativeIOSHeader } = useIOSNativeSearchHeader({
    placeholder: "Search patrons, contact info, or notes",
    query,
    setQuery: (value) => setFilter(moduleKey, { search: value }),
    title: "Patrons",
  });
  const styles = createStyles(colors, layout, typography);

  const filtered = useMemo(
    () =>
      patrons.filter((patron) => {
        const matchesQuery =
          !query ||
          [
            patron.firstName,
            patron.lastName,
            patron.email,
            patron.phone,
            patron.notes,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());

        const matchesFlag = !selectedFlag || patron.flag === selectedFlag;
        return matchesQuery && matchesFlag;
      }),
    [patrons, query, selectedFlag]
  );

  return (
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          {!nativeIOSHeader ? (
            <SearchField
              onChangeText={(value) => setFilter(moduleKey, { search: value })}
              placeholder="Search patrons, contact info, or notes"
              style={styles.searchField}
              value={query}
            />
          ) : null}
          <FilterChips
            onSelect={(value) => {
              const match = flagFilters.find((filter) => filter.label === value);
              setFilter(moduleKey, { status: match?.value ?? "" });
            }}
            options={flagFilters.map((filter) => filter.label)}
            selected={selectedFlagLabel}
          />
          <Button
            label="New Patron"
            onPress={() => router.push("/patrons/new")}
            variant="secondary"
          />
        </View>
      }
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void patronsQuery.refetch();
      }}
      refreshing={patronsQuery.isRefetching}
      subtitle="Patron watch states and contact context in a fast mobile register."
      title="Patrons"
    >
      <SectionCard
        subtitle={
          patronsQuery.isLoading
            ? "Loading patron register"
            : `${filtered.length} patrons visible`
        }
        title="Patron register"
      >
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((patron) => (
              <Pressable
                key={patron.id}
                onPress={() =>
                  router.push({
                    pathname: "/patrons/[id]",
                    params: { id: patron.id },
                  })
                }
                style={styles.card}
              >
                <View style={styles.rowBetween}>
                  <View style={styles.grow}>
                    <Text style={styles.title}>
                      {patron.firstName} {patron.lastName}
                    </Text>
                    <Text style={styles.meta}>
                      Added {formatRelativeTimestamp(patron.createdAt)}
                    </Text>
                  </View>
                  <StatusBadge
                    status={patron.flag === "none" ? "archived" : patron.flag}
                  />
                </View>
                <Text style={styles.copy}>
                  {patron.notes ?? patron.email ?? patron.phone ?? "No notes or contact details recorded."}
                </Text>
                <Text style={styles.meta}>
                  {[patron.email, patron.phone].filter(Boolean).join(" · ") || "No contact info"}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No patrons match the current search and filter.
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
    grow: {
      flex: 1,
      gap: 4,
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
    },
  });
}
