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

import {
  INCIDENT_TYPES,
  IncidentSeverity,
  IncidentStatus,
} from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useIncidentDetail,
  useUpdateIncidentMutation,
} from "@/lib/queries/incidents";
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

const statusOptions = [
  { label: "Open", value: IncidentStatus.Open },
  { label: "Assigned", value: IncidentStatus.Assigned },
  { label: "In Progress", value: IncidentStatus.InProgress },
  { label: "Follow Up", value: IncidentStatus.FollowUp },
  { label: "Investigation", value: IncidentStatus.Investigation },
  { label: "Completed", value: IncidentStatus.Completed },
  { label: "Closed", value: IncidentStatus.Closed },
] as const;

const draftModuleKey = "incident-edit";

export default function EditIncidentScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const draftKey = getDraftKey(draftModuleKey, incidentId);
  const savedDraft = useDraftStore(
    (state) =>
      state.drafts[draftKey]?.data as
        | {
            incidentType?: string;
            reportedBy?: string;
            selectedLocationName?: string;
            selectedSeverity?: IncidentSeverity;
            selectedStatus?: IncidentStatus;
            synopsis?: string;
          }
        | undefined
  );
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const saveDraft = useDraftStore((state) => state.saveDraft);
  const detailQuery = useIncidentDetail(incidentId);
  const locationsQuery = useLocations();
  const updateIncidentMutation = useUpdateIncidentMutation();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [incidentType, setIncidentType] = useState<string>(INCIDENT_TYPES[0]);
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>(
    IncidentSeverity.Medium
  );
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>(
    IncidentStatus.Open
  );
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const incident = detailQuery.data;
  const locationOptions = locationsQuery.data ?? [];
  const selectedLocation = useMemo(
    () =>
      locationOptions.find((location) => location.name === selectedLocationName) ??
      null,
    [locationOptions, selectedLocationName]
  );
  const selectedStatusLabel =
    statusOptions.find((option) => option.value === selectedStatus)?.label ?? "Open";

  useEffect(() => {
    if (!incident || bootstrapped) {
      return;
    }

    setIncidentType(savedDraft?.incidentType ?? incident.type);
    setSelectedSeverity(savedDraft?.selectedSeverity ?? (incident.severity as IncidentSeverity));
    setSelectedStatus(savedDraft?.selectedStatus ?? (incident.status as IncidentStatus));
    setSelectedLocationName(savedDraft?.selectedLocationName ?? incident.location);
    setSynopsis(savedDraft?.synopsis ?? incident.synopsis);
    setReportedBy(savedDraft?.reportedBy ?? incident.reportedBy ?? "");
    setBootstrapped(true);
  }, [bootstrapped, incident, savedDraft]);

  useEffect(() => {
    if (!bootstrapped || !incident) {
      return;
    }

    const hasMeaningfulDraft =
      incidentType !== incident.type ||
      selectedSeverity !== incident.severity ||
      selectedStatus !== incident.status ||
      selectedLocationName !== incident.location ||
      synopsis !== incident.synopsis ||
      reportedBy !== (incident.reportedBy ?? "");

    if (!hasMeaningfulDraft) {
      deleteDraft(draftKey);
      return;
    }

    saveDraft(
      draftModuleKey,
      {
        incidentType,
        reportedBy,
        selectedLocationName,
        selectedSeverity,
        selectedStatus,
        synopsis,
      },
      incidentId
    );
  }, [
    bootstrapped,
    deleteDraft,
    draftKey,
    incident,
    incidentId,
    incidentType,
    reportedBy,
    saveDraft,
    selectedLocationName,
    selectedSeverity,
    selectedStatus,
    synopsis,
  ]);

  const handleSubmit = async () => {
    if (!incident) {
      return;
    }

    if (!selectedLocation) {
      Alert.alert(
        "Location required",
        "Choose a location before saving the incident."
      );
      return;
    }

    try {
      const result = await updateIncidentMutation.mutateAsync({
        incidentId: incident.id,
        incidentType,
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        recordNumber: incident.recordNumber,
        reportedBy: reportedBy.trim() || undefined,
        severity: selectedSeverity,
        status: selectedStatus,
        synopsis,
      });
      deleteDraft(draftKey);
      Alert.alert(
        result.queued ? "Queued Offline" : "Saved",
        result.queued
          ? "The incident changes are stored locally and will sync when connectivity returns."
          : "The incident has been updated."
      );
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not update the incident."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Edit Incident">
        <SectionCard title="Loading">
          <Text style={styles.helper}>The incident record is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={80} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Incident</Text>
          <Text style={styles.heroCopy}>
            Keep edits short, explicit, and safe for offline replay.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Incident Update"
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

      <SectionCard title="Status">
        <FilterChips
          onSelect={(value) => {
            const option = statusOptions.find((candidate) => candidate.label === value);
            if (option) {
              setSelectedStatus(option.value);
            }
          }}
          options={statusOptions.map((option) => option.label)}
          selected={selectedStatusLabel}
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
            A saved location is required before incidents can be edited.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Incident details">
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
              label="Save Changes"
              loading={updateIncidentMutation.isPending}
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
