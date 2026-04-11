import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useAcknowledgeAlertMutation,
  useAlerts,
  useResolveAlertMutation,
} from "@/lib/queries/alerts";
import { useThemeColors } from "@/theme";

export default function AlertsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const alertsQuery = useAlerts();
  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const resolveMutation = useResolveAlertMutation();
  const items = alertsQuery.data ?? [];

  return (
    <ScreenContainer
      onRefresh={() => {
        void alertsQuery.refetch();
      }}
      refreshing={alertsQuery.isRefetching}
      subtitle="Real alert acknowledgements and resolution from the alerts table."
      title="Alerts"
    >
      <SectionCard
        subtitle={
          alertsQuery.isLoading ? "Loading alerts" : `${items.length} active alerts`
        }
        title="Alert queue"
      >
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.copy}>{item.message ?? "No message"}</Text>
              <Text style={styles.rowMeta}>
                {item.severity ?? "general"} · {formatRelativeTimestamp(item.createdAt)}
              </Text>
              <Text style={styles.rowMeta}>
                {item.acknowledgedAt
                  ? `Acknowledged ${formatRelativeTimestamp(item.acknowledgedAt)}`
                  : "Unacknowledged"}
              </Text>
              <View style={styles.actions}>
                {!item.acknowledgedAt ? (
                  <Button
                    label="Acknowledge"
                    loading={
                      acknowledgeMutation.isPending &&
                      acknowledgeMutation.variables === item.id
                    }
                    onPress={() => {
                      void acknowledgeMutation.mutateAsync(item.id);
                    }}
                    variant="secondary"
                  />
                ) : null}
                <Button
                  label="Resolve"
                  loading={
                    resolveMutation.isPending && resolveMutation.variables === item.id
                  }
                  onPress={() => {
                    Alert.alert(
                      "Resolve alert",
                      "Remove this alert from the active queue?",
                      [
                        { style: "cancel", text: "Cancel" },
                        {
                          style: "destructive",
                          text: "Resolve",
                          onPress: () => {
                            void resolveMutation.mutateAsync(item.id);
                          },
                        },
                      ]
                    );
                  }}
                  variant="secondary"
                />
              </View>
            </View>
          ))}
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
      gap: 10,
      marginTop: 8,
    },
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
