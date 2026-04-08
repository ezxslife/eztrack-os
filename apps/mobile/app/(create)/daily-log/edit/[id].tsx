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

import { DailyLogStatus, type DailyLogInput } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import {
  useDailyLogDetail,
  useUpdateDailyLogMutation,
} from "@/lib/queries/daily-logs";
import { useLocations } from "@/lib/queries/locations";
import {
  getDraftKey,
  useDraftStore,
} from "@/stores/draft-store";
import { useThemeColors } from "@/theme";

const priorities: DailyLogInput["priority"][] = ["low", "medium", "high"];
const statusOptions = [
  { label: "Open", value: DailyLogStatus.Open },
  { label: "Pending", value: DailyLogStatus.Pending },
  { label: "High Priority", value: DailyLogStatus.HighPriority },
  { label: "Closed", value: DailyLogStatus.Closed },
] as const;
const draftModuleKey = "daily-log-edit";

export default function EditDailyLogScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const dailyLogId = params.id ?? "";
  const draftKey = getDraftKey(draftModuleKey, dailyLogId);
  const savedDraft = useDraftStore(
    (state) =>
      state.drafts[draftKey]?.data as
        | {
            selectedLocationName?: string;
            selectedPriority?: DailyLogInput["priority"];
            selectedStatus?: DailyLogStatus;
            synopsis?: string;
            topic?: string;
          }
        | undefined
  );
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const saveDraft = useDraftStore((state) => state.saveDraft);
  const detailQuery = useDailyLogDetail(dailyLogId);
  const locationsQuery = useLocations();
  const updateDailyLogMutation = useUpdateDailyLogMutation();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [topic, setTopic] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [selectedPriority, setSelectedPriority] =
    useState<DailyLogInput["priority"]>("medium");
  const [selectedStatus, setSelectedStatus] = useState<DailyLogStatus>(
    DailyLogStatus.Open
  );
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const dailyLog = detailQuery.data;
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
    if (!dailyLog || bootstrapped) {
      return;
    }

    setTopic(savedDraft?.topic ?? dailyLog.topic);
    setSynopsis(savedDraft?.synopsis ?? dailyLog.synopsis);
    setSelectedPriority(
      savedDraft?.selectedPriority ?? (dailyLog.priority as DailyLogInput["priority"])
    );
    setSelectedStatus(savedDraft?.selectedStatus ?? (dailyLog.status as DailyLogStatus));
    setSelectedLocationName(savedDraft?.selectedLocationName ?? dailyLog.location);
    setBootstrapped(true);
  }, [bootstrapped, dailyLog, savedDraft]);

  useEffect(() => {
    if (!bootstrapped || !dailyLog) {
      return;
    }

    const hasMeaningfulDraft =
      topic !== dailyLog.topic ||
      synopsis !== dailyLog.synopsis ||
      selectedPriority !== dailyLog.priority ||
      selectedStatus !== dailyLog.status ||
      selectedLocationName !== dailyLog.location;

    if (!hasMeaningfulDraft) {
      deleteDraft(draftKey);
      return;
    }

    saveDraft(
      draftModuleKey,
      {
        selectedLocationName,
        selectedPriority,
        selectedStatus,
        synopsis,
        topic,
      },
      dailyLogId
    );
  }, [
    bootstrapped,
    dailyLog,
    dailyLogId,
    deleteDraft,
    draftKey,
    saveDraft,
    selectedLocationName,
    selectedPriority,
    selectedStatus,
    synopsis,
    topic,
  ]);

  const handleSubmit = async () => {
    if (!dailyLog) {
      return;
    }

    if (!selectedLocation) {
      Alert.alert(
        "Location required",
        "Choose a location before saving the log."
      );
      return;
    }

    try {
      const result = await updateDailyLogMutation.mutateAsync({
        dailyLogId: dailyLog.id,
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        priority: selectedPriority,
        recordNumber: dailyLog.recordNumber,
        status: selectedStatus,
        synopsis,
        topic,
      });
      deleteDraft(draftKey);
      Alert.alert(
        result.queued ? "Queued Offline" : "Saved",
        result.queued
          ? "The daily log changes are stored locally and will sync when connectivity returns."
          : "The daily log entry has been updated."
      );
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not update the daily log."
      );
    }
  };

  if (!dailyLog) {
    return (
      <ScreenContainer subtitle="Loading log entry" title="Edit Daily Log">
        <SectionCard title="Loading">
          <Text style={styles.helper}>The daily log entry is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={78} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Edit Daily Log</Text>
          <Text style={styles.heroCopy}>
            Let operators correct the record without falling out of the field workflow.
          </Text>
        </MaterialSurface>
      }
      subtitle={dailyLog.recordNumber}
      title="Daily Log Update"
    >
      <SectionCard title="Priority">
        <FilterChips
          onSelect={(value) =>
            setSelectedPriority(value as DailyLogInput["priority"])
          }
          options={priorities}
          selected={selectedPriority}
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
            A saved location is required before daily logs can be edited.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Log details">
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
            <Button
              label="Cancel"
              onPress={() => router.back()}
              variant="secondary"
            />
            <Button
              label="Save Changes"
              loading={updateDailyLogMutation.isPending}
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
