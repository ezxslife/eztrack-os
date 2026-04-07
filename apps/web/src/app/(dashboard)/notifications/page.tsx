"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Radio,
  FileText,
  RefreshCw,
  UserCheck,
  Briefcase,
  ServerCrash,
  Share2,
  ClipboardCheck,
  Settings,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/lib/queries/notifications";

/* ── Types ── */
type NotificationType =
  | "incident_created"
  | "incident_assigned"
  | "dispatch_alert"
  | "briefing_shared"
  | "status_change"
  | "follow_up_required"
  | "case_update"
  | "system_alert"
  | "share_received"
  | "form_completed";

type FilterTab = "all" | "unread" | "incidents" | "dispatches" | "briefings" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  href: string;
  group: "today" | "yesterday" | "earlier";
}

/* ── Icon map ── */
const typeIcon: Record<NotificationType, typeof Bell> = {
  incident_created: AlertTriangle,
  incident_assigned: UserCheck,
  dispatch_alert: Radio,
  briefing_shared: FileText,
  status_change: RefreshCw,
  follow_up_required: Bell,
  case_update: Briefcase,
  system_alert: ServerCrash,
  share_received: Share2,
  form_completed: ClipboardCheck,
};

const typeColor: Record<NotificationType, string> = {
  incident_created: "var(--status-critical)",
  incident_assigned: "var(--status-warning)",
  dispatch_alert: "var(--status-critical)",
  briefing_shared: "var(--status-info)",
  status_change: "var(--status-success)",
  follow_up_required: "var(--status-warning)",
  case_update: "var(--status-info)",
  system_alert: "var(--text-tertiary)",
  share_received: "var(--action-primary)",
  form_completed: "var(--status-success)",
};

const typeFilterMap: Record<NotificationType, FilterTab> = {
  incident_created: "incidents",
  incident_assigned: "incidents",
  dispatch_alert: "dispatches",
  briefing_shared: "briefings",
  status_change: "system",
  follow_up_required: "incidents",
  case_update: "incidents",
  system_alert: "system",
  share_received: "briefings",
  form_completed: "system",
};

/* ── Helper: map DB row to UI Notification ── */
function dbRowToNotification(row: NotificationRow): Notification {
  const now = new Date();
  const created = new Date(row.createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  let timestamp = "Just now";
  if (diffDays >= 2) timestamp = `${diffDays} days ago`;
  else if (diffDays === 1) timestamp = "1 day ago";
  else if (diffHrs >= 1) timestamp = `${diffHrs} hr ago`;
  else if (diffMin >= 1) timestamp = `${diffMin} min ago`;

  let group: "today" | "yesterday" | "earlier" = "today";
  if (diffDays >= 2) group = "earlier";
  else if (diffDays === 1) group = "yesterday";

  return {
    id: row.id,
    type: (row.type as NotificationType) || "system_alert",
    title: row.title || "Notification",
    description: row.message || "",
    timestamp,
    read: row.read,
    href: row.actionUrl || "#",
    group,
  };
}

/* ── Filter Tabs ── */
const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "incidents", label: "Incidents" },
  { value: "dispatches", label: "Dispatches" },
  { value: "briefings", label: "Briefings" },
  { value: "system", label: "System" },
];

const GROUP_LABELS: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not authenticated"); setLoading(false); return; }
      setCurrentUserId(user.id);

      const rows = await fetchNotifications(user.id);
      setNotifications(rows.map(dbRowToNotification));
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  /* Realtime subscription for notifications table */
  useRealtimeSubscription<Record<string, unknown>>({
    table: "notifications",
    filter: currentUserId ? `user_id=eq.${currentUserId}` : undefined,
    enabled: !!currentUserId,
    onInsert: useCallback(
      (record: Record<string, unknown>) => {
        const newNotif: Notification = {
          id: (record.id as string) || `notif-${Date.now()}`,
          type: ((record.type as string) || "system_alert") as NotificationType,
          title: (record.title as string) || "New Notification",
          description: (record.message as string) || "",
          timestamp: "Just now",
          read: false,
          href: (record.action_url as string) || "#",
          group: "today",
        };
        setNotifications((prev) => [newNotif, ...prev]);
        toast(`New: ${newNotif.title}`, { variant: "info" });
      },
      [toast],
    ),
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => typeFilterMap[n.type] === activeTab);
  }, [activeTab, notifications]);

  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    for (const n of filtered) {
      if (!groups[n.group]) groups[n.group] = [];
      groups[n.group].push(n);
    }
    return groups;
  }, [filtered]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast("Failed to mark as read", { variant: "error" });
    }
  };

  const markAllRead = async () => {
    if (!currentUserId) return;
    try {
      await markAllNotificationsRead(currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast("All notifications marked as read", { variant: "success" });
    } catch {
      toast("Failed to mark all as read", { variant: "error" });
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge tone="info" dot>
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
              Stay updated on incidents, dispatches, and system events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark All Read
          </Button>
          <Link href="/settings/notification-rules">
            <Button variant="ghost" size="sm">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1 border-b border-[var(--border-default)]">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-2 text-[13px] font-medium transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab.value
                ? "text-[var(--action-primary)] border-[var(--action-primary)]"
                : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
        </div>
      )}
      {error && !loading && (
        <div className="text-center py-8 text-[13px]" style={{ color: "var(--status-critical)" }}>
          {error}
        </div>
      )}

      {/* ── Notification List ── */}
      {!loading && !error && <div className="space-y-5">
        {(["today", "yesterday", "earlier"] as const).map((groupKey) => {
          const items = grouped[groupKey];
          if (!items || items.length === 0) return null;

          return (
            <div key={groupKey}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
                {GROUP_LABELS[groupKey]}
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] divide-y divide-[var(--border-default)] overflow-hidden">
                {items.map((notification) => {
                  const Icon = typeIcon[notification.type];
                  const iconColor = typeColor[notification.type];

                  return (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => markAsRead(notification.id)}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--surface-hover)] ${
                        !notification.read
                          ? "bg-[var(--surface-secondary)]"
                          : ""
                      }`}
                    >
                      {/* Unread dot */}
                      <div className="pt-1.5 w-2 shrink-0">
                        {!notification.read && (
                          <span
                            className="block h-2 w-2 rounded-full"
                            style={{ backgroundColor: "var(--action-primary)" }}
                          />
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
                        }}
                      >
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: iconColor }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[13px] leading-tight ${
                            !notification.read
                              ? "font-semibold text-[var(--text-primary)]"
                              : "font-medium text-[var(--text-primary)]"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                          {notification.description}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap shrink-0 pt-0.5">
                        {notification.timestamp}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-[var(--text-tertiary)]">
            No notifications match this filter
          </div>
        )}
      </div>}
    </div>
  );
}
