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
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useCreateDropdownValueMutation,
  useDeleteDropdownValueMutation,
  useDropdownCategories,
} from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";

export default function DropdownsSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const categoriesQuery = useDropdownCategories();
  const createMutation = useCreateDropdownValueMutation();
  const deleteMutation = useDeleteDropdownValueMutation();
  const categories = categoriesQuery.data ?? [];
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");

  return (
    <ScreenContainer
      onRefresh={() => {
        void categoriesQuery.refetch();
      }}
      refreshing={categoriesQuery.isRefetching}
      subtitle="Real dropdown value management using the shared categories and values tables."
      title="Dropdowns"
    >
      <SectionCard title="New dropdown value">
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
      </SectionCard>

      <SectionCard
        subtitle={categoriesQuery.isLoading ? "Loading categories" : `${categories.length} categories`}
        title="Categories"
      >
        <View style={styles.stack}>
          {categories.map((category) => (
            <View key={category.id} style={styles.row}>
              <Text style={styles.title}>{category.name}</Text>
              <Text style={styles.meta}>{category.description ?? "No description"}</Text>
              {category.values.map((value) => (
                <View key={value.id} style={styles.valueRow}>
                  <Text style={styles.valueText}>{value.displayLabel}</Text>
                  <Button
                    label="Delete"
                    loading={deleteMutation.isPending && deleteMutation.variables === value.id}
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
              ))}
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 8,
      padding: 14,
    },
    stack: {
      gap: 14,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    valueRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    valueText: {
      color: colors.textSecondary,
      flex: 1,
      fontSize: 14,
    },
  });
}
