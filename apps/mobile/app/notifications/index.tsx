import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotifications,
} from "@/lib/queries/notifications";
import { useThemeColors } from "@/theme";

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const notificationsQuery = useNotifications();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const notifications = notificationsQuery.data ?? [];

  return (
    <ScreenContainer
      onRefresh={() => {
        void notificationsQuery.refetch();
      }}
      refreshing={notificationsQuery.isRefetching}
      subtitle="Real notification inbox with per-item and bulk read state."
      title="Notifications"
    >
      <SectionCard
        footer={
          notifications.length ? (
            <Button
              label="Mark All Read"
              loading={markAllMutation.isPending}
              onPress={() => {
                void markAllMutation.mutateAsync();
              }}
              variant="secondary"
            />
          ) : undefined
        }
        subtitle={notificationsQuery.isLoading ? "Loading inbox" : `${notifications.length} items`}
        title="Inbox"
      >
        <View style={styles.list}>
          {notifications.length ? (
            notifications.map((notification) => (
              <View key={notification.id} style={styles.row}>
                <Text style={styles.label}>{notification.title}</Text>
                {notification.message ? (
                  <Text style={styles.copy}>{notification.message}</Text>
                ) : null}
                <Text style={styles.value}>
                  {notification.type} · {formatRelativeTimestamp(notification.createdAt)}
                </Text>
                <Text style={styles.value}>{notification.read ? "Read" : "Unread"}</Text>
                {!notification.read ? (
                  <Button
                    label="Mark Read"
                    loading={
                      markReadMutation.isPending &&
                      markReadMutation.variables === notification.id
                    }
                    onPress={() => {
                      void markReadMutation.mutateAsync(notification.id);
                    }}
                    variant="secondary"
                  />
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No notifications are available.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Delivery note">
        <Text style={styles.copy}>
          Push registration and category-based delivery still depend on the mobile notifications tranche, but inbox state is now wired to live records.
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
    label: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    list: {
      gap: 12,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 8,
      padding: 14,
    },
    value: {
      color: colors.textTertiary,
      fontSize: 13,
    },
  });
}
