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
  useCaseDetail,
  useCaseEvidence,
  useCreateCaseEvidenceTransferMutation,
} from "@/lib/queries/cases";
import { useOrgUsers } from "@/lib/queries/settings";
import { useNetworkStore } from "@/stores/network-store";
import { useThemeColors } from "@/theme";

const transferReasons = ["analysis", "storage", "release", "destruction", "court_appearance"];

export default function CaseEvidenceTransferScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{
    evidenceId?: string;
    evidenceTitle?: string;
    id: string;
  }>();
  const caseId = params.id ?? "";
  const detailQuery = useCaseDetail(caseId);
  const evidenceQuery = useCaseEvidence(caseId);
  const usersQuery = useOrgUsers();
  const createMutation = useCreateCaseEvidenceTransferMutation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const record = detailQuery.data;
  const [selectedEvidenceTitle, setSelectedEvidenceTitle] = useState(params.evidenceTitle ?? "");
  const [selectedCustodianName, setSelectedCustodianName] = useState("");
  const [transferReason, setTransferReason] = useState("storage");
  const [notes, setNotes] = useState("");

  const selectedEvidence = useMemo(() => {
    if (params.evidenceId) {
      return (evidenceQuery.data ?? []).find((item) => item.id === params.evidenceId) ?? null;
    }

    return selectedEvidenceTitle
      ? (evidenceQuery.data ?? []).find((item) => item.title === selectedEvidenceTitle) ?? null
      : null;
  }, [evidenceQuery.data, params.evidenceId, selectedEvidenceTitle]);

  const selectedUser = useMemo(
    () =>
      selectedCustodianName
        ? (usersQuery.data ?? []).find((user) => user.fullName === selectedCustodianName) ?? null
        : null,
    [selectedCustodianName, usersQuery.data]
  );

  const handleSubmit = async () => {
    if (!record) {
      return;
    }

    if (!selectedEvidence) {
      Alert.alert("Evidence required", "Choose the evidence item being transferred.");
      return;
    }

    if (!selectedUser) {
      Alert.alert("Custodian required", "Choose the receiving custodian.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        caseId: record.id,
        evidenceId: selectedEvidence.id,
        notes: notes.trim() || undefined,
        transferReason,
        transferredToId: selectedUser.id,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Transfer failed",
        error instanceof Error ? error.message : "Could not transfer custody."
      );
    }
  };

  if (!record) {
    return (
      <ScreenContainer subtitle="Loading case" title="Transfer Custody">
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
          <Text style={styles.heroTitle}>Transfer Custody</Text>
          <Text style={styles.heroCopy}>
            Record a real chain-of-custody handoff for this evidence item.
          </Text>
        </MaterialSurface>
      }
      subtitle={record.recordNumber}
      title="Evidence Transfer"
    >
      <SectionCard title="Evidence">
        <View style={styles.stack}>
          <FilterChips
            onSelect={setSelectedEvidenceTitle}
            options={(evidenceQuery.data ?? []).map((item) => item.title)}
            selected={selectedEvidence?.title ?? selectedEvidenceTitle}
          />
          {selectedEvidence ? (
            <Text style={styles.meta}>
              {selectedEvidence.type} · {selectedEvidence.status} ·{" "}
              {selectedEvidence.itemNumber ?? "No item #"}
            </Text>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title="Transfer details">
        <View style={styles.stack}>
          <FilterChips
            onSelect={setSelectedCustodianName}
            options={(usersQuery.data ?? []).map((user) => user.fullName)}
            selected={selectedCustodianName}
          />
          <FilterChips
            onSelect={setTransferReason}
            options={transferReasons}
            selected={transferReason}
          />
          <TextField label="Notes" multiline onChangeText={setNotes} value={notes} />
          {!isOnline ? (
            <Text style={styles.meta}>
              Custody transfer is online-only and is disabled until connectivity returns.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              disabled={!isOnline}
              label="Transfer Custody"
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
