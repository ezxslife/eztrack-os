import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useAcknowledgeAlertMutation,
  useAlerts,
  useResolveAlertMutation,
} from "@/lib/queries/alerts";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function AlertsScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const alertsQuery = useAlerts();
  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const resolveMutation = useResolveAlertMutation();
  const items = alertsQuery.data ?? [];

  return (
    <ScreenContainer
      gutter="none"
      nativeHeader
      onRefresh={() => {
        void alertsQuery.refetch();
      }}
      refreshing={alertsQuery.isRefetching}
      subtitle="Real alert acknowledgements and resolution from the alerts table."
      title="Alerts"
    >
      <View style={styles.section}>
        <SectionHeader title="Alert queue" />
        <View style={styles.list}>
          {items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.copy}>{item.message ?? "No message"}</Text>
                <Text style={styles.meta}>
                  {item.severity ?? "general"} · {formatRelativeTimestamp(item.createdAt)}
                </Text>
                <Text style={styles.meta}>
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
            ))
          ) : (
            <Text style={styles.emptyCopy}>No active alerts.</Text>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 8,
    },
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      gap: 4,
      padding: layout.listItemPadding,
    },
    cardTitle: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    copy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    list: {
      gap: layout.gridGap,
    },
    meta: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
    },
  });
}
