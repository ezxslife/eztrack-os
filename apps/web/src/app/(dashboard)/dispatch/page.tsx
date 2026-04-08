"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  Radio,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Eye,
  Coffee,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import dynamic from "next/dynamic";
import {
  fetchDispatches,
  fetchOnDutyOfficers,
  createDispatch,
  updateDispatch,
  updateDispatchStatus,
  assignOfficerToDispatch,
  clearDispatch as clearDispatchApi,
  type DispatchCard as DispatchCardType,
  type OfficerOnDuty,
} from "@/lib/queries/dispatches";
import { createIncident } from "@/lib/queries/incidents";
import { exportCSV } from "@/lib/queries/reports";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { formatRelativeTime } from "@/lib/utils/time";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

const CreateDispatchModal = dynamic(() => import("@/components/modals/dispatch/CreateDispatchModal").then(m => ({ default: m.CreateDispatchModal })), { ssr: false });
const AssignOfficerModal = dynamic(() => import("@/components/modals/dispatch/AssignOfficerModal").then(m => ({ default: m.AssignOfficerModal })), { ssr: false });
const ClearDispatchModal = dynamic(() => import("@/components/modals/dispatch/ClearDispatchModal").then(m => ({ default: m.ClearDispatchModal })), { ssr: false });
const DispatchDetailDrawer = dynamic(() => import("@/components/modals/dispatch/DispatchDetailDrawer").then(m => ({ default: m.DispatchDetailDrawer })), { ssr: false });
const EscalateToIncidentModal = dynamic(() => import("@/components/modals/dispatch/EscalateToIncidentModal").then(m => ({ default: m.EscalateToIncidentModal })), { ssr: false });
const EditDispatchModal = dynamic(() => import("@/components/modals/dispatch/EditDispatchModal").then(m => ({ default: m.EditDispatchModal })), { ssr: false });
const BulkOperationModal = dynamic(() => import("@/components/modals/workflows/BulkOperationModal").then(m => ({ default: m.BulkOperationModal })), { ssr: false });
const EscalationChainModal = dynamic(() => import("@/components/modals/workflows/EscalationChainModal").then(m => ({ default: m.EscalationChainModal })), { ssr: false });

/* ─── Types ───────────────────────────────────────────────────── */

type Priority = "critical" | "high" | "medium" | "low";
type DispatchStatus = "pending" | "active" | "cleared";
type OfficerStatus = "available" | "en-route" | "on-scene" | "on-break";
type ActiveSubStatus = "en-route" | "on-scene";

interface DispatchItem {
  id: string;
  code: string;
  category: string;
  location: string;
  synopsis: string;
  priority: Priority;
  status: string; // DB status values: pending, scheduled, in_progress, on_scene, overdue, cleared, completed
  officer?: string;
  activeSubStatus?: ActiveSubStatus;
  clearCode?: string;
  timeAgo: string;
  createdAt?: string;
  _realId?: string; // Supabase UUID for API calls
}

interface Officer {
  name: string;
  status: OfficerStatus;
  rank?: string;
}

/* ─── Priority Config ─────────────────────────────────────────── */

const PRIORITY_CONFIG: Record<
  Priority,
  { border: string; badge: string; badgeText: string; label: string }
> = {
  critical: {
    border: "var(--dispatch-critical)",
    badge: "badge-dispatch-critical",
    badgeText: "Critical",
    label: "Critical",
  },
  high: {
    border: "var(--dispatch-high)",
    badge: "badge-dispatch-high",
    badgeText: "High",
    label: "High",
  },
  medium: {
    border: "var(--dispatch-medium)",
    badge: "badge-dispatch-medium",
    badgeText: "Medium",
    label: "Medium",
  },
  low: {
    border: "var(--dispatch-low)",
    badge: "badge-dispatch-low",
    badgeText: "Low",
    label: "Low",
  },
};

/* ─── Officer Status Config ───────────────────────────────────── */

const OFFICER_STATUS_CONFIG: Record<
  OfficerStatus,
  { color: string; bg: string; label: string }
> = {
  available: {
    color: "var(--patrol-available)",
    bg: "color-mix(in srgb, var(--patrol-available) 12%, transparent)",
    label: "Available",
  },
  "en-route": {
    color: "var(--patrol-en-route)",
    bg: "color-mix(in srgb, var(--patrol-en-route) 12%, transparent)",
    label: "En Route",
  },
  "on-scene": {
    color: "var(--patrol-on-scene)",
    bg: "color-mix(in srgb, var(--patrol-on-scene) 12%, transparent)",
    label: "On Scene",
  },
  "on-break": {
    color: "var(--purple-500)",
    bg: "color-mix(in srgb, var(--purple-500) 12%, transparent)",
    label: "On Break",
  },
};

/* ─── Mock Data ───────────────────────────────────────────────── */

/* ─── Status Grouping for Kanban ─────────────────────────────── */

const PENDING_STATUSES = ["pending", "scheduled"];
const ACTIVE_STATUSES = ["in_progress", "on_scene", "overdue"];
const CLEARED_STATUSES = ["cleared", "completed"];

/** Map DB officer_status to UI display status */
const OFFICER_STATUS_MAP: Record<string, OfficerStatus> = {
  available: "available",
  on_break: "on-break",
  dispatched: "en-route",
  on_scene: "on-scene",
  overdue: "on-scene",
  break_overdue: "on-break",
};

const BULK_STATUS_MAP: Record<string, string> = {
  open: "pending",
  in_progress: "in_progress",
  resolved: "cleared",
  closed: "completed",
  archived: "completed",
};

/*─── Filter Chip Component ───────────────────────────────────── */

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-150 ease-out whitespace-nowrap"
      style={{
        backgroundColor: active
          ? color
            ? `color-mix(in srgb, ${color} 15%, transparent)`
            : "var(--surface-selected)"
          : "var(--surface-secondary)",
        color: active
          ? color || "var(--interactive)"
          : "var(--text-secondary)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: active
          ? color
            ? `color-mix(in srgb, ${color} 30%, transparent)`
            : "var(--eztrack-primary-300)"
          : "var(--border-default)",
      }}
    >
      {color && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}

/* ─── Dispatch Card Component ─────────────────────────────────── */

const DispatchCard = React.memo(function DispatchCard({ dispatch, onClick }: { dispatch: DispatchItem; onClick?: () => void }) {
  const priority = PRIORITY_CONFIG[dispatch.priority];
  const isActive = ACTIVE_STATUSES.includes(dispatch.status);
  const isCleared = CLEARED_STATUSES.includes(dispatch.status);

  // Map DB status to UI sub-status for active dispatches
  const activeSubStatus: ActiveSubStatus | null = dispatch.status === "in_progress"
    ? "en-route"
    : dispatch.status === "on_scene"
      ? "on-scene"
      : null;

  return (
    <div
      className="surface-card overflow-hidden group cursor-pointer"
      style={{
        borderLeft: `3px solid ${priority.border}`,
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3)",
      }}
      onClick={onClick}
    >
      {/* Top row: ID + priority badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className="text-[11px] font-mono font-medium tracking-wide"
          style={{ color: "var(--text-tertiary)" }}
        >
          {dispatch.id}
        </span>
        <span className={priority.badge}>{priority.badgeText}</span>
      </div>

      {/* Dispatch code */}
      <p
        className="text-[13px] font-semibold leading-snug mb-0.5"
        style={{ color: "var(--text-primary)" }}
      >
        {dispatch.code}
      </p>

      {/* Location */}
      <div className="flex items-center gap-1 mb-1.5">
        <MapPin
          size={11}
          className="shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        />
        <span
          className="text-[12px] leading-tight"
          style={{ color: "var(--text-secondary)" }}
        >
          {dispatch.location}
        </span>
      </div>

      {/* Synopsis */}
      <p
        className="text-[12px] leading-relaxed mb-2.5 line-clamp-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        {dispatch.synopsis}
      </p>

      {/* Bottom row */}
      <div
        className="flex items-center justify-between gap-2 pt-2"
        style={{ borderTop: "1px solid var(--border-subdued)" }}
      >
        {/* Officer / Assignment */}
        <div className="flex items-center gap-1.5 min-w-0">
          {dispatch.officer ? (
            <>
              <Avatar name={dispatch.officer} size="xs" />
              <span
                className="text-[11px] font-medium truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {dispatch.officer}
              </span>
            </>
          ) : (
            <span
              className="text-[11px] font-medium"
              style={{ color: "var(--eztrack-accent-500)" }}
            >
              Unassigned
            </span>
          )}
        </div>

        {/* Status / Time */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isActive && activeSubStatus && (
            <ActiveStatusPill status={activeSubStatus} />
          )}
          {isCleared && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--green-500) 12%, transparent)",
                color: "var(--green-600)",
              }}
            >
              {dispatch.status === "completed" ? "Completed" : "Cleared"}
            </span>
          )}
          <span
            className="flex items-center gap-0.5 text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Clock size={10} className="shrink-0" />
            {dispatch.timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
});

/* ─── Active Status Pill ──────────────────────────────────────── */

function ActiveStatusPill({ status }: { status: ActiveSubStatus }) {
  const isEnRoute = status === "en-route";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: isEnRoute
          ? "color-mix(in srgb, var(--patrol-en-route) 15%, transparent)"
          : "color-mix(in srgb, var(--patrol-on-scene) 15%, transparent)",
        color: isEnRoute
          ? "var(--patrol-en-route)"
          : "var(--patrol-on-scene)",
      }}
    >
      {isEnRoute ? <Navigation size={9} /> : <Eye size={9} />}
      {isEnRoute ? "En Route" : "On Scene"}
    </span>
  );
}

/* ─── Column Component ────────────────────────────────────────── */

function KanbanColumn({
  title,
  count,
  headerBg,
  headerBorder,
  icon: Icon,
  dispatches,
  onCardClick,
}: {
  title: string;
  count: number;
  headerBg: string;
  headerBorder: string;
  icon: typeof Radio;
  dispatches: DispatchItem[];
  onCardClick?: (dispatch: DispatchItem) => void;
}) {
  return (
    <div
      className="flex flex-col min-w-0 rounded-xl overflow-hidden"
      style={{
        background: "var(--surface-primary)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 shrink-0"
        style={{
          background: headerBg,
          borderBottom: `1px solid ${headerBorder}`,
        }}
      >
        <Icon size={14} style={{ color: "var(--text-secondary)" }} />
        <span
          className="text-[13px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </span>
        <span
          className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-[11px] font-bold"
          style={{
            background: "var(--surface-primary)",
            color: "var(--text-secondary)",
            boxShadow: "0 0 0 1px var(--border-default)",
          }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div
        className="flex-1 overflow-y-auto p-2.5 space-y-2.5"
        style={{ maxHeight: "calc(100vh - 320px)", minHeight: "200px" }}
      >
        {dispatches.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span
              className="text-[12px]"
              style={{ color: "var(--text-disabled)" }}
            >
              No dispatches
            </span>
          </div>
        ) : (
          dispatches.map((d) => <DispatchCard key={d.id} dispatch={d} onClick={() => onCardClick?.(d)} />)
        )}
      </div>
    </div>
  );
}

/* ─── Officer Status Bar ──────────────────────────────────────── */

function OfficerStatusBar({ officers }: { officers: Officer[] }) {
  return (
    <div
      className="surface-card overflow-hidden"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <User size={13} style={{ color: "var(--text-tertiary)" }} />
        <span
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          On-Duty Officers
        </span>
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{
            background: "var(--surface-secondary)",
            color: "var(--text-tertiary)",
          }}
        >
          {officers.length}
        </span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto">
        {officers.map((officer) => {
          const config = OFFICER_STATUS_CONFIG[officer.status];
          return (
            <div
              key={officer.name}
              className="flex items-center gap-2 shrink-0 rounded-lg px-2.5 py-1.5 transition-colors duration-150"
              style={{
                background: "var(--surface-secondary)",
                border: "1px solid var(--border-subdued)",
              }}
            >
              <div className="relative">
                <Avatar name={officer.name} size="sm" />
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: config.color,
                    border: "2px solid var(--surface-primary)",
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-[11px] font-medium leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {officer.name}
                </span>
                <span
                  className="text-[10px] font-semibold leading-tight"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */

type PriorityFilter = Priority | "all";

import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function DispatchPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ orgId: string; propertyId: string | null } | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [assignModal, setAssignModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [clearModal, setClearModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [escalateModal, setEscalateModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [drawerOpen, setDrawerOpen] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [bulkModal, setBulkModal] = useState<{ open: boolean; operation: "delete" | "assign" | "status_change" | "export" | "archive" }>({ open: false, operation: "export" });
  const [escalationChainModal, setEscalationChainModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });

  // Map real Supabase data → DispatchItem shape for cards
  const mapToCardItem = useCallback((d: DispatchCardType): DispatchItem => ({
    id: d.recordNumber,
    code: d.dispatchCode,
    category: d.dispatchCode.split(/[\s—-]/)[0] || "General",
    location: d.sublocation ? `${d.location}, ${d.sublocation}` : d.location,
    synopsis: d.description || "",
    priority: d.priority,
    status: d.status,
    officer: d.officerName || undefined,
    timeAgo: formatRelativeTime(d.createdAt),
    createdAt: d.createdAt,
    _realId: d.id, // preserve the UUID for API calls
  } as DispatchItem), []);

  // Fetch dispatches + officers on mount
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dispatchRows, officerRows] = await Promise.all([
        fetchDispatches(),
        fetchOnDutyOfficers(),
      ]);

      setDispatches(dispatchRows.map(mapToCardItem));

      setOfficers(officerRows.map((o) => ({
        name: o.name,
        status: OFFICER_STATUS_MAP[o.status] || "available",
      })));

      // Get user profile for create dispatch
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id, property_id")
          .eq("id", user.id)
          .single();
        if (profile) setUserProfile({ orgId: profile.org_id, propertyId: profile.property_id });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dispatch board");
    } finally {
      setLoading(false);
    }
  }, [mapToCardItem]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map a raw Supabase realtime payload row to a DispatchItem for the board
  const mapRawToCardItem = useCallback(
    (raw: Record<string, unknown>): DispatchItem => ({
      id: (raw.record_number as string) || "",
      code: (raw.dispatch_code as string) || "",
      category: ((raw.dispatch_code as string) || "General").split(/[\s—-]/)[0] || "General",
      location: raw.sublocation
        ? `${raw.location_name || "Unknown"}, ${raw.sublocation}`
        : (raw.location_name as string) || "Unknown",
      synopsis: (raw.description as string) || "",
      priority: (raw.priority as Priority) || "medium",
      status: (raw.status as string) || "pending",
      officer: (raw.officer_name as string) || undefined,
      timeAgo: formatRelativeTime(raw.created_at as string),
      createdAt: raw.created_at as string,
      _realId: raw.id as string,
    }),
    [],
  );

  // Supabase Realtime subscription for surgical live updates
  useRealtimeSubscription<Record<string, unknown>>({
    table: "dispatches",
    filter: userProfile?.orgId ? `org_id=eq.${userProfile.orgId}` : undefined,
    enabled: !!userProfile?.orgId,
    onInsert: useCallback(
      (record: Record<string, unknown>) => {
        const item = mapRawToCardItem(record);
        setDispatches((prev) => [item, ...prev]);
      },
      [mapRawToCardItem],
    ),
    onUpdate: useCallback(
      (record: Record<string, unknown>) => {
        setDispatches((prev) =>
          prev.map((d) =>
            d._realId === record.id
              ? {
                  ...d,
                  status: (record.status as string) || d.status,
                  priority: (record.priority as Priority) || d.priority,
                  synopsis: (record.description as string) || d.synopsis,
                  officer: (record.officer_name as string) || d.officer,
                  timeAgo: formatRelativeTime(record.created_at as string),
                }
              : d,
          ),
        );
      },
      [],
    ),
    onDelete: useCallback(
      (record: Record<string, unknown>) => {
        setDispatches((prev) => prev.filter((d) => d._realId !== record.id));
      },
      [],
    ),
  });

  const filtered = useMemo(() => {
    if (priorityFilter === "all") return dispatches;
    return dispatches.filter((d) => d.priority === priorityFilter);
  }, [priorityFilter, dispatches]);

  const pending = filtered.filter((d) => PENDING_STATUSES.includes(d.status));
  const active = filtered.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const cleared = filtered.filter((d) => CLEARED_STATUSES.includes(d.status));
  const bulkItems = filtered.map((dispatch) => ({
    id: dispatch._realId || dispatch.id,
    title: `${dispatch.id} · ${dispatch.code}`,
  }));

  const handleBulkConfirm = useCallback(
    async (data: { reason?: string; assignee?: string; status?: string; format?: string }) => {
      const targets = filtered.filter((dispatch) => dispatch._realId);
      if (!targets.length) {
        toast("No dispatches available for bulk actions", { variant: "info" });
        return;
      }

      try {
        if (bulkModal.operation === "export") {
          const rows = targets.map((dispatch) => ({
            recordNumber: dispatch.id,
            dispatchCode: dispatch.code,
            location: dispatch.location,
            priority: dispatch.priority,
            status: dispatch.status,
            officer: dispatch.officer || "",
            synopsis: dispatch.synopsis,
            createdAt: dispatch.createdAt || "",
          }));
          exportCSV(rows, `dispatch-bulk-${new Date().toISOString().slice(0, 10)}.csv`);
          toast("Dispatch export downloaded", { variant: "success" });
          return;
        }

        if (bulkModal.operation === "assign" && data.assignee) {
          await Promise.all(
            targets.map((dispatch) =>
              assignOfficerToDispatch(dispatch._realId!, data.assignee!),
            ),
          );
          toast(`Assigned ${targets.length} dispatch${targets.length === 1 ? "" : "es"}`, { variant: "success" });
          loadData();
          return;
        }

        if (bulkModal.operation === "status_change" && data.status) {
          const nextStatus = BULK_STATUS_MAP[data.status] || data.status;
          await Promise.all(
            targets.map((dispatch) => updateDispatchStatus(dispatch._realId!, nextStatus as any)),
          );
          toast(`Updated ${targets.length} dispatch${targets.length === 1 ? "" : "es"}`, { variant: "success" });
          loadData();
          return;
        }

        if (bulkModal.operation === "archive") {
          await Promise.all(
            targets.map((dispatch) => updateDispatchStatus(dispatch._realId!, "completed" as any)),
          );
          toast(`Archived ${targets.length} dispatch${targets.length === 1 ? "" : "es"}`, { variant: "success" });
          loadData();
          return;
        }

        if (bulkModal.operation === "delete") {
          const supabase = getSupabaseBrowser();
          await Promise.all(
            targets.map((dispatch) =>
              supabase
                .from("dispatches")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", dispatch._realId!),
            ),
          );
          toast(`Deleted ${targets.length} dispatch${targets.length === 1 ? "" : "es"}`, { variant: "success" });
          loadData();
          return;
        }

        toast("Bulk action completed", { variant: "success" });
        loadData();
      } catch (err: any) {
        toast(err.message || "Failed to complete bulk action", { variant: "error" });
      }
    },
    [bulkModal.operation, filtered, loadData, toast],
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        <span className="ml-2 text-[13px] text-[var(--text-tertiary)]">Loading dispatch board…</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-[var(--status-error)]" />
        <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Dispatch Board
          </h1>
          {/* Live indicator */}
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <span
              className="inline-block h-2 w-2 rounded-full animate-pulse-soft"
              style={{ backgroundColor: "var(--green-500)" }}
            />
            <span style={{ color: "var(--green-600)" }}>Live</span>
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => setBulkModal({ open: true, operation: "export" })}>
            Bulk Actions
          </Button>
          <Button variant="default" size="md" onClick={() => setCreateModal(true)}>
            <Plus size={14} />
            New Dispatch
          </Button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter
          size={13}
          style={{ color: "var(--text-tertiary)" }}
          className="shrink-0"
        />
        <FilterChip
          label="All"
          active={priorityFilter === "all"}
          onClick={() => setPriorityFilter("all")}
        />
        <FilterChip
          label="Critical"
          active={priorityFilter === "critical"}
          onClick={() => setPriorityFilter("critical")}
          color="var(--dispatch-critical)"
        />
        <FilterChip
          label="High"
          active={priorityFilter === "high"}
          onClick={() => setPriorityFilter("high")}
          color="var(--dispatch-high)"
        />
        <FilterChip
          label="Medium"
          active={priorityFilter === "medium"}
          onClick={() => setPriorityFilter("medium")}
          color="var(--dispatch-medium)"
        />
        <FilterChip
          label="Low"
          active={priorityFilter === "low"}
          onClick={() => setPriorityFilter("low")}
          color="var(--dispatch-low)"
        />
      </div>

      {/* ── 3-Column Kanban ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <KanbanColumn
          title="Pending"
          count={pending.length}
          headerBg="color-mix(in srgb, var(--eztrack-accent-100) 60%, var(--surface-primary))"
          headerBorder="color-mix(in srgb, var(--eztrack-accent-300) 30%, var(--border-default))"
          icon={AlertTriangle}
          dispatches={pending}
          onCardClick={(d) => setDrawerOpen({ open: true, dispatchId: d.id })}
        />
        <KanbanColumn
          title="Active"
          count={active.length}
          headerBg="color-mix(in srgb, var(--eztrack-primary-100) 60%, var(--surface-primary))"
          headerBorder="color-mix(in srgb, var(--eztrack-primary-300) 30%, var(--border-default))"
          icon={Radio}
          dispatches={active}
          onCardClick={(d) => setDrawerOpen({ open: true, dispatchId: d.id })}
        />
        <KanbanColumn
          title="Cleared"
          count={cleared.length}
          headerBg="color-mix(in srgb, var(--green-100) 60%, var(--surface-primary))"
          headerBorder="color-mix(in srgb, var(--green-300) 30%, var(--border-default))"
          icon={CheckCircle2}
          dispatches={cleared}
          onCardClick={(d) => setDrawerOpen({ open: true, dispatchId: d.id })}
        />
      </div>

      {/* ── Officer Status Panel ───────────────────────────────── */}
      <OfficerStatusBar officers={officers} />

      {/* ── Modals ──────────────────────────────────────────────── */}
      <CreateDispatchModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSubmit={async (data) => {
          if (!userProfile) {
            toast("Unable to determine your organization", { variant: "error" });
            return;
          }
          try {
            await createDispatch({
              orgId: userProfile.orgId,
              propertyId: userProfile.propertyId,
              dispatchCode: data.dispatchCode || "GENERAL",
              priority: data.priority || "medium",
              locationId: null, // TODO: map location string to ID
              sublocation: data.sublocation,
              description: data.synopsis || "",
              reporterName: data.reporterName,
              reporterPhone: data.reporterPhone,
              anonymous: data.anonymous,
              callSource: data.callSource,
            });
            toast("Dispatch created", { variant: "success" });
            setCreateModal(false);
            loadData(); // Refresh board
          } catch (err: any) {
            toast(err.message || "Failed to create dispatch", { variant: "error" });
          }
        }}
      />

      <EditDispatchModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false })}
        onSubmit={async (data) => {
          try {
            const realId = editModal.data?._realId || editModal.data?.id;
            if (!realId) throw new Error("No dispatch selected");
            await updateDispatch(realId, {
              dispatchCode: (data as any).dispatchCode,
              priority: (data as any).priority,
              description: (data as any).synopsis,
              sublocation: (data as any).sublocation,
              reporterName: (data as any).reporterName,
              reporterPhone: (data as any).reporterPhone,
              anonymous: (data as any).anonymous,
              callSource: (data as any).callSource,
            });
            toast("Dispatch updated", { variant: "success" });
            setEditModal({ open: false });
            loadData();
          } catch (err: any) {
            toast(err.message || "Failed to update dispatch", { variant: "error" });
          }
        }}
        initialData={editModal.data ?? null}
      />

      <AssignOfficerModal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false })}
        onSubmit={async (officerId) => {
          if (!assignModal.dispatchId) return;
          try {
            // Find the real UUID from the dispatch record number
            const realDispatch = dispatches.find((d) => d.id === assignModal.dispatchId);
            const realId = (realDispatch as any)?._realId || assignModal.dispatchId;
            await assignOfficerToDispatch(realId, officerId);
            toast("Officer assigned to dispatch", { variant: "success" });
            setAssignModal({ open: false });
            loadData();
          } catch (err: any) {
            toast(err.message || "Failed to assign officer", { variant: "error" });
          }
        }}
      />

      <ClearDispatchModal
        open={clearModal.open}
        onClose={() => setClearModal({ open: false })}
        onConfirm={async (data) => {
          if (!clearModal.dispatchId) return;
          try {
            const realDispatch = dispatches.find((d) => d.id === clearModal.dispatchId);
            const realId = (realDispatch as any)?._realId || clearModal.dispatchId;
            await clearDispatchApi(realId, { clearCode: data.clearCode, reason: data.reason });
            toast("Dispatch cleared", { variant: "success" });
            setClearModal({ open: false });
            loadData();
          } catch (err: any) {
            toast(err.message || "Failed to clear dispatch", { variant: "error" });
          }
        }}
        dispatchId={clearModal.dispatchId}
      />

      <EscalateToIncidentModal
        open={escalateModal.open}
        onClose={() => setEscalateModal({ open: false })}
        onConfirm={async (prefill) => {
          try {
            if (!userProfile) throw new Error("Unable to determine organization");
            const sourceDispatch = dispatches.find(
              (dispatch) =>
                dispatch.id === escalateModal.dispatchId || dispatch._realId === escalateModal.dispatchId,
            );
            if (!sourceDispatch) throw new Error("Dispatch not found");

            const result = await createIncident({
              orgId: userProfile.orgId,
              propertyId: userProfile.propertyId,
              incidentType:
                sourceDispatch.code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") || "dispatch",
              severity: sourceDispatch.priority,
              locationId: null,
              synopsis: prefill
                ? sourceDispatch.synopsis || `Escalated from dispatch ${sourceDispatch.id}`
                : `Escalated from dispatch ${sourceDispatch.id}`,
              description: `Escalated from dispatch ${sourceDispatch.id}${sourceDispatch.officer ? ` assigned to ${sourceDispatch.officer}` : ""}.`,
            });
            toast(`Incident ${result.record_number} created`, { variant: "success" });
            setEscalateModal({ open: false });
            router.push(`/incidents/${result.id}`);
          } catch (err: any) {
            toast(err.message || "Failed to create incident", { variant: "error" });
          }
        }}
      />

      <DispatchDetailDrawer
        open={drawerOpen.open}
        onClose={() => setDrawerOpen({ open: false })}
        dispatch={null}
        onAssignOfficer={() => {
          setDrawerOpen({ open: false });
          setAssignModal({ open: true, dispatchId: drawerOpen.dispatchId });
        }}
        onClear={() => {
          setDrawerOpen({ open: false });
          setClearModal({ open: true, dispatchId: drawerOpen.dispatchId });
        }}
        onEscalate={() => {
          setDrawerOpen({ open: false });
          setEscalateModal({ open: true, dispatchId: drawerOpen.dispatchId });
        }}
        onEdit={() => {
          setDrawerOpen({ open: false });
          setEditModal({ open: true });
        }}
      />

      <BulkOperationModal
        open={bulkModal.open}
        onClose={() => setBulkModal({ open: false, operation: "export" })}
        onConfirm={handleBulkConfirm}
        operation={bulkModal.operation}
        selectedCount={bulkItems.length}
        selectedItems={bulkItems}
        entityType="dispatch"
      />

      <EscalationChainModal
        open={escalationChainModal.open}
        onClose={() => setEscalationChainModal({ open: false })}
        onSubmit={async (data) => {
          try {
            if (!userProfile) throw new Error("Unable to determine organization");
            const sourceDispatch = dispatches.find(
              (d) => d.id === escalationChainModal.dispatchId || (d as any)._realId === escalationChainModal.dispatchId
            );
            const result = await createIncident({
              orgId: userProfile.orgId,
              propertyId: userProfile.propertyId,
              incidentType: (data as any).targetTitle || "general",
              severity: (data as any).targetPriority || sourceDispatch?.priority || "medium",
              locationId: null,
              synopsis: (data as any).targetSynopsis || sourceDispatch?.synopsis || "Escalated from dispatch",
              description: `Escalated from dispatch ${sourceDispatch?.id || escalationChainModal.dispatchId} via escalation chain.`,
            });
            toast(`Incident ${result.record_number} created`, { variant: "success" });
            setEscalationChainModal({ open: false });
            router.push(`/incidents/${result.id}`);
          } catch (err: any) {
            toast(err.message || "Failed to escalate dispatch", { variant: "error" });
          }
        }}
        sourceType="dispatch"
        sourceData={{
          id: escalationChainModal.dispatchId || "",
          title: "Dispatch",
          location: "",
          priority: "medium",
          synopsis: "",
          createdBy: "",
        }}
        targetType="incident"
      />
    </div>
  );
}
