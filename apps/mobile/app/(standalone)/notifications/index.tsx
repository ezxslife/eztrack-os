import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  getNotificationRoute,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotifications,
} from "@/lib/queries/notifications";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

function formatRouteDestination(route: string) {
  const segment = route.split("/").filter(Boolean).pop() ?? "dashboard";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function NotificationsContent() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const router = useRouter();
  const notificationsQuery = useNotifications();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const notifications = notificationsQuery.data ?? [];

  return (
    <ScreenContainer
      gutter="none"
      onRefresh={() => {
        void notificationsQuery.refetch();
      }}
      refreshing={notificationsQuery.isRefetching}
      subtitle="Alerts, assignments, and updates for your account."
      title="Notifications"
    >
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <SectionHeader title="Inbox" />
          {notifications.length ? (
            <Button
              label="Mark All Read"
              loading={markAllMutation.isPending}
              onPress={() => {
                void markAllMutation.mutateAsync();
              }}
              variant="plain"
            />
          ) : null}
        </View>

        {notifications.length ? (
          <GroupedCard>
            {notifications.map((notification, index) => {
              const route = getNotificationRoute(notification);
              return (
                <View key={notification.id}>
                  {index > 0 ? <GroupedCardDivider /> : null}
                  <SettingsListRow
                    label={notification.title}
                    onPress={() => {
                      if (!notification.read) {
                        void markReadMutation.mutateAsync(notification.id);
                      }

                      router.push(route as never);
                    }}
                    subtitle={[
                      notification.message,
                      `${notification.type} · ${formatRelativeTimestamp(notification.createdAt)}`,
                      `${notification.read ? "Read" : "Unread"} · Opens ${formatRouteDestination(route)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </View>
              );
            })}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>You're all caught up.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Delivery" />
        <GroupedCard>
          <SettingsListRow
            label="Push notifications"
            subtitle="Push alerts refresh this inbox and open the right record when selected."
          />
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}

export default function NotificationsScreen() {
  return (
    <RequireLiveSession
      detail="Notifications are available with a live account and push-enabled device access."
      title="Notifications"
    >
      <NotificationsContent />
    </RequireLiveSession>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    emptyState: {
      backgroundColor: colors.surfaceTintSubtle,
      borderColor: colors.borderLight,
      borderRadius: 18,
      borderWidth: 1,
      marginHorizontal: layout.horizontalPadding,
      padding: 16,
    },
    section: {
      gap: 8,
    },
    sectionHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: layout.horizontalPadding,
    },
  });
}
