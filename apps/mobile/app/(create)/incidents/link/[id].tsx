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
  useIncidentDetail,
  useIncidents,
  useLinkRelatedIncidentMutation,
} from "@/lib/queries/incidents";
import { useNetworkStore } from "@/stores/network-store";
import { useThemeColors } from "@/theme";

const relationshipTypes = [
  "related_to",
  "precursor",
  "follow_up",
  "duplicate",
  "continuation",
];

export default function IncidentLinkScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const detailQuery = useIncidentDetail(incidentId);
  const incidentsQuery = useIncidents();
  const createMutation = useLinkRelatedIncidentMutation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const incident = detailQuery.data;
  const [relationshipType, setRelationshipType] = useState("related_to");
  const [relatedIncidentId, setRelatedIncidentId] = useState("");
  const [reason, setReason] = useState("");

  const recentOptions = useMemo(
    () =>
      (incidentsQuery.data ?? [])
        .filter((item) => item.id !== incidentId)
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          label: item.recordNumber,
        })),
    [incidentId, incidentsQuery.data]
  );

  const handleSubmit = async () => {
    if (!incident) {
      return;
    }

    if (!relatedIncidentId.trim()) {
      Alert.alert("Incident required", "Choose or enter the related incident ID.");
      return;
    }

    if (relatedIncidentId.trim() === incident.id) {
      Alert.alert("Invalid incident", "An incident cannot be linked to itself.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        incidentId: incident.id,
        reason: reason.trim() || undefined,
        relatedIncidentId: relatedIncidentId.trim(),
        relationshipType,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Link failed",
        error instanceof Error ? error.message : "Could not link the related incident."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Link Incident">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The incident is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={78} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Link Related Incident</Text>
          <Text style={styles.heroCopy}>
            Connect this record to its duplicate, precursor, or follow-up incident.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Related Incident"
    >
      <SectionCard title="Relationship">
        <FilterChips
          onSelect={setRelationshipType}
          options={relationshipTypes}
          selected={relationshipType}
        />
      </SectionCard>

      <SectionCard title="Incident to link">
        <View style={styles.stack}>
          {recentOptions.length ? (
            <FilterChips
              onSelect={(value) => {
                const match = recentOptions.find((option) => option.label === value);
                setRelatedIncidentId(match?.id ?? "");
              }}
              options={recentOptions.map((option) => option.label)}
              selected={
                recentOptions.find((option) => option.id === relatedIncidentId)?.label ?? ""
              }
            />
          ) : null}
          <TextField
            label="Related incident ID"
            onChangeText={setRelatedIncidentId}
            placeholder="UUID of the incident to link"
            value={relatedIncidentId}
          />
          <TextField label="Reason" multiline onChangeText={setReason} value={reason} />
          {!isOnline ? (
            <Text style={styles.meta}>
              Incident linking is online-only and is disabled until connectivity returns.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              disabled={!isOnline}
              label="Link Incident"
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
    meta: { color: colors.textTertiary, fontSize: 13 },
    stack: { gap: 16 },
  });
}
