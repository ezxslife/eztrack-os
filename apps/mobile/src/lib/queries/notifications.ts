import { resolveNotificationRoute } from "@eztrack/shared/notifications";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface NotificationRow {
  actionUrl: string | null;
  createdAt: string;
  id: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  orgId: string;
  read: boolean;
  title: string;
  type: string;
  userId: string;
}

async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    actionUrl: row.action_url ?? null,
    createdAt: row.created_at,
    id: row.id,
    message: row.message ?? null,
    metadata: row.metadata ?? null,
    orgId: row.org_id,
    read: row.read ?? false,
    title: row.title,
    type: row.type,
    userId: row.user_id,
  }));
}

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    throw error;
  }
}

export function useNotifications() {
  const { canAccessProtected, profile } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(profile?.id),
    queryFn: () => fetchNotifications(profile!.id),
    queryKey: ["notifications", profile?.id ?? "unknown"],
  });
}

export function getNotificationRoute(notification: Pick<NotificationRow, "actionUrl" | "metadata" | "type">) {
  return resolveNotificationRoute({
    actionUrl: notification.actionUrl,
    metadata: notification.metadata,
    type: notification.type,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  const { profile } = useSessionContext();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(profile!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
