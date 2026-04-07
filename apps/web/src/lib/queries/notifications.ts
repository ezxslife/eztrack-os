import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface NotificationRow {
  id: string;
  orgId: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

/* ─── Fetch notifications for a user ─────────────── */

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url,
    metadata: row.metadata,
    read: row.read,
    createdAt: row.created_at,
  }));
}

/* ─── Mark a single notification as read ─────────── */

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

/* ─── Mark all notifications read for a user ─────── */

export async function markAllNotificationsRead(userId: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
}
