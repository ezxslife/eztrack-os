import { useRouter, Stack } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { usePatrons } from "@/lib/queries/secondary-modules";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { HeaderSearchButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";

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
  const styles = createStyles(colors, typography, layout);

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
        gutter="none"
        nativeHeader
        onRefresh={() => {
          void patronsQuery.refetch();
        }}
        refreshing={patronsQuery.isRefetching}
        subtitle="Patron watch states and contact context."
        title="Patrons"
      >
      <View style={styles.section}>
        <SectionHeader title="Patron register" />
        {filtered.length ? (
          <GroupedCard>
            {filtered.map((patron, index) => (
              <View key={patron.id}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={`${patron.firstName} ${patron.lastName}`.trim() || "Unnamed patron"}
                  onPress={() =>
                    router.push({
                      pathname: "/patrons/[id]",
                      params: { id: patron.id },
                    })
                  }
                  subtitle={[
                    patron.notes ?? patron.email ?? patron.phone ?? "No notes or contact details recorded.",
                    [patron.email, patron.phone].filter(Boolean).join(" · ") ||
                      "No contact info",
                    `Added ${formatRelativeTimestamp(patron.createdAt)}`,
                  ].join(" · ")}
                  trailing={
                    <StatusBadge
                      status={patron.flag === "none" ? "archived" : patron.flag}
                    />
                  }
                />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>
              No patrons match the current search and filter.
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
