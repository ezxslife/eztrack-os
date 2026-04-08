import { useRouter } from "expo-router";
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

import {
  INCIDENT_TYPES,
  IncidentSeverity,
} from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useCreateIncidentMutation } from "@/lib/queries/incidents";
import { useLocations } from "@/lib/queries/locations";
import {
  getDraftKey,
  useDraftStore,
} from "@/stores/draft-store";
import { useThemeColors } from "@/theme";

const severities: IncidentSeverity[] = [
  IncidentSeverity.Low,
  IncidentSeverity.Medium,
  IncidentSeverity.High,
  IncidentSeverity.Critical,
];
const draftModuleKey = "incident-create";

export default function NewIncidentScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const savedDraft = useDraftStore(
    (state) =>
      state.drafts[getDraftKey(draftModuleKey)]?.data as
        | {
            incidentType?: string;
            reportedBy?: string;
            selectedLocationName?: string;
            selectedSeverity?: IncidentSeverity;
            synopsis?: string;
          }
        | undefined
  );
  const clearModuleDrafts = useDraftStore((state) => state.clearModuleDrafts);
  const saveDraft = useDraftStore((state) => state.saveDraft);
  const [incidentType, setIncidentType] = useState<string>(
    savedDraft?.incidentType ?? INCIDENT_TYPES[0]
  );
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>(
    savedDraft?.selectedSeverity ?? IncidentSeverity.Medium
  );
  const [selectedLocationName, setSelectedLocationName] = useState(
    savedDraft?.selectedLocationName ?? ""
  );
  const [synopsis, setSynopsis] = useState(savedDraft?.synopsis ?? "");
  const [reportedBy, setReportedBy] = useState(savedDraft?.reportedBy ?? "");
  const locationsQuery = useLocations();
  const createIncidentMutation = useCreateIncidentMutation();
  const locationOptions = locationsQuery.data ?? [];
  const selectedLocation = useMemo(
    () =>
      locationOptions.find((location) => location.name === selectedLocationName) ??
      null,
    [locationOptions, selectedLocationName]
  );

  useEffect(() => {
    if (!selectedLocationName && locationOptions[0]) {
      setSelectedLocationName(locationOptions[0].name);
    }
  }, [locationOptions, selectedLocationName]);

  useEffect(() => {
    const hasMeaningfulDraft =
      synopsis.trim().length > 0 ||
      reportedBy.trim().length > 0 ||
      incidentType !== INCIDENT_TYPES[0] ||
      selectedSeverity !== IncidentSeverity.Medium;

    if (!hasMeaningfulDraft) {
      clearModuleDrafts(draftModuleKey);
      return;
    }

    saveDraft(draftModuleKey, {
      incidentType,
      reportedBy,
      selectedLocationName,
      selectedSeverity,
      synopsis,
    });
  }, [
    clearModuleDrafts,
    incidentType,
    reportedBy,
    saveDraft,
    selectedLocationName,
    selectedSeverity,
    synopsis,
  ]);

  const submit = async () => {
    if (!selectedLocation) {
      Alert.alert(
        "Location required",
        "Choose a location before saving the incident."
      );
      return;
    }

    try {
      const result = await createIncidentMutation.mutateAsync({
        incidentType,
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        reportedBy: reportedBy.trim() || undefined,
        severity: selectedSeverity,
        synopsis,
      });
      Alert.alert(
        result.queued ? "Queued Offline" : "Saved",
        result.queued
          ? "The incident draft is stored locally and will sync when the device reconnects."
          : "The incident draft has been created."
      );
      clearModuleDrafts(draftModuleKey);
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not create the incident."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={80} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>New Incident</Text>
          <Text style={styles.heroCopy}>
            Keep the top of the form short and decisive. Operators should be
            able to start the report without hunting through the interface.
          </Text>
        </MaterialSurface>
      }
      subtitle="Validated incident mutation routed through the mobile Supabase client."
      title="Incident Draft"
    >
      <SectionCard title="Incident type">
        <FilterChips
          onSelect={setIncidentType}
          options={[...INCIDENT_TYPES] as unknown as string[]}
          selected={incidentType}
        />
      </SectionCard>

      <SectionCard title="Severity">
        <FilterChips
          onSelect={(value) => setSelectedSeverity(value as IncidentSeverity)}
          options={severities}
          selected={selectedSeverity}
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
          <Text style={styles.helper}>
            A saved location is required before incidents can be created.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Draft form">
        <View style={styles.stack}>
          <TextField
            label="Reported by"
            onChangeText={setReportedBy}
            placeholder="Checkpoint Officer"
            value={reportedBy}
          />
          <TextField
            label="Synopsis"
            multiline
            numberOfLines={5}
            onChangeText={setSynopsis}
            placeholder="Describe what happened"
            value={synopsis}
          />
          <View style={styles.actions}>
            <Button
              label="Cancel"
              onPress={() => router.back()}
              variant="secondary"
            />
            <Button
              label="Save Draft"
              loading={createIncidentMutation.isPending}
              onPress={submit}
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
