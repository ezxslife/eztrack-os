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
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useCaseDetail,
  useCreateCaseNarrativeMutation,
} from "@/lib/queries/cases";
import { useThemeColors } from "@/theme";

export default function NewCaseNarrativeScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id ?? "";
  const detailQuery = useCaseDetail(caseId);
  const createMutation = useCreateCaseNarrativeMutation();
  const record = detailQuery.data;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!record) {
      return;
    }

    if (!content.trim()) {
      Alert.alert("Content required", "Add the narrative content before saving.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        caseId: record.id,
        content: content.trim(),
        title: title.trim() || "Narrative",
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not add the narrative."
      );
    }
  };

  if (!record) {
    return (
      <ScreenContainer subtitle="Loading case" title="Add Narrative">
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
          <Text style={styles.heroTitle}>Add Narrative</Text>
          <Text style={styles.heroCopy}>
            Append a real investigation note directly to the case record.
          </Text>
        </MaterialSurface>
      }
      subtitle={record.recordNumber}
      title="Case Narrative"
    >
      <SectionCard title="Narrative">
        <View style={styles.stack}>
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField label="Content" multiline onChangeText={setContent} value={content} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Add Narrative"
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
