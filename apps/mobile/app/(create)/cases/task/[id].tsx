import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
  useCreateCaseTaskMutation,
} from "@/lib/queries/cases";
import { useOrgUsers } from "@/lib/queries/settings";
import { useThemeColors } from "@/theme";

const priorities = ["low", "medium", "high"];

export default function NewCaseTaskScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id ?? "";
  const detailQuery = useCaseDetail(caseId);
  const usersQuery = useOrgUsers();
  const createMutation = useCreateCaseTaskMutation();
  const record = detailQuery.data;
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [selectedAssignee, setSelectedAssignee] = useState("Unassigned");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const selectedUser = useMemo(
    () =>
      selectedAssignee === "Unassigned"
        ? null
        : (usersQuery.data ?? []).find((user) => user.fullName === selectedAssignee) ?? null,
    [selectedAssignee, usersQuery.data]
  );

  const handleSubmit = async () => {
    if (!record) {
      return;
    }

    if (!title.trim()) {
      Alert.alert("Title required", "Add a task title before saving.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        assignedTo: selectedUser?.id ?? null,
        caseId: record.id,
        description: description.trim() || undefined,
        dueDate: dueDate.trim() || undefined,
        priority,
        title: title.trim(),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not create the task."
      );
    }
  };

  if (!record) {
    return (
      <ScreenContainer subtitle="Loading case" title="Add Task">
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
          <Text style={styles.heroTitle}>Add Task</Text>
          <Text style={styles.heroCopy}>
            Track investigation work without leaving the case workflow.
          </Text>
        </MaterialSurface>
      }
      subtitle={record.recordNumber}
      title="Case Task"
    >
      <SectionCard title="Priority">
        <FilterChips onSelect={setPriority} options={priorities} selected={priority} />
      </SectionCard>

      <SectionCard title="Assignment">
        <View style={styles.stack}>
          <FilterChips
            onSelect={setSelectedAssignee}
            options={["Unassigned", ...(usersQuery.data ?? []).map((user) => user.fullName)]}
            selected={selectedAssignee}
          />
          <TextField
            label="Due date"
            onChangeText={setDueDate}
            placeholder="2026-04-08T18:00:00Z"
            value={dueDate}
          />
        </View>
      </SectionCard>

      <SectionCard title="Task details">
        <View style={styles.stack}>
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField
            label="Description"
            multiline
            onChangeText={setDescription}
            value={description}
          />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Create Task"
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
