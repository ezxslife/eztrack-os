import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import {
  useCreateDropdownValueMutation,
  useDeleteDropdownValueMutation,
  useDropdownCategories,
} from "@/lib/queries/settings";
import { useAdaptiveLayout } from "@/theme/layout";
import { useThemeColors, useThemeTypography } from "@/theme";

export default function DropdownsSettingsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography);
  const categoriesQuery = useDropdownCategories();
  const createMutation = useCreateDropdownValueMutation();
  const deleteMutation = useDeleteDropdownValueMutation();
  const categories = categoriesQuery.data ?? [];
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");

  return (
    <ScreenContainer
      gutter="none"
      onRefresh={() => {
        void categoriesQuery.refetch();
      }}
      refreshing={categoriesQuery.isRefetching}
      subtitle="Real dropdown value management using the shared categories and values tables."
      title="Dropdowns"
    >
      {/* New dropdown value section */}
      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title="New dropdown value" />
        <GroupedCard>
          <View style={styles.stack}>
            <FilterChips
              onSelect={(value) => {
                const category = categories.find((item) => item.name === value);
                setSelectedCategoryId(category?.id ?? "");
              }}
              options={categories.map((category) => category.name)}
              selected={
                categories.find((category) => category.id === selectedCategoryId)?.name ?? ""
              }
            />
            <TextField
              label="Display label"
              onChangeText={setDisplayLabel}
              value={displayLabel}
            />
            <Button
              label="Create Value"
              loading={createMutation.isPending}
              onPress={() => {
                void createMutation
                  .mutateAsync({
                    categoryId: selectedCategoryId,
                    displayLabel,
                  })
                  .then(() => {
                    setDisplayLabel("");
                  });
              }}
            />
          </View>
        </GroupedCard>
      </View>

      {/* Categories section */}
      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title="Categories" />
        <GroupedCard>
          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No categories yet</Text>
            </View>
          ) : (
            categories.map((category, categoryIndex) => (
              <View key={category.id}>
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                  </View>
                  <Text style={styles.categoryMeta}>
                    {category.description ?? "No description"}
                  </Text>
                  {category.values.length === 0 ? (
                    <Text style={styles.noValuesText}>No values</Text>
                  ) : (
                    <View style={styles.valuesList}>
                      {category.values.map((value, valueIndex) => (
                        <View key={value.id}>
                          <View style={styles.valueRow}>
                            <Text style={styles.valueText}>{value.displayLabel}</Text>
                            <Button
                              label="Delete"
                              loading={
                                deleteMutation.isPending &&
                                deleteMutation.variables === value.id
                              }
                              onPress={() => {
                                Alert.alert("Delete value", "Remove this dropdown value?", [
                                  { style: "cancel", text: "Cancel" },
                                  {
                                    style: "destructive",
                                    text: "Delete",
                                    onPress: () => {
                                      void deleteMutation.mutateAsync(value.id);
                                    },
                                  },
                                ]);
                              }}
                              variant="plain"
                            />
                          </View>
                          {valueIndex < category.values.length - 1 && <GroupedCardDivider />}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {categoryIndex < categories.length - 1 && <GroupedCardDivider />}
              </View>
            ))
          )}
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
) {
  return StyleSheet.create({
    categoryContainer: {
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    categoryHeader: {
      marginBottom: 4,
    },
    categoryMeta: {
      color: colors.textTertiary,
      ...typography.footnote,
    },
    categoryTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    emptyState: {
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 24,
    },
    emptyText: {
      color: colors.textTertiary,
      ...typography.subheadline,
    },
    noValuesText: {
      color: colors.textTertiary,
      ...typography.footnote,
    },
    section: {
      gap: 12,
    },
    stack: {
      gap: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    valueRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    valuesList: {
      gap: 0,
      marginTop: 4,
    },
    valueText: {
      color: colors.textSecondary,
      flex: 1,
      ...typography.footnote,
    },
  });
}
