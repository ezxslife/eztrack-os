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
  useAllLocations,
  useCreateLocationMutation,
  useDeleteLocationMutation,
  useProperties,
  useUpdateLocationMutation,
} from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { useThemeTypography } from "@/theme";

export default function LocationsSettingsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography);
  const locationsQuery = useAllLocations();
  const propertiesQuery = useProperties();
  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();
  const deleteMutation = useDeleteLocationMutation();
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState("");
  const [parentId, setParentId] = useState("");

  const reset = () => {
    setSelectedId(null);
    setSelectedPropertyId("");
    setName("");
    setLocationType("");
    setParentId("");
  };

  const locations = locationsQuery.data ?? [];

  return (
    <ScreenContainer
      gutter="none"
      onRefresh={() => {
        void Promise.all([locationsQuery.refetch(), propertiesQuery.refetch()]);
      }}
      refreshing={locationsQuery.isRefetching || propertiesQuery.isRefetching}
      subtitle="Create, update, and retire locations across properties."
      title="Locations"
    >
      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title={selectedId ? "Edit location" : "New location"} />
        <GroupedCard>
          <View style={styles.stack}>
            <TextField label="Name" onChangeText={setName} value={name} />
            <TextField
              label="Location type"
              onChangeText={setLocationType}
              value={locationType}
            />
            <TextField
              label="Parent location id"
              onChangeText={setParentId}
              value={parentId}
            />
            <FilterChips
              onSelect={(value) => {
                const property = (propertiesQuery.data ?? []).find(
                  (item) => item.name === value
                );
                setSelectedPropertyId(property?.id ?? "");
              }}
              options={(propertiesQuery.data ?? []).map((property) => property.name)}
              selected={
                (propertiesQuery.data ?? []).find(
                  (property) => property.id === selectedPropertyId
                )?.name ?? ""
              }
            />
            <View style={styles.actions}>
              {selectedId ? (
                <Button label="Clear" onPress={reset} variant="secondary" />
              ) : null}
              <Button
                label={selectedId ? "Save Changes" : "Create Location"}
                loading={createMutation.isPending || updateMutation.isPending}
                onPress={() => {
                  const promise = selectedId
                    ? updateMutation.mutateAsync({
                        id: selectedId,
                        locationType,
                        name,
                        parentId: parentId || undefined,
                      })
                    : createMutation.mutateAsync({
                        locationType,
                        name,
                        parentId: parentId || undefined,
                        propertyId: selectedPropertyId,
                      });

                  void promise.then(() => {
                    reset();
                  });
                }}
              />
            </View>
          </View>
        </GroupedCard>
      </View>

      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title="Current locations" />
        <GroupedCard>
          {locations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, typography.footnote]}>
                No locations yet
              </Text>
            </View>
          ) : (
            locations.map((location, index) => (
              <View key={location.id}>
                <View style={styles.listItem}>
                  <Text style={[styles.title, typography.subheadline]}>
                    {location.name}
                  </Text>
                  <Text style={[styles.meta, typography.footnote]}>
                    {location.locationType ?? "Unspecified"} · property {location.propertyId}
                  </Text>
                  <Text style={[styles.meta, typography.footnote]}>
                    Parent {location.parentId ?? "None"}
                  </Text>
                  <View style={styles.actions}>
                    <Button
                      label="Edit"
                      onPress={() => {
                        setLocationType(location.locationType ?? "");
                        setName(location.name);
                        setParentId(location.parentId ?? "");
                        setSelectedId(location.id);
                        setSelectedPropertyId(location.propertyId);
                      }}
                      variant="secondary"
                    />
                    <Button
                      label="Delete"
                      loading={deleteMutation.isPending && deleteMutation.variables === location.id}
                      onPress={() => {
                        Alert.alert("Delete location", "Remove this location from active use?", [
                          { style: "cancel", text: "Cancel" },
                          {
                            style: "destructive",
                            text: "Delete",
                            onPress: () => {
                              void deleteMutation.mutateAsync(location.id);
                            },
                          },
                        ]);
                      }}
                      variant="plain"
                    />
                  </View>
                </View>
                {index < locations.length - 1 && <GroupedCardDivider />}
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
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
    },
    emptyText: {
      color: colors.textTertiary,
    },
    listItem: {
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    meta: {
      color: colors.textTertiary,
    },
    section: {
      gap: 12,
      paddingVertical: 14,
    },
    stack: {
      gap: 14,
    },
    title: {
      color: colors.textPrimary,
      fontWeight: "700",
    },
  });
}
