import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useCreatePropertyMutation,
  useDeletePropertyMutation,
  useProperties,
  useUpdatePropertyMutation,
} from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";

export default function PropertiesSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const propertiesQuery = useProperties();
  const createMutation = useCreatePropertyMutation();
  const updateMutation = useUpdatePropertyMutation();
  const deleteMutation = useDeletePropertyMutation();
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const reset = () => {
    setSelectedId(null);
    setName("");
    setAddress("");
    setPropertyType("");
  };

  return (
    <ScreenContainer
      onRefresh={() => {
        void propertiesQuery.refetch();
      }}
      refreshing={propertiesQuery.isRefetching}
      subtitle="Create, update, and retire properties from mobile."
      title="Properties"
    >
      <SectionCard title={selectedId ? "Edit property" : "New property"}>
        <View style={styles.stack}>
          <TextField label="Name" onChangeText={setName} value={name} />
          <TextField label="Address" onChangeText={setAddress} value={address} />
          <TextField
            label="Property type"
            onChangeText={setPropertyType}
            value={propertyType}
          />
          <View style={styles.actions}>
            {selectedId ? (
              <Button
                label="Clear"
                onPress={reset}
                variant="secondary"
              />
            ) : null}
            <Button
              label={selectedId ? "Save Changes" : "Create Property"}
              loading={createMutation.isPending || updateMutation.isPending}
              onPress={() => {
                const promise = selectedId
                  ? updateMutation.mutateAsync({
                      address,
                      id: selectedId,
                      name,
                      propertyType,
                    })
                  : createMutation.mutateAsync({
                      address,
                      name,
                      propertyType,
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
        subtitle={propertiesQuery.isLoading ? "Loading properties" : `${(propertiesQuery.data ?? []).length} properties`}
        title="Current properties"
      >
        <View style={styles.stack}>
          {(propertiesQuery.data ?? []).map((property) => (
            <View key={property.id} style={styles.row}>
              <Text style={styles.title}>{property.name}</Text>
              <Text style={styles.meta}>
                {property.propertyType ?? "Unspecified"} · {property.status}
              </Text>
              <Text style={styles.meta}>{property.address ?? "No address"}</Text>
              <View style={styles.actions}>
                <Button
                  label="Edit"
                  onPress={() => {
                    setAddress(property.address ?? "");
                    setName(property.name);
                    setPropertyType(property.propertyType ?? "");
                    setSelectedId(property.id);
                  }}
                  variant="secondary"
                />
                <Button
                  label="Delete"
                  loading={deleteMutation.isPending && deleteMutation.variables === property.id}
                  onPress={() => {
                    Alert.alert("Delete property", "Remove this property from active use?", [
                      { style: "cancel", text: "Cancel" },
                      {
                        style: "destructive",
                        text: "Delete",
                        onPress: () => {
                          void deleteMutation.mutateAsync(property.id);
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
