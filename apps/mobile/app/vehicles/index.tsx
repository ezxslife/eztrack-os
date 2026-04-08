import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { useVehicles } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors } from "@/theme";

const moduleKey = "vehicles";

export default function VehiclesScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const vehiclesQuery = useVehicles();
  const rows = vehiclesQuery.data ?? [];
  const filtersState = useFilterStore(
    (state) => state.filters[moduleKey] ?? defaultFilterState
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const query = filtersState.search;

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
        <SearchField
          onChangeText={(value) => setFilter(moduleKey, { search: value })}
          placeholder="Search plate, make, model, type, or owner"
          value={query}
        />
      }
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
              <View key={item.id} style={styles.card}>
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
              </View>
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

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: 14,
    },
    copy: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
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
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
    },
  });
}
