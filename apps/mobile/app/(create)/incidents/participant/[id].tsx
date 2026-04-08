import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
  useCreateIncidentParticipantMutation,
  useIncidentDetail,
} from "@/lib/queries/incidents";
import { useThemeColors } from "@/theme";

const personTypes = ["patron", "staff", "contact", "unknown"];
const roles = ["subject", "victim", "witness", "reporter", "officer"];

export default function NewIncidentParticipantScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const detailQuery = useIncidentDetail(incidentId);
  const createMutation = useCreateIncidentParticipantMutation();
  const incident = detailQuery.data;
  const [personType, setPersonType] = useState("patron");
  const [primaryRole, setPrimaryRole] = useState("subject");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!incident) {
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Name required", "First and last name are required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        description: description || undefined,
        firstName: firstName.trim(),
        incidentId: incident.id,
        lastName: lastName.trim(),
        personType,
        primaryRole,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not add the participant."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Add Participant">
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
          <Text style={styles.heroTitle}>Add Participant</Text>
          <Text style={styles.heroCopy}>
            Link a real participant record to this incident from mobile.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Incident Participant"
    >
      <SectionCard title="Type and role">
        <View style={styles.stack}>
          <FilterChips onSelect={setPersonType} options={personTypes} selected={personType} />
          <FilterChips onSelect={setPrimaryRole} options={roles} selected={primaryRole} />
        </View>
      </SectionCard>

      <SectionCard title="Participant">
        <View style={styles.stack}>
          <TextField label="First name" onChangeText={setFirstName} value={firstName} />
          <TextField label="Last name" onChangeText={setLastName} value={lastName} />
          <TextField label="Description" multiline onChangeText={setDescription} value={description} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Add Participant"
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
    stack: { gap: 16 },
  });
}
