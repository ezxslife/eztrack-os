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
  useCaseDetail,
  useCreateCaseCostMutation,
} from "@/lib/queries/cases";
import { useThemeColors } from "@/theme";

const costTypes = ["lab_fee", "evidence_storage", "personnel", "equipment", "other"];

export default function NewCaseCostScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id ?? "";
  const detailQuery = useCaseDetail(caseId);
  const createMutation = useCreateCaseCostMutation();
  const record = detailQuery.data;
  const [costType, setCostType] = useState("other");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [paidDate, setPaidDate] = useState("");

  const handleSubmit = async () => {
    if (!record) {
      return;
    }

    const parsedAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount)) {
      Alert.alert("Amount required", "Enter a valid amount before saving.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Description required", "Add a description before saving the cost.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        amount: parsedAmount,
        caseId: record.id,
        costType,
        description: description.trim(),
        paidDate: paidDate.trim() || undefined,
        vendor: vendor.trim() || undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not add the cost entry."
      );
    }
  };

  if (!record) {
    return (
      <ScreenContainer subtitle="Loading case" title="Add Cost">
        <SectionCard title="Loading">
          <Text style={styles.heroCopy}>The case is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={78} style={styles.hero} variant="panel">
          <Text style={styles.heroTitle}>Add Cost</Text>
          <Text style={styles.heroCopy}>
            Track spend and recovery data on the live case record.
          </Text>
        </MaterialSurface>
      }
      subtitle={record.recordNumber}
      title="Case Cost"
    >
      <SectionCard title="Cost type">
        <FilterChips onSelect={setCostType} options={costTypes} selected={costType} />
      </SectionCard>

      <SectionCard title="Financial entry">
        <View style={styles.stack}>
          <TextField
            label="Amount"
            keyboardType="numeric"
            onChangeText={setAmount}
            value={amount}
          />
          <TextField label="Vendor" onChangeText={setVendor} value={vendor} />
          <TextField
            label="Paid date"
            onChangeText={setPaidDate}
            placeholder="2026-04-08"
            value={paidDate}
          />
          <TextField
            label="Description"
            multiline
            onChangeText={setDescription}
            value={description}
          />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              label="Add Cost"
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
