import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useStorageHealthStore } from "@/stores/storage-health-store";
import { useThemeColors } from "@/theme";

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const pendingActions = useOfflineStore((state) => state.pendingActions.length);
  const storageTier = useStorageHealthStore((state) => state.tier);

  return (
    <ScreenContainer
      subtitle="Push registration and category-specific delivery are still pending. This screen establishes the route and the device-level context."
      title="Notifications"
    >
      <SectionCard title="Current device state">
        <View style={styles.list}>
          <StatusRow label="Network" value={isOnline ? "online" : "offline"} />
          <StatusRow label="Storage tier" value={storageTier} />
          <StatusRow
            label="Queued offline actions"
            value={String(pendingActions)}
          />
        </View>
      </SectionCard>

      <SectionCard title="Next notification tranche">
        <Text style={styles.copy}>
          Incident assignments, dispatch escalations, offline sync completion,
          and alert acknowledgements still need Expo Notifications wiring and
          server-side delivery rules.
        </Text>
      </SectionCard>
    </ScreenContainer>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  const styles = StyleSheet.create({
    label: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      padding: 14,
    },
    value: {
      color: colors.textTertiary,
      fontSize: 13,
    },
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    list: {
      gap: 12,
    },
  });
}
