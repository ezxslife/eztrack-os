import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  getNotificationRoute,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotifications,
} from "@/lib/queries/notifications";
import { useThemeColors } from "@/theme";

function NotificationsContent() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
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
      subtitle="Live inbox, push-aware routes, and shared deep-link resolution."
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
            notifications.map((notification) => {
              const route = getNotificationRoute(notification);

              return (
                <Pressable
                  key={notification.id}
                  onPress={() => {
                    if (!notification.read) {
                      void markReadMutation.mutateAsync(notification.id);
                    }

                    router.push(route as never);
                  }}
                  style={styles.row}
                >
                  <Text style={styles.label}>{notification.title}</Text>
                  {notification.message ? (
                    <Text style={styles.copy}>{notification.message}</Text>
                  ) : null}
                  <Text style={styles.value}>
                    {notification.type} · {formatRelativeTimestamp(notification.createdAt)}
                  </Text>
                  <Text style={styles.value}>
                    {notification.read ? "Read" : "Unread"} · {route}
                  </Text>
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
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.copy}>No notifications are available.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Delivery">
        <Text style={styles.copy}>
          Push registration now happens at runtime. Foreground deliveries refresh the inbox,
          sync unread badge counts, and use the same route resolver as the history view.
        </Text>
      </SectionCard>
    </ScreenContainer>
  );
}

export default function NotificationsScreen() {
  return (
    <RequireLiveSession
      detail="Notifications rely on live inbox records and push registration in this tranche."
      title="Notifications"
    >
      <NotificationsContent />
    </RequireLiveSession>
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
