import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderCancelButton, HeaderSaveButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useLocations } from "@/lib/queries/locations";
import { useOrgUsers } from "@/lib/queries/settings";
import { useCreateWorkOrderMutation } from "@/lib/queries/work-orders";
import { useThemeColors } from "@/theme";

const priorities = ["critical", "high", "medium", "low"];
const categories = ["security", "maintenance", "electrical", "plumbing", "general"];

export default function NewWorkOrderScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    description?: string;
    title?: string;
  }>();
  const createMutation = useCreateWorkOrderMutation();
  const locationsQuery = useLocations();
  const usersQuery = useOrgUsers();
  const [title, setTitle] = useState(params.title ?? "");
  const [description, setDescription] = useState(params.description ?? "");
  const [category, setCategory] = useState(params.category ?? "general");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("Unassigned");

  const selectedLocation = useMemo(
    () =>
      (locationsQuery.data ?? []).find((location) => location.name === selectedLocationName) ??
      null,
    [locationsQuery.data, selectedLocationName]
  );
  const selectedUser = useMemo(
    () =>
      selectedAssignee === "Unassigned"
        ? null
        : (usersQuery.data ?? []).find((user) => user.fullName === selectedAssignee) ?? null,
    [selectedAssignee, usersQuery.data]
  );

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Add a title before creating the work order.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        assignedTo: selectedUser?.id ?? null,
        category,
        description: description || undefined,
        dueDate: dueDate || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        locationId: selectedLocation?.id ?? null,
        priority,
        scheduledDate: scheduledDate || undefined,
        title: title.trim(),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "Could not create the work order."
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{
        headerLeft: () => (
          <HeaderCancelButton onPress={() => router.back()} />
        ),
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderSaveButton
              loading={createMutation.isPending}
              onPress={() => {
                void handleSave();
              }}
            />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Work Order</Text>
          <Text style={styles.heroCopy}>
            Facilities and safety tasks now create directly from mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle="Create a live work order."
      title="New Work Order"
    >
      <SectionCard title="Details">
        <View style={styles.stack}>
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField
            label="Description"
            multiline
            onChangeText={setDescription}
            value={description}
          />
        </View>
      </SectionCard>

      <SectionCard title="Category and priority">
        <View style={styles.stack}>
          <FilterChips onSelect={setCategory} options={categories} selected={category} />
          <FilterChips onSelect={setPriority} options={priorities} selected={priority} />
        </View>
      </SectionCard>

      <SectionCard title="Assignment">
        <View style={styles.stack}>
          <FilterChips
            onSelect={setSelectedLocationName}
            options={(locationsQuery.data ?? []).map((location) => location.name)}
            selected={selectedLocationName}
          />
          <FilterChips
            onSelect={setSelectedAssignee}
            options={["Unassigned", ...(usersQuery.data ?? []).map((user) => user.fullName)]}
            selected={selectedAssignee}
          />
        </View>
      </SectionCard>

      <SectionCard title="Schedule">
        <View style={styles.stack}>
          <TextField label="Due date" onChangeText={setDueDate} placeholder="2026-04-08T18:00:00Z" value={dueDate} />
          <TextField label="Scheduled date" onChangeText={setScheduledDate} placeholder="2026-04-08T15:00:00Z" value={scheduledDate} />
          <TextField label="Estimated cost" keyboardType="numeric" onChangeText={setEstimatedCost} placeholder="125.00" value={estimatedCost} />
          <View style={styles.actions} />
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
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
