import { useEffect, useRef } from "react";

import { resolveNotificationRoute } from "@eztrack/shared";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

import { useSessionContext } from "@/hooks/useSessionContext";
import { triggerNotificationHaptic } from "@/lib/haptics";
import {
  getPushProjectId,
  upsertDeviceRegistration,
} from "@/lib/push-registration";
import { useNotifications } from "@/lib/queries/notifications";
import { getSupabase } from "@/lib/supabase";
import { useToast } from "@/providers/ToastProvider";

const CATEGORY_ID = "EZTRACK_NOTIFICATION";
const OPEN_ACTION_ID = "OPEN_RECORD";
const MARK_READ_ACTION_ID = "MARK_READ";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getNotificationPayload(
  notification: Notifications.Notification | Notifications.NotificationResponse["notification"]
) {
  const data = notification.request.content.data as Record<string, unknown>;

  return {
    actionUrl: typeof data.actionUrl === "string" ? data.actionUrl : null,
    metadata:
      data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : data,
    notificationId:
      typeof data.notificationId === "string"
        ? data.notificationId
        : typeof data.id === "string"
          ? data.id
          : null,
    title: notification.request.content.title ?? "Notification",
    type: typeof data.type === "string" ? data.type : "system_alert",
  };
}

async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      buttonTitle: "Open",
      identifier: OPEN_ACTION_ID,
      options: {
        opensAppToForeground: true,
      },
    },
    {
      buttonTitle: "Mark Read",
      identifier: MARK_READ_ACTION_ID,
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

async function ensurePushRegistration() {
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === "granted"
      ? current
      : await Notifications.requestPermissionsAsync();

  if (permission.status !== "granted") {
    return false;
  }

  const projectId = getPushProjectId();
  if (!projectId) {
    return false;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await upsertDeviceRegistration(token.data);
  return true;
}

export function NotificationsBridge() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { authLifecycle, canAccessProtected, profile, usePreviewData } = useSessionContext();
  const notificationsQuery = useNotifications();
  const registrationAttemptedRef = useRef(false);
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    if (!canAccessProtected || usePreviewData || authLifecycle !== "active" || !profile?.id) {
      void Notifications.setBadgeCountAsync(0);
      registrationAttemptedRef.current = false;
      return;
    }

    if (registrationAttemptedRef.current) {
      return;
    }

    registrationAttemptedRef.current = true;

    void registerNotificationCategories();
    void ensurePushRegistration().catch((error) => {
      console.warn("[Notifications] Push registration failed.", error);
    });
  }, [authLifecycle, canAccessProtected, profile?.id, usePreviewData]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    void Notifications.setBadgeCountAsync(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const payload = getNotificationPayload(notification);
        triggerNotificationHaptic("success");
        showToast({
          message:
            notification.request.content.body ??
            "A new notification has been delivered to your inbox.",
          title: payload.title,
          tone: "info",
        });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const payload = getNotificationPayload(response.notification);

        if (payload.notificationId) {
          void getSupabase()
            .from("notifications")
            .update({ read: true })
            .eq("id", payload.notificationId);
        }

        void queryClient.invalidateQueries({ queryKey: ["notifications"] });

        if (response.actionIdentifier === MARK_READ_ACTION_ID) {
          return;
        }

        const route = resolveNotificationRoute({
          actionUrl: payload.actionUrl,
          metadata: payload.metadata,
          type: payload.type,
        });

        void Linking.openURL(Linking.createURL(route));
      }
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [queryClient, showToast]);

  return null;
}
