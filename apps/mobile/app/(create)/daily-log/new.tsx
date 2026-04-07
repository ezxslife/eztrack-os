import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { type DailyLogInput } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useCreateDailyLogMutation } from "@/lib/queries/daily-logs";
import { useLocations } from "@/lib/queries/locations";
import { useThemeColors } from "@/theme";

const priorities: DailyLogInput["priority"][] = ["low", "medium", "high"];

export default function NewDailyLogScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<DailyLogInput["priority"]>("medium");
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const locationsQuery = useLocations();
  const createDailyLogMutation = useCreateDailyLogMutation();
  const locationOptions = locationsQuery.data ?? [];
  const selectedLocation = useMemo(
    () => locationOptions.find((location) => location.name === selectedLocationName) ?? null,
    [locationOptions, selectedLocationName]
  );

  useEffect(() => {
    if (!selectedLocationName && locationOptions[0]) {
      setSelectedLocationName(locationOptions[0].name);
    }
  }, [locationOptions, selectedLocationName]);

  const handleSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert("Location required", "Choose a location before queueing the log.");
      return;
    }

    try {
      await createDailyLogMutation.mutateAsync({
        locationId: selectedLocation.id,
        priority: selectedPriority,
        synopsis,
        topic,
      });
      Alert.alert("Queued", "The daily log entry has been queued.");
      router.back();
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Could not create the daily log.");
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={78} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Quick Entry</Text>
          <Text style={styles.heroCopy}>
            This route should stay closer to Notes than to a back-office form. Capture the event,
            then classify it later if needed.
          </Text>
        </MaterialSurface>
      }
      subtitle="Validated daily log mutation aligned with the mobile quick-entry flow."
      title="New Daily Log"
    >
      <SectionCard title="Priority">
        <FilterChips
          onSelect={(value) => setSelectedPriority(value as DailyLogInput["priority"])}
          options={priorities}
          selected={selectedPriority}
        />
      </SectionCard>

      <SectionCard title="Location">
        {locationOptions.length ? (
          <FilterChips
            onSelect={setSelectedLocationName}
            options={locationOptions.map((location) => location.name)}
            selected={selectedLocationName}
          />
        ) : (
          <Text style={styles.helper}>A saved location is required before daily logs can be created.</Text>
        )}
      </SectionCard>

      <SectionCard title="Quick entry">
        <View style={styles.stack}>
          <TextField
            label="Topic"
            onChangeText={setTopic}
            placeholder="Routine patrol note"
            value={topic}
          />
          <TextField
            label="Synopsis"
            multiline
            numberOfLines={4}
            onChangeText={setSynopsis}
            placeholder="Capture the activity while it is still fresh."
            value={synopsis}
          />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Queue Entry"
              loading={createDailyLogMutation.isPending}
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
