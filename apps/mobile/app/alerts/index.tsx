import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatRelativeTimestamp } from "@/lib/format";
import { useRecentActivity } from "@/lib/queries/dashboard";
import { useThemeColors } from "@/theme";

export default function AlertsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const activityQuery = useRecentActivity(8);
  const items = activityQuery.data ?? [];

  return (
    <ScreenContainer
      onRefresh={() => {
        void activityQuery.refetch();
      }}
      refreshing={activityQuery.isRefetching}
      subtitle="A temporary alert surface until dedicated alert rules and acknowledgements are implemented."
      title="Alerts"
    >
      <SectionCard
        subtitle={
          activityQuery.isLoading
            ? "Loading recent operational changes"
            : `${items.length} recent events`
        }
        title="Interim alert feed"
      >
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>
                {item.entityType} · {item.action.replace(/_/g, " ")}
              </Text>
              <Text style={styles.rowMeta}>
                {item.actorName ?? "System"} ·{" "}
                {formatRelativeTimestamp(item.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Next alert tranche">
        <Text style={styles.copy}>
          Dedicated severity rules, acknowledgment flows, and push delivery
          still need their own implementation. This route gives the shell a
          stable alert destination now.
        </Text>
      </SectionCard>
    </ScreenContainer>
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
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      padding: 14,
    },
    rowMeta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
