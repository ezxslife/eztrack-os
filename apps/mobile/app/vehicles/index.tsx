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
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { useVehicles } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const moduleKey = "vehicles";

export default function VehiclesScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const vehiclesQuery = useVehicles();
  const rows = vehiclesQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;
  const { nativeIOSHeader } = useIOSNativeSearchHeader({
    placeholder: "Search plate, make, model, type, or owner",
    query,
    setQuery: (value) => setFilter(moduleKey, { search: value }),
    title: "Vehicles",
  });
  const styles = createStyles(colors, layout, typography);

  const filtered = useMemo(
    () =>
      rows.filter((item) =>
        [
          item.plate,
          item.make,
          item.model,
          item.type,
          item.ownerType,
          item.color,
          item.year,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [rows, query]
  );

  return (
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          {!nativeIOSHeader ? (
            <SearchField
              onChangeText={(value) => setFilter(moduleKey, { search: value })}
              placeholder="Search plate, make, model, type, or owner"
              style={styles.searchField}
              value={query}
            />
          ) : null}
          <Button
            label="New Vehicle"
            onPress={() => router.push("/vehicles/new")}
            variant="secondary"
          />
        </View>
      }
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void vehiclesQuery.refetch();
      }}
      refreshing={vehiclesQuery.isRefetching}
      subtitle="Vehicle registry for staff, vendors, and operational assets."
      title="Vehicles"
    >
      <SectionCard
        subtitle={
          vehiclesQuery.isLoading
            ? "Loading vehicle registry"
            : `${filtered.length} vehicles visible`
        }
        title="Vehicle registry"
      >
        <View style={styles.list}>
          {filtered.length ? (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/vehicles/[id]",
                    params: { id: item.id },
                  })
                }
                style={styles.card}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>
                    {item.plate ?? "No Plate"}
                  </Text>
                  <Text style={styles.type}>{item.type}</Text>
                </View>
                <Text style={styles.copy}>
                  {item.year ? `${item.year} ` : ""}{item.make} {item.model}
                </Text>
                <Text style={styles.meta}>
                  {item.color ?? "Unknown color"} · {item.ownerType ?? "Unknown owner"}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              No vehicles match the current search.
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
      gap: 6,
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
      ...typography.caption1,
      color: colors.accent,
      fontWeight: "700",
      textTransform: "uppercase",
    },
  });
}
