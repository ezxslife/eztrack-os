import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useEffect,
  useMemo,
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
import { useLocations } from "@/lib/queries/locations";
import { useOrgUsers } from "@/lib/queries/settings";
import {
  useUpdateWorkOrderMutation,
  useWorkOrderDetail,
} from "@/lib/queries/work-orders";
import { useThemeColors } from "@/theme";

const priorities = ["critical", "high", "medium", "low"];
const categories = ["security", "maintenance", "electrical", "plumbing", "general"];

export default function EditWorkOrderScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const workOrderId = params.id ?? "";
  const detailQuery = useWorkOrderDetail(workOrderId);
  const updateMutation = useUpdateWorkOrderMutation(workOrderId);
  const locationsQuery = useLocations();
  const usersQuery = useOrgUsers();
  const workOrder = detailQuery.data;
  const [bootstrapped, setBootstrapped] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("Unassigned");

  useEffect(() => {
    if (!workOrder || bootstrapped) {
      return;
    }

    setTitle(workOrder.title);
    setDescription(workOrder.description ?? "");
    setCategory(workOrder.category);
    setPriority(workOrder.priority);
    setDueDate(workOrder.dueDate ?? "");
    setScheduledDate(workOrder.scheduledDate ?? "");
    setEstimatedCost(
      workOrder.estimatedCost === null ? "" : String(workOrder.estimatedCost)
    );
    setSelectedLocationName(workOrder.location?.name ?? "");
    setSelectedAssignee(workOrder.assignedStaff?.fullName ?? "Unassigned");
    setBootstrapped(true);
  }, [bootstrapped, workOrder]);

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Add a title before saving the work order.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
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
        "Save failed",
        error instanceof Error ? error.message : "Could not update the work order."
      );
    }
  };

  if (!workOrder) {
    return (
      <ScreenContainer subtitle="Loading work order" title="Edit Work Order">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The work order is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Work Order</Text>
          <Text style={styles.heroCopy}>
            Update assignment, scheduling, and cost without leaving the mobile workflow.
          </Text>
        </MaterialSurface>
      }
      subtitle={workOrder.recordNumber}
      title="Work Order Update"
    >
      <SectionCard title="Details">
        <View style={styles.stack}>
          <TextField label="Title" onChangeText={setTitle} value={title} />
          <TextField label="Description" multiline onChangeText={setDescription} value={description} />
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
          <TextField label="Due date" onChangeText={setDueDate} value={dueDate} />
          <TextField label="Scheduled date" onChangeText={setScheduledDate} value={scheduledDate} />
          <TextField label="Estimated cost" keyboardType="numeric" onChangeText={setEstimatedCost} value={estimatedCost} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Save Work Order"
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
