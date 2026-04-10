import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useEffect,
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
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useCreateIncidentNarrativeMutation,
  useIncidentDetail,
} from "@/lib/queries/incidents";
import {
  getDraftKey,
  useDraftStore,
} from "@/stores/draft-store";
import { useThemeColors } from "@/theme";

const draftModuleKey = "incident-narrative";

export default function NewIncidentNarrativeScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const draftKey = getDraftKey(draftModuleKey, incidentId);
  const savedDraft = useDraftStore(
    (state) =>
      state.drafts[draftKey]?.data as
        | {
            content?: string;
            title?: string;
          }
        | undefined
  );
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const saveDraft = useDraftStore((state) => state.saveDraft);
  const detailQuery = useIncidentDetail(incidentId);
  const createNarrativeMutation = useCreateIncidentNarrativeMutation();
  const [title, setTitle] = useState(savedDraft?.title ?? "");
  const [content, setContent] = useState(savedDraft?.content ?? "");

  useEffect(() => {
    if (!title.trim() && !content.trim()) {
      deleteDraft(draftKey);
      return;
    }

    saveDraft(
      draftModuleKey,
      {
        content,
        title,
      },
      incidentId
    );
  }, [content, deleteDraft, draftKey, incidentId, saveDraft, title]);

  const incident = detailQuery.data;

  const handleSubmit = async () => {
    if (!incident) {
      return;
    }

    if (!content.trim()) {
      Alert.alert(
        "Narrative required",
        "Add the narrative content before saving."
      );
      return;
    }

    try {
      const result = await createNarrativeMutation.mutateAsync({
        content: content.trim(),
        incidentId: incident.id,
        incidentRecordNumber: incident.recordNumber,
        title: title.trim() || undefined,
      });
      deleteDraft(draftKey);
      Alert.alert(
        result.queued ? "Queued Offline" : "Saved",
        result.queued
          ? "The narrative entry is stored locally and will sync when connectivity returns."
          : "The narrative entry has been added."
      );
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error
          ? error.message
          : "Could not add the narrative."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Add Narrative">
        <SectionCard title="Loading">
          <Text style={styles.helper}>The incident is still loading.</Text>
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
            Capture chronology while it is still fresh. This route stays narrow on purpose.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Narrative Entry"
    >
      <SectionCard title="Narrative">
        <View style={styles.stack}>
          <TextField
            label="Title"
            onChangeText={setTitle}
            placeholder="Optional title"
            value={title}
          />
          <TextField
            label="Content"
            multiline
            numberOfLines={6}
            onChangeText={setContent}
            placeholder="Describe what happened..."
            value={content}
          />
          <View style={styles.actions}>
            <Button
              label="Cancel"
              onPress={() => router.back()}
              variant="secondary"
            />
            <Button
              label="Add Entry"
              loading={createNarrativeMutation.isPending}
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
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    helper: {
      color: colors.textTertiary,
      fontSize: 14,
      lineHeight: 20,
    },
    hero: {
      gap: 8,
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "700",
    },
    stack: {
      gap: 16,
    },
  });
}
