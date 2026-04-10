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
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useBriefingDetail,
  useUpdateBriefingMutation,
} from "@/lib/queries/briefings";
import { useThemeColors } from "@/theme";

const priorities = ["high", "medium", "low"];

export default function EditBriefingScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const briefingId = params.id ?? "";
  const detailQuery = useBriefingDetail(briefingId);
  const updateMutation = useUpdateBriefingMutation(briefingId);
  const briefing = detailQuery.data;
  const [bootstrapped, setBootstrapped] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [linkUrl, setLinkUrl] = useState("");
  const [sourceModule, setSourceModule] = useState("");

  useEffect(() => {
    if (!briefing || bootstrapped) {
      return;
    }

    setTitle(briefing.title);
    setContent(briefing.content);
    setPriority(briefing.priority);
    setLinkUrl(briefing.linkUrl ?? "");
    setSourceModule(briefing.sourceModule ?? "");
    setBootstrapped(true);
  }, [bootstrapped, briefing]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Required fields", "Title and content are required.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        content: content.trim(),
        linkUrl: linkUrl || undefined,
        priority,
        sourceModule: sourceModule || undefined,
        title: title.trim(),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not update the briefing."
      );
    }
  };

  if (!briefing) {
    return (
      <ScreenContainer subtitle="Loading briefing" title="Edit Briefing">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The briefing is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Briefing</Text>
          <Text style={styles.heroCopy}>
            Update title, content, and linked context without leaving mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle={briefing.priority}
      title="Briefing Update"
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
              label="Save Briefing"
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
