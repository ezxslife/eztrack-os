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
import { useCreateBriefingMutation } from "@/lib/queries/briefings";
import { useThemeColors } from "@/theme";

const priorities = ["high", "medium", "low"];

export default function NewBriefingScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{
    content?: string;
    sourceModule?: string;
    title?: string;
  }>();
  const createMutation = useCreateBriefingMutation();
  const [title, setTitle] = useState(params.title ?? "");
  const [content, setContent] = useState(params.content ?? "");
  const [priority, setPriority] = useState("medium");
  const [linkUrl, setLinkUrl] = useState("");
  const [sourceModule, setSourceModule] = useState(params.sourceModule ?? "");

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Required fields", "Title and content are required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        content: content.trim(),
        linkUrl: linkUrl || undefined,
        priority,
        sourceModule: sourceModule || undefined,
        title: title.trim(),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not create the briefing."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Briefing</Text>
          <Text style={styles.heroCopy}>
            Publish shift communication directly to the briefing feed.
          </Text>
        </MaterialSurface>
      }
      subtitle="Create a live briefing."
      title="New Briefing"
    >
      <SectionCard title="Priority">
        <FilterChips onSelect={setPriority} options={priorities} selected={priority} />
      </SectionCard>

      <SectionCard title="Briefing">
        <View style={styles.stack}>
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField label="Source module" onChangeText={setSourceModule} value={sourceModule} />
          <TextField label="Link URL" onChangeText={setLinkUrl} value={linkUrl} />
          <TextField label="Content" multiline onChangeText={setContent} value={content} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Create Briefing"
              loading={createMutation.isPending}
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
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    hero: { gap: 8 },
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
    stack: { gap: 16 },
  });
}
