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
import { useCreateDispatchMutation } from "@/lib/queries/dispatches";
import { useLocations } from "@/lib/queries/locations";
import { useThemeColors } from "@/theme";

const priorities = ["critical", "high", "medium", "low"];
const dispatchCodes = ["SEC", "MED", "C2", "OPS", "ALARM"];

export default function NewDispatchScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{
    description?: string;
    priority?: string;
    reporterName?: string;
  }>();
  const [dispatchCode, setDispatchCode] = useState("SEC");
  const [priority, setPriority] = useState(
    priorities.includes(params.priority ?? "") ? params.priority! : "high"
  );
  const [description, setDescription] = useState(params.description ?? "");
  const [sublocation, setSublocation] = useState("");
  const [reporterName, setReporterName] = useState(params.reporterName ?? "");
  const [reporterPhone, setReporterPhone] = useState("");
  const [callSource, setCallSource] = useState("radio");
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const locationsQuery = useLocations();
  const createMutation = useCreateDispatchMutation();
  const selectedLocation = useMemo(
    () =>
      (locationsQuery.data ?? []).find(
        (location) => location.name === selectedLocationName
      ) ?? null,
    [locationsQuery.data, selectedLocationName]
  );

  const handleSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert("Location required", "Select a location before creating the dispatch.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        callSource,
        description,
        dispatchCode,
        locationId: selectedLocation.id,
        priority: priority as any,
        reporterName: reporterName || undefined,
        reporterPhone: reporterPhone || undefined,
        sublocation: sublocation || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Create failed",
        error instanceof Error ? error.message : "The dispatch could not be created."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Create Dispatch</Text>
          <Text style={styles.heroCopy}>
            This is the fast operational create flow used by board, detail, and escalation handoffs.
          </Text>
        </MaterialSurface>
      }
      subtitle="Real dispatch create mutation with prefill support from other modules."
      title="New Dispatch"
    >
      <SectionCard title="Dispatch code">
        <FilterChips
          onSelect={setDispatchCode}
          options={dispatchCodes}
          selected={dispatchCode}
        />
      </SectionCard>

      <SectionCard title="Priority">
        <FilterChips
          onSelect={setPriority}
          options={priorities}
          selected={priority}
        />
      </SectionCard>

      <SectionCard title="Location">
        <FilterChips
          onSelect={setSelectedLocationName}
          options={(locationsQuery.data ?? []).map((location) => location.name)}
          selected={selectedLocationName}
        />
      </SectionCard>

      <SectionCard title="Dispatch details">
        <View style={styles.stack}>
          <TextField
            label="Description"
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
            placeholder="Describe the call"
            value={description}
          />
          <TextField
            label="Sublocation"
            onChangeText={setSublocation}
            placeholder="Turnstiles"
            value={sublocation}
          />
          <TextField
            label="Reporter name"
            onChangeText={setReporterName}
            placeholder="Operations lead"
            value={reporterName}
          />
          <TextField
            label="Reporter phone"
            onChangeText={setReporterPhone}
            placeholder="555-0100"
            value={reporterPhone}
          />
          <TextField
            label="Call source"
            onChangeText={setCallSource}
            placeholder="radio"
            value={callSource}
          />
          <View style={styles.actions}>
            <Button
              label="Cancel"
              onPress={() => router.back()}
              variant="secondary"
            />
            <Button
              label="Create Dispatch"
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
