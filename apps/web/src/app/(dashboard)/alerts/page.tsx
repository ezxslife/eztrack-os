"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Bell,
  BellOff,
  Search,
  CheckCheck,
  Eye,
  Clock,
  AlertTriangle,
  Shield,
  Truck,
  Briefcase,
  Wrench,
  Users,
  UserCheck,
  MessageSquare,
  ChevronRight,
  X,
  FileText,
  Activity,
  Loader2,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchAlerts as fetchAlertsQuery,
  acknowledgeAlert as acknowledgeAlertQuery,
  resolveAlert as resolveAlertQuery,
  type AlertRow,
} from "@/lib/queries/alerts";

/* ── Types ── */
type Priority = "critical" | "high" | "medium" | "low";
type Status = "active" | "acknowledged" | "resolved";
type Module =
  | "incident"
  | "dispatch"
  | "case"
  | "work_order"
  | "visitor"
  | "personnel"
  | "patron"
  | "anonymous";

interface TimelineEntry {
  action: string;
  timestamp: string;
  user: string;
}

interface AlertItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  module: Module;
  timestamp: string;
  relativeTime: string;
  relatedLink: string;
  relatedLabel: string;
  timeline: TimelineEntry[];
  responseNotes: string;
}

/* ── Helper: map DB row to UI AlertItem ── */
function dbRowToAlertItem(row: AlertRow): AlertItem {
  const now = new Date();
  const created = new Date(row.createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  let relativeTime = "Just now";
  if (diffMin >= 60) {
    const hrs = Math.floor(diffMin / 60);
    relativeTime = `${hrs} hr ago`;
  } else if (diffMin > 0) {
    relativeTime = `${diffMin} min ago`;
  }

  const status: Status = row.acknowledgedAt
    ? row.deletedAt
      ? "resolved"
      : "acknowledged"
    : "active";

  return {
    id: row.id,
    title: row.title || "Untitled Alert",
    description: row.message || "",
    priority: (row.severity as Priority) || "medium",
    status,
    module: (row.alertType as Module) || "incident",
    timestamp: row.createdAt,
    relativeTime,
    relatedLink: "#",
    relatedLabel: "",
    timeline: [{ action: "Alert created", timestamp: created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), user: "System" }],
    responseNotes: "",
  };
}

/* ── Helpers ── */
const priorityConfig: Record<Priority, { color: string; label: string; tone: "critical" | "warning" | "attention" | "success" }> = {
  critical: { color: "#ef4444", label: "Critical", tone: "critical" },
  high: { color: "#f97316", label: "High", tone: "warning" },
  medium: { color: "#eab308", label: "Medium", tone: "attention" },
  low: { color: "#22c55e", label: "Low", tone: "success" },
};

const statusConfig: Record<Status, { label: string; tone: "critical" | "warning" | "success" }> = {
  active: { label: "Active", tone: "critical" },
  acknowledged: { label: "Acknowledged", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
};

const moduleConfig: Record<Module, { label: string; icon: typeof Bell }> = {
  incident: { label: "Incidents", icon: AlertTriangle },
  dispatch: { label: "Dispatch", icon: Truck },
  case: { label: "Cases", icon: Briefcase },
  work_order: { label: "Work Orders", icon: Wrench },
  visitor: { label: "Visitors", icon: Users },
  personnel: { label: "Personnel", icon: UserCheck },
  patron: { label: "Patrons", icon: Shield },
  anonymous: { label: "Anonymous", icon: MessageSquare },
};

const priorityOptions = [
  { value: "all", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const moduleOptions = [
  { value: "all", label: "All Modules" },
  { value: "incident", label: "Incidents" },
  { value: "dispatch", label: "Dispatch" },
  { value: "case", label: "Cases" },
  { value: "work_order", label: "Work Orders" },
  { value: "visitor", label: "Visitors" },
  { value: "personnel", label: "Personnel" },
  { value: "patron", label: "Patrons" },
  { value: "anonymous", label: "Anonymous" },
];

/* ── Page ── */
export default function AlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  /* Fetch user + org, then load alerts */
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not authenticated"); setLoading(false); return; }
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      const orgId = profile?.org_id;
      if (!orgId) { setError("No organization found"); setLoading(false); return; }
      setCurrentOrgId(orgId);

      const rows = await fetchAlertsQuery(orgId);
      setAlerts(rows.map(dbRowToAlertItem));
    } catch (err: any) {
      setError(err?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  /* Realtime subscription for alerts table */
  useRealtimeSubscription<Record<string, unknown>>({
    table: "alerts",
    onInsert: useCallback(
      (record: Record<string, unknown>) => {
        const newAlert: AlertItem = {
          id: (record.record_number as string) || (record.id as string) || `ALR-RT-${Date.now()}`,
          title: (record.title as string) || "New Alert",
          description: (record.description as string) || "",
          priority: ((record.priority as string) || "medium") as Priority,
          status: "active" as Status,
          module: ((record.module as string) || "incident") as Module,
          timestamp: (record.created_at as string) || new Date().toISOString(),
          relativeTime: "Just now",
          relatedLink: (record.related_link as string) || "#",
          relatedLabel: (record.related_label as string) || "",
          timeline: [{ action: "Alert created", timestamp: "Just now", user: "System" }],
          responseNotes: "",
        };
        setAlerts((prev) => [newAlert, ...prev]);
        toast(`New alert: ${newAlert.title}`, { variant: "info" });
      },
      [toast],
    ),
    onUpdate: useCallback(
      (record: Record<string, unknown>) => {
        setAlerts((prev) =>
          prev.map((a) => {
            const matchesId =
              a.id === (record.record_number as string) ||
              a.id === (record.id as string);
            if (!matchesId) return a;
            return {
              ...a,
              status: ((record.status as string) || a.status) as Status,
              priority: ((record.priority as string) || a.priority) as Priority,
              title: (record.title as string) || a.title,
              description: (record.description as string) || a.description,
            };
          }),
        );
      },
      [],
    ),
  });

  /* Counts */
  const counts = useMemo(() => ({
    all: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
  }), [alerts]);

  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "acknowledged", label: "Acknowledged", count: counts.acknowledged },
    { id: "resolved", label: "Resolved", count: counts.resolved },
  ];

  /* Filtered alerts */
  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (activeTab !== "all") {
      result = result.filter((a) => a.status === activeTab);
    }
    if (priorityFilter !== "all") {
      result = result.filter((a) => a.priority === priorityFilter);
    }
    if (moduleFilter !== "all") {
      result = result.filter((a) => a.module === moduleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      );
    }
    // Sort: critical first, then high, medium, low; active before acknowledged before resolved
    const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<Status, number> = { active: 0, acknowledged: 1, resolved: 2 };
    result.sort((a, b) => {
      const sd = statusOrder[a.status] - statusOrder[b.status];
      if (sd !== 0) return sd;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    return result;
  }, [alerts, activeTab, priorityFilter, moduleFilter, searchQuery]);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) ?? null;

  /* Actions */
  const handleAcknowledgeAlert = async (id: string) => {
    if (!currentUserId) return;
    try {
      await acknowledgeAlertQuery(id, currentUserId);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "acknowledged" as Status,
                timeline: [
                  ...a.timeline,
                  { action: "Acknowledged", timestamp: "Just now", user: "You" },
                ],
              }
            : a
        )
      );
      toast("Alert acknowledged", { variant: "success" });
    } catch {
      toast("Failed to acknowledge alert", { variant: "error" });
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await resolveAlertQuery(id);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "resolved" as Status,
                timeline: [
                  ...a.timeline,
                  { action: "Resolved", timestamp: "Just now", user: "You" },
                ],
              }
            : a
        )
      );
      toast("Alert resolved", { variant: "success" });
    } catch {
      toast("Failed to resolve alert", { variant: "error" });
    }
  };

  const markAllRead = () => {
    const activeCount = alerts.filter((a) => a.status === "active").length;
    if (activeCount === 0) {
      toast("No active alerts to acknowledge", { variant: "info" });
      return;
    }
    // Acknowledge each active alert in DB
    const activeAlerts = alerts.filter((a) => a.status === "active");
    activeAlerts.forEach((a) => {
      if (currentUserId) acknowledgeAlertQuery(a.id, currentUserId).catch(() => {});
    });
    setAlerts((prev) =>
      prev.map((a) =>
        a.status === "active"
          ? {
              ...a,
              status: "acknowledged" as Status,
              timeline: [
                ...a.timeline,
                { action: "Acknowledged (bulk)", timestamp: "Just now", user: "You" },
              ],
            }
          : a
      )
    );
    toast(`${activeCount} alerts acknowledged`, { variant: "success" });
  };

  return (
    <div style={{ fontSize: 13 }} className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Bell size={18} style={{ color: "var(--eztrack-primary-500, #6366f1)" }} />
          <h1
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Alert Center
          </h1>
          {counts.active > 0 && (
            <Badge tone="critical" dot>
              {counts.active} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Filter bar */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] max-w-[280px]">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-tertiary)" }}
            />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="w-full sm:w-[150px]">
          <Select
            options={priorityOptions}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[150px]">
          <Select
            options={moduleOptions}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Loading / Error states */}
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

      {/* Main content: alert list + detail sidebar */}
      {!loading && !error && <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
        {/* Alert list */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 260px)" }}>
          {filteredAlerts.length === 0 ? (
            <EmptyState
              icon={<BellOff size={22} />}
              title="No alerts found"
              description="No alerts match your current filters. Try adjusting your search or filter criteria."
            />
          ) : (
            filteredAlerts.map((alert) => {
              const pCfg = priorityConfig[alert.priority];
              const sCfg = statusConfig[alert.status];
              const mCfg = moduleConfig[alert.module];
              const ModIcon = mCfg.icon;
              const isSelected = selectedAlertId === alert.id;

              return (
                <Card
                  key={alert.id}
                  hover
                  onClick={() => setSelectedAlertId(alert.id)}
                  className="!rounded-lg !p-0 overflow-hidden"
                  style={{
                    borderLeft: `3px solid ${pCfg.color}`,
                    ...(isSelected
                      ? {
                          borderColor: "var(--eztrack-primary-500, #6366f1)",
                          borderLeftColor: pCfg.color,
                          background: "var(--surface-secondary)",
                        }
                      : {}),
                  }}
                >
                  <div className="px-3 py-2.5 flex items-start gap-2.5">
                    {/* Priority dot */}
                    <span
                      className="mt-1 h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: pCfg.color }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="font-medium text-[13px] leading-tight truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {alert.title}
                        </span>
                      </div>
                      <p
                        className="text-[12px] mt-0.5 line-clamp-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge tone={pCfg.tone}>{pCfg.label}</Badge>
                        <Badge tone={sCfg.tone} dot>{sCfg.label}</Badge>
                        <Badge tone="default">
                          <ModIcon size={10} className="inline -mt-px mr-0.5" />
                          {mCfg.label}
                        </Badge>
                        <span
                          className="text-[11px] ml-auto flex items-center gap-0.5 shrink-0"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Clock size={10} />
                          {alert.relativeTime}
                        </span>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {alert.status === "active" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledgeAlert(alert.id);
                          }}
                        >
                          Ack
                        </Button>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveAlert(alert.id);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Detail sidebar — visible on larger screens */}
        <div
          className="w-full lg:w-[340px] lg:shrink-0 flex flex-col rounded-xl border overflow-y-auto"
          style={{
            borderColor: "var(--border-default)",
            background: "var(--surface-primary)",
            maxHeight: "calc(100vh - 260px)",
          }}
        >
          {selectedAlert ? (
            <AlertDetail
              alert={selectedAlert}
              onAcknowledge={handleAcknowledgeAlert}
              onResolve={handleResolveAlert}
              onClose={() => setSelectedAlertId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState
                icon={<Eye size={20} />}
                title="Select an alert"
                description="Click on an alert to view its details, timeline, and related records."
              />
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}

/* ── Detail sidebar component ── */
function AlertDetail({
  alert,
  onAcknowledge,
  onResolve,
  onClose,
}: {
  alert: AlertItem;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onClose: () => void;
}) {
  const pCfg = priorityConfig[alert.priority];
  const sCfg = statusConfig[alert.status];
  const mCfg = moduleConfig[alert.module];
  const ModIcon = mCfg.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-start justify-between gap-2 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="min-w-0">
          <span
            className="text-[11px] font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {alert.id}
          </span>
          <h2
            className="text-[13px] font-semibold mt-0.5 leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {alert.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-[var(--surface-hover)] transition-colors"
        >
          <X size={14} style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* Status + badges */}
      <div className="px-4 py-2.5 flex items-center gap-1.5 flex-wrap border-b" style={{ borderColor: "var(--border-default)" }}>
        <Badge tone={pCfg.tone}>{pCfg.label}</Badge>
        <Badge tone={sCfg.tone} dot>{sCfg.label}</Badge>
        <Badge tone="default">
          <ModIcon size={10} className="inline -mt-px mr-0.5" />
          {mCfg.label}
        </Badge>
        <span className="ml-auto text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {alert.relativeTime}
        </span>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
          Description
        </h3>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {alert.description}
        </p>
      </div>

      {/* Timeline */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
          Timeline
        </h3>
        <div className="flex flex-col gap-2">
          {alert.timeline.map((entry, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-1.5 shrink-0">
                <span
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--eztrack-primary-500, #6366f1)" }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                  {entry.action}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {entry.timestamp}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    -
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {entry.user}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related records */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
          Related Records
        </h3>
        <a
          href={alert.relatedLink}
          className="inline-flex items-center gap-1 text-[12px] font-medium rounded-md px-2 py-1 transition-colors"
          style={{
            color: "var(--eztrack-primary-500, #6366f1)",
            background: "var(--surface-secondary)",
          }}
        >
          <FileText size={12} />
          {alert.relatedLabel}
          <ChevronRight size={12} />
        </a>
      </div>

      {/* Response notes */}
      {alert.responseNotes && (
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
            Response Notes
          </h3>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {alert.responseNotes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 mt-auto flex items-center gap-2">
        {alert.status === "active" && (
          <Button size="sm" onClick={() => onAcknowledge(alert.id)}>
            <CheckCheck size={13} />
            Acknowledge
          </Button>
        )}
        {alert.status === "acknowledged" && (
          <Button size="sm" onClick={() => onResolve(alert.id)}>
            <Activity size={13} />
            Resolve
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => window.location.href = alert.relatedLink}>
          <Eye size={13} />
          View Record
        </Button>
      </div>
    </div>
  );
}
