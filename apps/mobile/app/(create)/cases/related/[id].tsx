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
  useCreateCaseRelatedRecordMutation,
} from "@/lib/queries/cases";
import { useThemeColors } from "@/theme";

const recordTypes = ["incident", "dispatch", "patron", "lost_report", "found_item"];

export default function NewCaseRelatedRecordScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id ?? "";
  const detailQuery = useCaseDetail(caseId);
  const createMutation = useCreateCaseRelatedRecordMutation();
  const record = detailQuery.data;
  const [relatedRecordType, setRelatedRecordType] = useState("incident");
  const [relatedRecordId, setRelatedRecordId] = useState("");
  const [relationshipDescription, setRelationshipDescription] = useState("");

  const handleSubmit = async () => {
    if (!record) {
      return;
    }

    if (!relatedRecordId.trim()) {
      Alert.alert("Record required", "Add the related record ID before linking it.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        caseId: record.id,
        relatedRecordId: relatedRecordId.trim(),
        relatedRecordType,
        relationshipDescription: relationshipDescription.trim() || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Link failed",
        error instanceof Error ? error.message : "Could not link the related record."
      );
    }
  };

  if (!record) {
    return (
      <ScreenContainer subtitle="Loading case" title="Link Record">
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
          <Text style={styles.heroTitle}>Link Related Record</Text>
          <Text style={styles.heroCopy}>
            Connect incidents, dispatches, and recovery records to this case.
          </Text>
        </MaterialSurface>
      }
      subtitle={record.recordNumber}
      title="Related Record"
    >
      <SectionCard title="Record type">
        <FilterChips
          onSelect={setRelatedRecordType}
          options={recordTypes}
          selected={relatedRecordType}
        />
      </SectionCard>

      <SectionCard title="Link details">
        <View style={styles.stack}>
          <TextField
            label="Related record ID"
            onChangeText={setRelatedRecordId}
            value={relatedRecordId}
          />
          <TextField
            label="Relationship"
            multiline
            onChangeText={setRelationshipDescription}
            value={relationshipDescription}
          />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Link Record"
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
