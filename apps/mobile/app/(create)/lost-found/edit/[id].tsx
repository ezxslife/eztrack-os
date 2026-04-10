import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useLocations } from "@/lib/queries/locations";
import {
  useFoundItemDetail,
  useUpdateFoundItemMutation,
} from "@/lib/queries/lost-found";
import { useThemeColors } from "@/theme";

const categories = ["electronics", "bag", "keys", "documents", "clothing", "other"];

export default function EditFoundItemScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = params.id ?? "";
  const detailQuery = useFoundItemDetail(itemId);
  const updateMutation = useUpdateFoundItemMutation(itemId);
  const locationsQuery = useLocations();
  const item = detailQuery.data;
  const [bootstrapped, setBootstrapped] = useState(false);
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [foundBy, setFoundBy] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState("");

  useEffect(() => {
    if (!item || bootstrapped) {
      return;
    }

    setCategory(item.category);
    setDescription(item.description);
    setFoundBy(item.foundBy ?? "");
    setStorageLocation(item.storageLocation ?? "");
    setNotes(item.notes ?? "");
    setSelectedLocationName(item.foundLocation?.name ?? "");
    setBootstrapped(true);
  }, [bootstrapped, item]);

  const selectedLocation = useMemo(
    () =>
      (locationsQuery.data ?? []).find((location) => location.name === selectedLocationName) ??
      null,
    [locationsQuery.data, selectedLocationName]
  );

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
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
        "Save failed",
        error instanceof Error ? error.message : "Could not update the found item."
      );
    }
  };

  if (!item) {
    return (
      <ScreenContainer subtitle="Loading found item" title="Edit Found Item">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The found item is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Found Item</Text>
          <Text style={styles.heroCopy}>
            Update found-item category, location, and note context from mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle={item.recordNumber}
      title="Found Item Update"
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
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Save Item"
              loading={updateMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
            />
          </View>
        </View>
      </SectionCard>
    </ScreenContainer>
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
