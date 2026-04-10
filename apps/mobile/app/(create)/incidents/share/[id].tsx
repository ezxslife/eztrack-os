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
  useCreateIncidentShareMutation,
  useIncidentDetail,
} from "@/lib/queries/incidents";
import { useOrgUsers } from "@/lib/queries/settings";
import { useNetworkStore } from "@/stores/network-store";
import { useThemeColors } from "@/theme";

const shareModes = ["user", "role"];
const permissionLevels = ["view", "comment", "edit"];

export default function IncidentShareScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const incidentId = params.id ?? "";
  const detailQuery = useIncidentDetail(incidentId);
  const usersQuery = useOrgUsers();
  const createMutation = useCreateIncidentShareMutation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const incident = detailQuery.data;
  const [shareMode, setShareMode] = useState("user");
  const [permissionLevel, setPermissionLevel] = useState("view");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const selectedUser = useMemo(
    () =>
      selectedUserName
        ? (usersQuery.data ?? []).find((user) => user.fullName === selectedUserName) ?? null
        : null,
    [selectedUserName, usersQuery.data]
  );
  const roleOptions = useMemo(
    () => Array.from(new Set((usersQuery.data ?? []).map((user) => user.role))).sort(),
    [usersQuery.data]
  );

  const handleSubmit = async () => {
    if (!incident) {
      return;
    }

    if (shareMode === "user" && !selectedUser) {
      Alert.alert("User required", "Choose a user to share this incident with.");
      return;
    }

    if (shareMode === "role" && !selectedRole) {
      Alert.alert("Role required", "Choose a role to share this incident with.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        expiresAt: expiresAt.trim() || undefined,
        incidentId: incident.id,
        permissionLevel,
        sharedWithRole: shareMode === "role" ? selectedRole : null,
        sharedWithUserId: shareMode === "user" ? selectedUser?.id ?? null : null,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Share failed",
        error instanceof Error ? error.message : "Could not share the incident."
      );
    }
  };

  if (!incident) {
    return (
      <ScreenContainer subtitle="Loading incident" title="Share Incident">
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
          <Text style={styles.heroTitle}>Share Incident</Text>
          <Text style={styles.heroCopy}>
            Grant view, comment, or edit access from the mobile workflow.
          </Text>
        </MaterialSurface>
      }
      subtitle={incident.recordNumber}
      title="Incident Access"
    >
      <SectionCard title="Share target">
        <View style={styles.stack}>
          <FilterChips onSelect={setShareMode} options={shareModes} selected={shareMode} />
          {shareMode === "user" ? (
            <FilterChips
              onSelect={setSelectedUserName}
              options={(usersQuery.data ?? []).map((user) => user.fullName)}
              selected={selectedUserName}
            />
          ) : (
            <FilterChips
              onSelect={setSelectedRole}
              options={roleOptions}
              selected={selectedRole}
            />
          )}
        </View>
      </SectionCard>

      <SectionCard title="Permissions">
        <View style={styles.stack}>
          <FilterChips
            onSelect={setPermissionLevel}
            options={permissionLevels}
            selected={permissionLevel}
          />
          <TextField
            label="Expires at"
            onChangeText={setExpiresAt}
            placeholder="2026-04-08T23:59:00Z"
            value={expiresAt}
          />
          {!isOnline ? (
            <Text style={styles.meta}>
              Sharing is online-only and will become available when connectivity returns.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => router.back()} variant="secondary" />
            <Button
              disabled={!isOnline}
              label="Share Incident"
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
