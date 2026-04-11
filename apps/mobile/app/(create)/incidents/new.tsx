import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { INCIDENT_TYPES, IncidentSeverity } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { useCreateIncidentMutation } from "@/lib/queries/incidents";
import { useLocations } from "@/lib/queries/locations";
import { getDraftKey, useDraftStore } from "@/stores/draft-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const severities: IncidentSeverity[] = [
  IncidentSeverity.Low,
  IncidentSeverity.Medium,
  IncidentSeverity.High,
  IncidentSeverity.Critical,
];
const draftModuleKey = "incident-create";

export default function NewIncidentScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const router = useRouter();
  const params = useLocalSearchParams<{
    reportedBy?: string;
    synopsis?: string;
  }>();
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
    if (!savedDraft?.reportedBy && params.reportedBy) {
      setReportedBy(params.reportedBy);
    }

    if (!savedDraft?.synopsis && params.synopsis) {
      setSynopsis(params.synopsis);
    }
  }, [params.reportedBy, params.synopsis, savedDraft?.reportedBy, savedDraft?.synopsis]);

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
      gutter="none"
      subtitle="Capture the report and save it for the team."
      title="Incident Draft"
    >
      <View style={styles.section}>
        <SectionHeader title="Incident type" />
        <MaterialSurface style={styles.panel} variant="panel">
          <FilterChips
            onSelect={setIncidentType}
            options={[...INCIDENT_TYPES] as unknown as string[]}
            selected={incidentType}
          />
        </MaterialSurface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Severity" />
        <MaterialSurface style={styles.panel} variant="panel">
          <FilterChips
            onSelect={(value) => setSelectedSeverity(value as IncidentSeverity)}
            options={severities}
            selected={selectedSeverity}
          />
        </MaterialSurface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Location" />
        <MaterialSurface style={styles.panel} variant="panel">
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
        </MaterialSurface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Report details" />
        <MaterialSurface style={styles.panel} variant="panel">
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
        </MaterialSurface>
      </View>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    helper: {
      ...typography.subheadline,
      color: colors.textTertiary,
      lineHeight: 20,
    },
    panel: {
      gap: 16,
      marginHorizontal: layout.horizontalPadding,
    },
    section: {
      gap: 8,
    },
  });
}
