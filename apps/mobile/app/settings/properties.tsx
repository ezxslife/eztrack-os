import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import {
  useCreatePropertyMutation,
  useDeletePropertyMutation,
  useProperties,
  useUpdatePropertyMutation,
} from "@/lib/queries/settings";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function PropertiesSettingsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography);
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
      gutter="none"
      onRefresh={() => {
        void propertiesQuery.refetch();
      }}
      refreshing={propertiesQuery.isRefetching}
      subtitle="Create, update, and retire properties from mobile."
      title="Properties"
    >
      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title={selectedId ? "Edit property" : "New property"} />
        <GroupedCard>
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
        </GroupedCard>
      </View>

      <View style={[styles.section, { paddingHorizontal: layout.horizontalPadding }]}>
        <SectionHeader title="Current properties" />
        <GroupedCard>
          {(propertiesQuery.data ?? []).map((property, index) => (
            <View key={property.id}>
              <View style={styles.row}>
                <Text style={[styles.title, typography.subheadline]}>{property.name}</Text>
                <Text style={[styles.meta, typography.footnote]}>
                  {property.propertyType ?? "Unspecified"} · {property.status}
                </Text>
                <Text style={[styles.meta, typography.footnote]}>{property.address ?? "No address"}</Text>
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
              {index < (propertiesQuery.data ?? []).length - 1 && <GroupedCardDivider />}
            </View>
          ))}
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
    meta: {
      color: colors.textTertiary,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      gap: 6,
      padding: 14,
    },
    section: {
      gap: 16,
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
