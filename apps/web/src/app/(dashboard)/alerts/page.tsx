"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
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
} from "lucide-react";

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

/* ── Mock data ── */
const INITIAL_ALERTS: AlertItem[] = [
  {
    id: "ALR-001",
    title: "Active shooter reported - Gate C",
    description:
      "Security team dispatched. All gates locked down. Law enforcement en route. Perimeter sweep initiated at sectors 4-7.",
    priority: "critical",
    status: "active",
    module: "incident",
    timestamp: "2026-04-05T14:58:00",
    relativeTime: "2 min ago",
    relatedLink: "/incidents/INC-2026-041",
    relatedLabel: "INC-2026-041",
    timeline: [
      { action: "Alert created", timestamp: "2:58 PM", user: "System" },
      { action: "Dispatch notified", timestamp: "2:58 PM", user: "System" },
    ],
    responseNotes: "All available units responding. Command post at Lot B.",
  },
  {
    id: "ALR-002",
    title: "Medical emergency - Main Stage",
    description:
      "Patron collapsed near stage left. EMS unit 3 dispatched. Possible heat exhaustion.",
    priority: "critical",
    status: "active",
    module: "dispatch",
    timestamp: "2026-04-05T14:55:00",
    relativeTime: "5 min ago",
    relatedLink: "/dispatch/DSP-2026-118",
    relatedLabel: "DSP-2026-118",
    timeline: [
      { action: "Alert created", timestamp: "2:55 PM", user: "System" },
      { action: "EMS dispatched", timestamp: "2:55 PM", user: "Dispatch Ops" },
    ],
    responseNotes: "EMS Unit 3 en route. AED requested.",
  },
  {
    id: "ALR-003",
    title: "Patron banned - attempting re-entry at Gate A",
    description:
      "Known banned individual Marcus T. flagged by facial recognition at Gate A turnstile.",
    priority: "high",
    status: "active",
    module: "patron",
    timestamp: "2026-04-05T14:50:00",
    relativeTime: "10 min ago",
    relatedLink: "/patrons/PAT-8821",
    relatedLabel: "PAT-8821",
    timeline: [
      { action: "Facial recognition match", timestamp: "2:50 PM", user: "System" },
      { action: "Gate A security notified", timestamp: "2:50 PM", user: "System" },
    ],
    responseNotes: "Gate supervisor responding.",
  },
  {
    id: "ALR-004",
    title: "Evidence chain of custody break - Case #C-2024-003",
    description:
      "Evidence bag E-4421 scanned out by unauthorized personnel. Chain of custody integrity compromised.",
    priority: "high",
    status: "acknowledged",
    module: "case",
    timestamp: "2026-04-05T14:45:00",
    relativeTime: "15 min ago",
    relatedLink: "/cases/C-2024-003",
    relatedLabel: "C-2024-003",
    timeline: [
      { action: "Alert created", timestamp: "2:45 PM", user: "System" },
      { action: "Acknowledged by J. Rivera", timestamp: "2:47 PM", user: "J. Rivera" },
    ],
    responseNotes: "Investigating scan log discrepancy. Supervisor notified.",
  },
  {
    id: "ALR-005",
    title: "Work order overdue - Generator maintenance",
    description:
      "Scheduled generator maintenance WO-3312 is 48 hours overdue. Backup power at risk.",
    priority: "medium",
    status: "active",
    module: "work_order",
    timestamp: "2026-04-05T14:30:00",
    relativeTime: "30 min ago",
    relatedLink: "/work-orders/WO-3312",
    relatedLabel: "WO-3312",
    timeline: [
      { action: "Alert created", timestamp: "2:30 PM", user: "System" },
    ],
    responseNotes: "",
  },
  {
    id: "ALR-006",
    title: "Visitor overstay - John Smith (4h past checkout)",
    description:
      "Visitor John Smith checked in at 8:00 AM with scheduled checkout at 10:00 AM. Still on premises.",
    priority: "medium",
    status: "active",
    module: "visitor",
    timestamp: "2026-04-05T14:15:00",
    relativeTime: "45 min ago",
    relatedLink: "/visitors/VIS-9923",
    relatedLabel: "VIS-9923",
    timeline: [
      { action: "Overstay detected", timestamp: "2:15 PM", user: "System" },
    ],
    responseNotes: "",
  },
  {
    id: "ALR-007",
    title: "Shift change in 30 minutes",
    description:
      "Evening shift (Team Bravo) begins at 3:30 PM. 2 personnel have not confirmed availability.",
    priority: "low",
    status: "acknowledged",
    module: "personnel",
    timestamp: "2026-04-05T14:00:00",
    relativeTime: "1 hr ago",
    relatedLink: "/personnel/schedule",
    relatedLabel: "Shift Schedule",
    timeline: [
      { action: "Alert created", timestamp: "2:00 PM", user: "System" },
      { action: "Acknowledged by Shift Lead", timestamp: "2:05 PM", user: "M. Torres" },
    ],
    responseNotes: "Contacting unconfirmed personnel.",
  },
  {
    id: "ALR-008",
    title: "New anonymous report submitted",
    description:
      "Anonymous tip received regarding suspicious package near restroom block C. No photo attached.",
    priority: "low",
    status: "active",
    module: "anonymous",
    timestamp: "2026-04-05T13:55:00",
    relativeTime: "1 hr ago",
    relatedLink: "/anonymous-reports/AR-0087",
    relatedLabel: "AR-0087",
    timeline: [
      { action: "Report received", timestamp: "1:55 PM", user: "System" },
    ],
    responseNotes: "",
  },
  {
    id: "ALR-009",
    title: "Fire alarm triggered - Building 2, Floor 3",
    description:
      "Smoke detector activation in server room 3B. No visible smoke reported by on-site staff.",
    priority: "critical",
    status: "acknowledged",
    module: "incident",
    timestamp: "2026-04-05T13:40:00",
    relativeTime: "1.5 hr ago",
    relatedLink: "/incidents/INC-2026-040",
    relatedLabel: "INC-2026-040",
    timeline: [
      { action: "Alert created", timestamp: "1:40 PM", user: "System" },
      { action: "Fire dept notified", timestamp: "1:41 PM", user: "System" },
      { action: "Acknowledged by K. Park", timestamp: "1:43 PM", user: "K. Park" },
    ],
    responseNotes: "Likely false alarm - HVAC maintenance in progress. Fire dept confirmed.",
  },
  {
    id: "ALR-010",
    title: "Dispatch unit offline - Unit 7",
    description:
      "Dispatch Unit 7 has not reported status in 25 minutes. Last known location: Parking Lot D.",
    priority: "high",
    status: "active",
    module: "dispatch",
    timestamp: "2026-04-05T13:35:00",
    relativeTime: "1.5 hr ago",
    relatedLink: "/dispatch/units/U-007",
    relatedLabel: "Unit 7",
    timeline: [
      { action: "Unit went offline", timestamp: "1:35 PM", user: "System" },
    ],
    responseNotes: "",
  },
  {
    id: "ALR-011",
    title: "Case deadline approaching - C-2024-007",
    description:
      "Evidence submission deadline for Case C-2024-007 is in 4 hours. 3 items still pending upload.",
    priority: "medium",
    status: "acknowledged",
    module: "case",
    timestamp: "2026-04-05T13:20:00",
    relativeTime: "2 hr ago",
    relatedLink: "/cases/C-2024-007",
    relatedLabel: "C-2024-007",
    timeline: [
      { action: "Deadline warning", timestamp: "1:20 PM", user: "System" },
      { action: "Acknowledged by R. Chen", timestamp: "1:25 PM", user: "R. Chen" },
    ],
    responseNotes: "Uploading remaining evidence now.",
  },
  {
    id: "ALR-012",
    title: "HVAC failure - Control Room A",
    description:
      "Temperature in Control Room A has risen to 88F. HVAC unit non-responsive. Equipment at risk.",
    priority: "high",
    status: "active",
    module: "work_order",
    timestamp: "2026-04-05T13:10:00",
    relativeTime: "2 hr ago",
    relatedLink: "/work-orders/WO-3318",
    relatedLabel: "WO-3318",
    timeline: [
      { action: "Temperature threshold exceeded", timestamp: "1:10 PM", user: "System" },
    ],
    responseNotes: "",
  },
  {
    id: "ALR-013",
    title: "VIP visitor arrival - Gov. Williams",
    description:
      "Governor Williams motorcade ETA 20 minutes. Escort team and protocol checklist required.",
    priority: "medium",
    status: "resolved",
    module: "visitor",
    timestamp: "2026-04-05T12:30:00",
    relativeTime: "2.5 hr ago",
    relatedLink: "/visitors/VIS-9930",
    relatedLabel: "VIS-9930",
    timeline: [
      { action: "Alert created", timestamp: "12:30 PM", user: "System" },
      { action: "Acknowledged by Command", timestamp: "12:32 PM", user: "Command" },
      { action: "Resolved - Arrival complete", timestamp: "12:55 PM", user: "S. Adams" },
    ],
    responseNotes: "Governor arrived safely. Protocol executed.",
  },
  {
    id: "ALR-014",
    title: "Personnel certification expired - D. Kim",
    description:
      "Officer D. Kim's firearms certification expired 3 days ago. Restricted from armed duty.",
    priority: "low",
    status: "active",
    module: "personnel",
    timestamp: "2026-04-05T12:00:00",
    relativeTime: "3 hr ago",
    relatedLink: "/personnel/PER-0442",
    relatedLabel: "PER-0442",
    timeline: [
      { action: "Certification expiry detected", timestamp: "12:00 PM", user: "System" },
    ],
    responseNotes: "",
  },
  {
    id: "ALR-015",
    title: "Suspicious vehicle reported - Lot F",
    description:
      "Anonymous report of unattended vehicle with out-of-state plates idling in restricted area of Lot F.",
    priority: "high",
    status: "resolved",
    module: "anonymous",
    timestamp: "2026-04-05T11:30:00",
    relativeTime: "3.5 hr ago",
    relatedLink: "/anonymous-reports/AR-0085",
    relatedLabel: "AR-0085",
    timeline: [
      { action: "Report received", timestamp: "11:30 AM", user: "System" },
      { action: "Patrol dispatched", timestamp: "11:32 AM", user: "Dispatch Ops" },
      { action: "Vehicle identified - authorized contractor", timestamp: "11:45 AM", user: "Officer L. Diaz" },
      { action: "Resolved", timestamp: "11:50 AM", user: "Officer L. Diaz" },
    ],
    responseNotes: "Vehicle belongs to authorized HVAC contractor. Parking pass issued.",
  },
  {
    id: "ALR-016",
    title: "Crowd density warning - Section 12",
    description:
      "Crowd density in Section 12 has exceeded 85% capacity threshold. Recommend flow control.",
    priority: "medium",
    status: "active",
    module: "incident",
    timestamp: "2026-04-05T14:52:00",
    relativeTime: "8 min ago",
    relatedLink: "/incidents/INC-2026-042",
    relatedLabel: "INC-2026-042",
    timeline: [
      { action: "Threshold exceeded", timestamp: "2:52 PM", user: "System" },
    ],
    responseNotes: "",
  },
];

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
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [activeTab, setActiveTab] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

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
  const acknowledgeAlert = (id: string) => {
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
  };

  const resolveAlert = (id: string) => {
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
  };

  const markAllRead = () => {
    const activeCount = alerts.filter((a) => a.status === "active").length;
    if (activeCount === 0) {
      toast("No active alerts to acknowledge", { variant: "info" });
      return;
    }
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

      {/* Main content: alert list + detail sidebar */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
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
                            acknowledgeAlert(alert.id);
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
                            resolveAlert(alert.id);
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
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
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
      </div>
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
