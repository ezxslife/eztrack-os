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
import {
  useIncidentDetail,
  useIncidentForms,
  useSaveIncidentFormMutation,
} from "@/lib/queries/incidents";
import {
  getDraftKey,
  useDraftStore,
} from "@/stores/draft-store";
import { useNetworkStore } from "@/stores/network-store";
import { useThemeColors } from "@/theme";

const formTypes = [
  "medical_incident",
  "security_incident",
  "property_damage",
  "theft",
  "assault",
  "ejection",
  "custom",
];
const officialOptions = ["supplemental", "official"];
const draftModuleKey = "incident-form";

function getStringValue(
  payload: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = payload?.[key];
  return typeof value === "string" ? value : "";
}

export default function IncidentFormScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ formId?: string; id: string }>();
  const incidentId = params.id ?? "";
  const formId = params.formId ?? "";
  const draftId = formId || incidentId;
  const draftKey = getDraftKey(draftModuleKey, draftId);
  const detailQuery = useIncidentDetail(incidentId);
  const formsQuery = useIncidentForms(incidentId);
  const saveFormMutation = useSaveIncidentFormMutation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const saveDraft = useDraftStore((state) => state.saveDraft);
  const savedDraft = useDraftStore(
    (state) =>
      state.drafts[draftKey]?.data as
        | {
            details?: string;
            formType?: string;
            isOfficial?: boolean;
            summary?: string;
          }
        | undefined
  );

  const incident = detailQuery.data;
  const existingForm = useMemo(
    () => (formsQuery.data ?? []).find((form) => form.id === formId) ?? null,
    [formId, formsQuery.data]
  );
  const existingPayload =
    existingForm && typeof existingForm.formData === "object" && existingForm.formData
      ? (existingForm.formData as Record<string, unknown>)
      : null;
  const initialOfficial = Boolean(savedDraft?.isOfficial ?? existingForm?.isOfficial ?? false);
  const [selectedFormType, setSelectedFormType] = useState(
    savedDraft?.formType ?? existingForm?.formType ?? "security_incident"
  );
  const [officialState, setOfficialState] = useState(initialOfficial ? "official" : "supplemental");
  const [summary, setSummary] = useState(
    savedDraft?.summary ?? getStringValue(existingPayload, "summary")
  );
  const [details, setDetails] = useState(
    savedDraft?.details ?? getStringValue(existingPayload, "details")
  );

  useEffect(() => {
    if (!existingForm || savedDraft) {
      return;
    }

    setSelectedFormType(existingForm.formType);
    setOfficialState(existingForm.isOfficial ? "official" : "supplemental");
    setSummary(getStringValue(existingPayload, "summary"));
    setDetails(getStringValue(existingPayload, "details"));
  }, [existingForm, existingPayload, savedDraft]);

  useEffect(() => {
    if (!summary.trim() && !details.trim() && !savedDraft) {
      deleteDraft(draftKey);
      return;
    }

    saveDraft(
      draftModuleKey,
      {
        details,
        formType: selectedFormType,
        isOfficial: officialState === "official",
        summary,
      },
      draftId
    );
  }, [
    deleteDraft,
    details,
    draftId,
    draftKey,
    officialState,
    saveDraft,
    savedDraft,
    selectedFormType,
    summary,
  ]);

  const handleSubmit = async (markComplete: boolean) => {
    if (!incident) {
      return;
    }

    if (!summary.trim() && !details.trim()) {
      Alert.alert("Form required", "Add a summary or details before saving the form.");
      return;
    }

    try {
      await saveFormMutation.mutateAsync({
        formData: {
          details: details.trim() || null,
          summary: summary.trim() || null,
        },
        formId: existingForm?.id,
        formType: selectedFormType,
        incidentId: incident.id,
        isOfficial: officialState === "official",
        markComplete,
      });
      deleteDraft(draftKey);
      Alert.alert(
        markComplete ? "Form completed" : existingForm ? "Form updated" : "Form saved",
        markComplete
          ? "The incident form has been marked complete."
          : "The incident form has been saved."
      );
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not save the incident form."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Incident Form">
        <SectionCard title="Loading">
          <Text style={styles.helper}>The incident is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={78} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>
            {existingForm ? "Update Incident Form" : "Add Incident Form"}
          </Text>
          <Text style={styles.heroCopy}>
            Save a real supplemental form to the incident record and optionally complete it.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Incident Form"
    >
      <SectionCard title="Form type">
        <View style={styles.stack}>
          <FilterChips
            onSelect={setSelectedFormType}
            options={formTypes}
            selected={selectedFormType}
          />
          <FilterChips
            onSelect={setOfficialState}
            options={officialOptions}
            selected={officialState}
          />
        </View>
      </SectionCard>

      <SectionCard title="Form content">
        <View style={styles.stack}>
          <TextField
            label="Summary"
            onChangeText={setSummary}
            placeholder="Brief form summary"
            value={summary}
          />
          <TextField
            label="Details"
            multiline
            numberOfLines={6}
            onChangeText={setDetails}
            placeholder="Capture the substantive form details..."
            value={details}
          />
          {!isOnline ? (
            <Text style={styles.helper}>
              Incident forms are online-only and cannot be saved until connectivity returns.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              disabled={!isOnline}
              label={existingForm ? "Save Form" : "Create Form"}
              loading={saveFormMutation.isPending}
              onPress={() => {
                void handleSubmit(false);
              }}
              variant="secondary"
            />
            <Button
              disabled={!isOnline || Boolean(existingForm?.completedAt)}
              label={existingForm?.completedAt ? "Already Complete" : "Complete Form"}
              loading={saveFormMutation.isPending}
              onPress={() => {
                void handleSubmit(true);
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
