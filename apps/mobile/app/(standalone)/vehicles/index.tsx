import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SearchField } from "@/components/ui/SearchField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
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
  const styles = createStyles(colors, typography, layout);

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
      gutter="none"
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void vehiclesQuery.refetch();
      }}
      refreshing={vehiclesQuery.isRefetching}
      subtitle="Vehicle registry for staff, vendors, and assets."
      title="Vehicles"
    >
      <View style={styles.section}>
        <SectionHeader title="Vehicle registry" />
        {filtered.length ? (
          <GroupedCard>
            {filtered.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={item.plate ?? "No Plate"}
                  onPress={() =>
                    router.push({
                      pathname: "/vehicles/[id]",
                      params: { id: item.id },
                    })
                  }
                  subtitle={[
                    `${item.year ? `${item.year} ` : ""}${item.make} ${item.model}`.trim(),
                    item.type,
                    `${item.color ?? "Unknown color"} · ${item.ownerType ?? "Unknown owner"}`,
                  ].join(" · ")}
                />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>
              No vehicles match the current search.
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
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
      borderRadius: 18,
      borderWidth: 1,
      marginHorizontal: layout.horizontalPadding,
      padding: 16,
    },
    searchField: {
      width: "100%",
    },
    section: {
      gap: 8,
    },
  });
}
