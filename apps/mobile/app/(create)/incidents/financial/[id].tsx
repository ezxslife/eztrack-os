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
  useCreateIncidentFinancialMutation,
  useIncidentDetail,
} from "@/lib/queries/incidents";
import { useThemeColors } from "@/theme";

const entryTypes = ["property_loss", "medical_cost", "repair", "refund", "other"];

export default function NewIncidentFinancialScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const detailQuery = useIncidentDetail(incidentId);
  const createMutation = useCreateIncidentFinancialMutation();
  const incident = detailQuery.data;
  const [entryType, setEntryType] = useState("other");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!incident) {
      return;
    }

    if (!amount.trim() || Number.isNaN(Number(amount))) {
      Alert.alert("Amount required", "Enter a valid amount before saving.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        amount: Number(amount),
        description: description || undefined,
        entryType,
        incidentId: incident.id,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not add the financial entry."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Add Financial Entry">
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
          <Text style={styles.heroTitle}>Add Financial Entry</Text>
          <Text style={styles.heroCopy}>
            Capture live financial impact directly on the incident record.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Incident Financial"
    >
      <SectionCard title="Entry type">
        <FilterChips onSelect={setEntryType} options={entryTypes} selected={entryType} />
      </SectionCard>

      <SectionCard title="Financial impact">
        <View style={styles.stack}>
          <TextField label="Amount" keyboardType="numeric" onChangeText={setAmount} value={amount} />
          <TextField label="Description" multiline onChangeText={setDescription} value={description} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Add Entry"
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
