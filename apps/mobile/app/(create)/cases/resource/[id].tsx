import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useCreateCaseResourceMutation } from "@/lib/queries/cases";
import { useThemeColors } from "@/theme";

function NewCaseResourceContent({ caseId }: { caseId: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const createMutation = useCreateCaseResourceMutation();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [alias, setAlias] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Add a resource name before saving.");
      return;
    }

    if (!role.trim()) {
      Alert.alert("Role required", "Add a role before saving.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        alias: alias.trim() || undefined,
        caseId,
        hourlyRate: hourlyRate.trim() ? Number(hourlyRate) : undefined,
        name: name.trim(),
        notes: notes.trim() || undefined,
        role: role.trim(),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not add the case resource."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Add Case Resource</Text>
          <Text style={styles.heroCopy}>
            Create a live case resource entry tied directly to the selected case.
          </Text>
        </MaterialSurface>
      }
      subtitle="Add a real case resource."
      title="New Resource"
    >
      <SectionCard title="Resource details">
        <View style={styles.stack}>
          <TextField label="Name" onChangeText={setName} value={name} />
          <TextField label="Role" onChangeText={setRole} value={role} />
          <TextField label="Alias" onChangeText={setAlias} value={alias} />
          <TextField
            keyboardType="numeric"
            label="Hourly rate"
            onChangeText={setHourlyRate}
            placeholder="125"
            value={hourlyRate}
          />
          <TextField
            label="Notes"
            multiline
            onChangeText={setNotes}
            value={notes}
          />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Add Resource"
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

export default function NewCaseResourceScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id ?? "";

  return (
    <RequireLiveSession
      detail="Case resource creation stays live-only until preview-safe mutations exist."
      title="New Resource"
    >
      <NewCaseResourceContent caseId={caseId} />
    </RequireLiveSession>
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
