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
  useAllLocations,
  useCreateLocationMutation,
  useDeleteLocationMutation,
  useProperties,
  useUpdateLocationMutation,
} from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";

export default function LocationsSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
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

  return (
    <ScreenContainer
      onRefresh={() => {
        void Promise.all([locationsQuery.refetch(), propertiesQuery.refetch()]);
      }}
      refreshing={locationsQuery.isRefetching || propertiesQuery.isRefetching}
      subtitle="Create, update, and retire locations across properties."
      title="Locations"
    >
      <SectionCard title={selectedId ? "Edit location" : "New location"}>
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
      </SectionCard>

      <SectionCard
        subtitle={locationsQuery.isLoading ? "Loading locations" : `${(locationsQuery.data ?? []).length} locations`}
        title="Current locations"
      >
        <View style={styles.stack}>
          {(locationsQuery.data ?? []).map((location) => (
            <View key={location.id} style={styles.row}>
              <Text style={styles.title}>{location.name}</Text>
              <Text style={styles.meta}>
                {location.locationType ?? "Unspecified"} · property {location.propertyId}
              </Text>
              <Text style={styles.meta}>Parent {location.parentId ?? "None"}</Text>
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
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
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
  });
}
