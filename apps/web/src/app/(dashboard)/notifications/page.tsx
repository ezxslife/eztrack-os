"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

/* ── Mock Data ── */
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "incident_created",
    title: "New Incident: Disturbance at Gate B",
    description: "A physical altercation was reported near Gate B entrance. Officers dispatched.",
    timestamp: "2 min ago",
    read: false,
    href: "/incidents/101",
    group: "today",
  },
  {
    id: "n2",
    type: "dispatch_alert",
    title: "Dispatch: Medical Emergency - Main Stage",
    description: "Patron collapsed near front barrier. EMT team en route, ETA 3 minutes.",
    timestamp: "18 min ago",
    read: false,
    href: "/dispatch",
    group: "today",
  },
  {
    id: "n3",
    type: "incident_assigned",
    title: "Incident #098 assigned to you",
    description: "Suspicious package report in Lot C has been assigned to your queue.",
    timestamp: "45 min ago",
    read: false,
    href: "/incidents/98",
    group: "today",
  },
  {
    id: "n4",
    type: "briefing_shared",
    title: "Briefing: Evening Shift Handoff posted",
    description: "Sgt. Patel shared the evening shift briefing. 3 priority items require acknowledgment.",
    timestamp: "1 hr ago",
    read: false,
    href: "/briefings/1",
    group: "today",
  },
  {
    id: "n5",
    type: "status_change",
    title: "Incident #095 status changed to Resolved",
    description: "The noise complaint at VIP Lounge has been resolved and closed by Lt. Nguyen.",
    timestamp: "2 hr ago",
    read: true,
    href: "/incidents/95",
    group: "today",
  },
  {
    id: "n6",
    type: "follow_up_required",
    title: "Follow-up required: Incident #092",
    description: "Witness statement still pending for the theft report at Merch Tent A.",
    timestamp: "5 hr ago",
    read: true,
    href: "/incidents/92",
    group: "yesterday",
  },
  {
    id: "n7",
    type: "case_update",
    title: "Case #045 evidence uploaded",
    description: "New surveillance footage added to the ongoing investigation for Case #045.",
    timestamp: "8 hr ago",
    read: true,
    href: "/cases/45",
    group: "yesterday",
  },
  {
    id: "n8",
    type: "system_alert",
    title: "System: Radio channel reassignment",
    description: "Channels 3 and 7 have been reassigned for evening operations effective 6 PM.",
    timestamp: "1 day ago",
    read: true,
    href: "/settings/integrations",
    group: "yesterday",
  },
  {
    id: "n9",
    type: "share_received",
    title: "Report shared with you",
    description: "Capt. Chen shared the weekly incident summary report for your review.",
    timestamp: "2 days ago",
    read: true,
    href: "/reports/weekly",
    group: "earlier",
  },
  {
    id: "n10",
    type: "form_completed",
    title: "Daily log form submitted",
    description: "Your daily activity log for April 2 has been submitted and confirmed.",
    timestamp: "3 days ago",
    read: true,
    href: "/daily-log",
    group: "earlier",
  },
];

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
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

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

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

      {/* ── Notification List ── */}
      <div className="space-y-5">
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
      </div>
    </div>
  );
}
