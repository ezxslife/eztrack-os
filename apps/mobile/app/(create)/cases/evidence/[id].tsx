import { useLocalSearchParams, useRouter } from "expo-router";
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
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useCaseDetail,
  useCreateCaseEvidenceMutation,
} from "@/lib/queries/cases";
import { useThemeColors } from "@/theme";

const evidenceTypes = ["physical", "digital", "document", "video", "photo", "other"];
const evidenceStatuses = ["collected", "stored", "submitted", "released"];

export default function NewCaseEvidenceScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id ?? "";
  const detailQuery = useCaseDetail(caseId);
  const createMutation = useCreateCaseEvidenceMutation();
  const record = detailQuery.data;
  const [title, setTitle] = useState("");
  const [type, setType] = useState("physical");
  const [status, setStatus] = useState("collected");
  const [itemNumber, setItemNumber] = useState("");
  const [externalIdentifier, setExternalIdentifier] = useState("");
  const [storageFacility, setStorageFacility] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!record) {
      return;
    }

    if (!title.trim()) {
      Alert.alert("Title required", "Add a title before saving the evidence item.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        caseId: record.id,
        description: description.trim() || undefined,
        externalIdentifier: externalIdentifier.trim() || undefined,
        itemNumber: itemNumber.trim() || undefined,
        status,
        storageFacility: storageFacility.trim() || undefined,
        storageLocation: storageLocation.trim() || undefined,
        title: title.trim(),
        type,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not add the evidence item."
      );
    }
  };

  if (!record) {
    return (
      <ScreenContainer subtitle="Loading case" title="Add Evidence">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The case is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={78} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Add Evidence</Text>
          <Text style={styles.heroCopy}>
            Record physical or digital evidence directly against this case.
          </Text>
        </MaterialSurface>
      }
      subtitle={record.recordNumber}
      title="Case Evidence"
    >
      <SectionCard title="Evidence type">
        <View style={styles.stack}>
          <FilterChips onSelect={setType} options={evidenceTypes} selected={type} />
          <FilterChips onSelect={setStatus} options={evidenceStatuses} selected={status} />
        </View>
      </SectionCard>

      <SectionCard title="Evidence record">
        <View style={styles.stack}>
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField label="Item number" onChangeText={setItemNumber} value={itemNumber} />
          <TextField
            label="External identifier"
            onChangeText={setExternalIdentifier}
            value={externalIdentifier}
          />
          <TextField
            label="Storage facility"
            onChangeText={setStorageFacility}
            value={storageFacility}
          />
          <TextField
            label="Storage location"
            onChangeText={setStorageLocation}
            value={storageLocation}
          />
          <TextField
            label="Description"
            multiline
            onChangeText={setDescription}
            value={description}
          />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Add Evidence"
              loading={createMutation.isPending}
              onPress={handleSubmit}
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
