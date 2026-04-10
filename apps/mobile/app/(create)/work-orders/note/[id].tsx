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
import { useAppendWorkOrderNoteMutation } from "@/lib/queries/work-orders";
import { useThemeColors } from "@/theme";

export default function AddWorkOrderNoteScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const workOrderId = params.id ?? "";
  const noteMutation = useAppendWorkOrderNoteMutation(workOrderId);
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!note.trim()) {
      Alert.alert("Note required", "Write the operational note before saving.");
      return;
    }

    try {
      await noteMutation.mutateAsync(note.trim());
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not append the work order note."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Add Work Order Note</Text>
          <Text style={styles.heroCopy}>
            Notes append to the live work order record so the mobile action is not a dead end.
          </Text>
        </MaterialSurface>
      }
      subtitle="Add an operational note."
      title="Work Order Note"
    >
      <SectionCard title="Note">
        <View style={styles.stack}>
          <TextField label="Note" multiline onChangeText={setNote} value={note} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Save Note"
              loading={noteMutation.isPending}
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
