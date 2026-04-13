import { useRouter, Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderCancelButton, HeaderSaveButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useLocations } from "@/lib/queries/locations";
import { useCreateFoundItemMutation } from "@/lib/queries/lost-found";
import { useThemeColors } from "@/theme";

const categories = ["electronics", "bag", "keys", "documents", "clothing", "other"];

export default function NewFoundItemScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const createMutation = useCreateFoundItemMutation();
  const locationsQuery = useLocations();
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [foundBy, setFoundBy] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState("");

  const selectedLocation = useMemo(
    () =>
      (locationsQuery.data ?? []).find((location) => location.name === selectedLocationName) ??
      null,
    [locationsQuery.data, selectedLocationName]
  );

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert("Description required", "Describe the found item before saving.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        category,
        description: description.trim(),
        foundBy: foundBy || undefined,
        foundLocationId: selectedLocation?.id ?? null,
        notes: notes || undefined,
        storageLocation: storageLocation || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not create the found item."
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{
        headerLeft: () => (
          <HeaderCancelButton onPress={() => router.back()} />
        ),
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderSaveButton
              loading={createMutation.isPending}
              onPress={() => {
                void handleSave();
              }}
            />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Found Item</Text>
          <Text style={styles.heroCopy}>
            Add real found inventory from the field instead of routing operators back to web.
          </Text>
        </MaterialSurface>
      }
      subtitle="Create a live found-item record."
      title="New Found Item"
    >
      <SectionCard title="Category">
        <FilterChips onSelect={setCategory} options={categories} selected={category} />
      </SectionCard>

      <SectionCard title="Item">
        <View style={styles.stack}>
          <TextField label="Description" multiline onChangeText={setDescription} value={description} />
          <FilterChips
            onSelect={setSelectedLocationName}
            options={(locationsQuery.data ?? []).map((location) => location.name)}
            selected={selectedLocationName}
          />
          <TextField label="Found by" onChangeText={setFoundBy} value={foundBy} />
          <TextField label="Storage location" onChangeText={setStorageLocation} value={storageLocation} />
          <TextField label="Notes" multiline onChangeText={setNotes} value={notes} />
          <View style={styles.actions} />
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    hero: { gap: 8 },
    heroCopy: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    heroTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
    stack: { gap: 16 },
  });
}
