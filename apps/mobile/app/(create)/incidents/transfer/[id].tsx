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
import {
  useIncidentDetail,
  useTransferIncidentOwnershipMutation,
} from "@/lib/queries/incidents";
import { useOrgUsers } from "@/lib/queries/settings";
import { useNetworkStore } from "@/stores/network-store";
import { useThemeColors } from "@/theme";

export default function IncidentTransferScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const detailQuery = useIncidentDetail(incidentId);
  const usersQuery = useOrgUsers();
  const transferMutation = useTransferIncidentOwnershipMutation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const incident = detailQuery.data;
  const [selectedOwnerName, setSelectedOwnerName] = useState("");

  const selectedUser = useMemo(
    () =>
      selectedOwnerName
        ? (usersQuery.data ?? []).find((user) => user.fullName === selectedOwnerName) ?? null
        : null,
    [selectedOwnerName, usersQuery.data]
  );

  const handleSubmit = async () => {
    if (!incident || !selectedUser) {
      Alert.alert("Owner required", "Choose the user who should take ownership.");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        id: incident.id,
        newOwnerId: selectedUser.id,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Transfer failed",
        error instanceof Error ? error.message : "Could not transfer the incident."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Transfer Incident">
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
          <Text style={styles.heroTitle}>Transfer Ownership</Text>
          <Text style={styles.heroCopy}>
            Reassign the incident owner to another user in the organization.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Transfer Incident"
    >
      <SectionCard title="New owner">
        <View style={styles.stack}>
          <FilterChips
            onSelect={setSelectedOwnerName}
            options={(usersQuery.data ?? []).map((user) => user.fullName)}
            selected={selectedOwnerName}
          />
          {!isOnline ? (
            <Text style={styles.meta}>
              Ownership transfer is online-only and is disabled until connectivity returns.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              disabled={!isOnline}
              label="Transfer Ownership"
              loading={transferMutation.isPending}
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
