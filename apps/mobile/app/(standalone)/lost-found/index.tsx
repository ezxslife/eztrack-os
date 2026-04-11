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
import {
  useFoundItems,
  useLostReports,
} from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const moduleKey = "lost-found";
const statusFilters = [
  { label: "All", value: "" },
  { label: "Stored", value: "stored" },
  { label: "Pending Return", value: "pending_return" },
  { label: "Returned", value: "returned" },
] as const;

export default function LostFoundScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const foundItemsQuery = useFoundItems();
  const lostReportsQuery = useLostReports();
  const foundItems = foundItemsQuery.data ?? [];
  const lostReports = lostReportsQuery.data ?? [];
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
    placeholder: "Search items, categories, locations, or report numbers",
    query,
    setQuery: (value) => setFilter(moduleKey, { search: value }),
    title: "Lost & Found",
  });
  const styles = createStyles(colors, layout, typography);

  const filteredFoundItems = useMemo(
    () =>
      foundItems.filter((item) => {
        const matchesQuery =
          !query ||
          [
            item.itemNumber,
            item.description,
            item.category,
            item.locationFound,
            item.storageLocation,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());

        const matchesStatus = !selectedStatus || item.status === selectedStatus;
        return matchesQuery && matchesStatus;
      }),
    [foundItems, query, selectedStatus]
  );

  const filteredLostReports = useMemo(
    () =>
      lostReports.filter((item) =>
        [
          item.reportNumber,
          item.description,
          item.category,
          item.lastSeenLocation,
          item.reportedBy,
          item.reportedByContact,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [lostReports, query]
  );

  return (
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          {!nativeIOSHeader ? (
            <SearchField
              onChangeText={(value) => setFilter(moduleKey, { search: value })}
              placeholder="Search items, categories, locations, or report numbers"
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
            label="New Found Item"
            onPress={() => router.push("/lost-found/new")}
            variant="secondary"
          />
        </View>
      }
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void Promise.all([foundItemsQuery.refetch(), lostReportsQuery.refetch()]);
      }}
      refreshing={foundItemsQuery.isRefetching || lostReportsQuery.isRefetching}
      subtitle="Found inventory and active lost reports in a single recovery surface."
      title="Lost & Found"
    >
      <SectionCard
        subtitle={
          foundItemsQuery.isLoading
            ? "Loading found inventory"
            : `${filteredFoundItems.length} found items visible`
        }
        title="Found inventory"
      >
        <View style={styles.list}>
          {filteredFoundItems.length ? (
            filteredFoundItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/lost-found/[id]",
                    params: { id: item.id },
                  })
                }
                style={styles.card}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>{item.itemNumber}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.type}>{item.category}</Text>
                <Text style={styles.copy}>{item.description}</Text>
                <Text style={styles.meta}>
                  {item.locationFound} · {item.storageLocation ?? "No storage location"}
                </Text>
                <Text style={styles.meta}>
                  Found {formatRelativeTimestamp(item.foundDate)} by{" "}
                  {item.foundBy ?? "Unknown"}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No found items match the current search and filter.
            </Text>
          )}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          lostReportsQuery.isLoading
            ? "Loading lost reports"
            : `${filteredLostReports.length} reports visible`
        }
        title="Lost reports"
      >
        <View style={styles.list}>
          {filteredLostReports.length ? (
            filteredLostReports.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>{item.reportNumber}</Text>
                  <StatusBadge status={item.status ?? "archived"} />
                </View>
                <Text style={styles.type}>{item.category}</Text>
                <Text style={styles.copy}>{item.description}</Text>
                <Text style={styles.meta}>
                  {item.lastSeenLocation ?? "Unknown location"} ·{" "}
                  {item.reportedBy ?? item.reportedByContact ?? "Unknown reporter"}
                </Text>
                <Text style={styles.meta}>
                  Reported {formatRelativeTimestamp(item.date)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No lost reports match the current search.
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
