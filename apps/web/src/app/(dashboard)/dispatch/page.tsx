"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import dynamic from "next/dynamic";

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
  status: DispatchStatus;
  officer?: string;
  activeSubStatus?: ActiveSubStatus;
  clearCode?: string;
  timeAgo: string;
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

const MOCK_DISPATCHES: DispatchItem[] = [
  // Pending
  {
    id: "DSP-2026-00045",
    code: "Medical \u2014 Cardiac",
    category: "Medical",
    location: "Main Stage, North Pit",
    synopsis: "Patron collapsed near front barricade. Bystander performing CPR. AED requested.",
    priority: "critical",
    status: "pending",
    timeAgo: "30s ago",
  },
  {
    id: "DSP-2026-00044",
    code: "Security \u2014 Disruptive Patron",
    category: "Security",
    location: "VIP Tent A",
    synopsis: "Intoxicated individual refusing to leave VIP area. Verbal altercation with staff.",
    priority: "high",
    status: "pending",
    timeAgo: "2m ago",
  },
  {
    id: "DSP-2026-00043",
    code: "Lost Person \u2014 Child",
    category: "Lost Person",
    location: "Family Zone",
    synopsis: "7-year-old male, blue shirt, separated from parents near bounce houses.",
    priority: "medium",
    status: "pending",
    timeAgo: "5m ago",
  },
  {
    id: "DSP-2026-00042",
    code: "Equipment \u2014 Sound System",
    category: "Equipment",
    location: "West Stage",
    synopsis: "Main PA system intermittent. Vendor requesting security escort for tech crew.",
    priority: "low",
    status: "pending",
    timeAgo: "8m ago",
  },
  // Active
  {
    id: "DSP-2026-00041",
    code: "Medical \u2014 Intoxicated",
    category: "Medical",
    location: "Campground B",
    synopsis: "Unresponsive individual found in tent. Breathing but unresponsive to verbal.",
    priority: "high",
    status: "active",
    officer: "Officer Martinez",
    activeSubStatus: "en-route",
    timeAgo: "12m ago",
  },
  {
    id: "DSP-2026-00040",
    code: "Noise \u2014 Complaint",
    category: "Noise",
    location: "East Perimeter",
    synopsis: "Neighboring property complaining about bass levels. Third call tonight.",
    priority: "medium",
    status: "active",
    officer: "Officer Rivera",
    activeSubStatus: "on-scene",
    timeAgo: "18m ago",
  },
  {
    id: "DSP-2026-00039",
    code: "Security \u2014 Trespasser",
    category: "Security",
    location: "South Gate",
    synopsis: "Individual bypassed credentialing checkpoint. Last seen heading toward backstage.",
    priority: "critical",
    status: "active",
    officer: "Sgt. Patel",
    activeSubStatus: "on-scene",
    timeAgo: "25m ago",
  },
  {
    id: "DSP-2026-00038",
    code: "Vendor \u2014 Permit Issue",
    category: "Vendor",
    location: "Food Court",
    synopsis: "Unauthorized vendor set up without proper health permit. Refusing to shut down.",
    priority: "medium",
    status: "active",
    officer: "Officer Davis",
    activeSubStatus: "en-route",
    timeAgo: "30m ago",
  },
  // Cleared
  {
    id: "DSP-2026-00037",
    code: "Traffic \u2014 Parking",
    category: "Traffic",
    location: "Lot C",
    synopsis: "Two vehicles blocking fire lane. Owners located and vehicles moved.",
    priority: "low",
    status: "cleared",
    officer: "Officer Kim",
    clearCode: "Resolved",
    timeAgo: "45m ago",
  },
  {
    id: "DSP-2026-00036",
    code: "Medical \u2014 Minor Injury",
    category: "Medical",
    location: "Dance Tent",
    synopsis: "Patron twisted ankle on uneven ground. Ambulatory, no transport needed.",
    priority: "medium",
    status: "cleared",
    officer: "Officer Rivera",
    clearCode: "Referred to Medical",
    timeAgo: "1hr ago",
  },
  {
    id: "DSP-2026-00035",
    code: "Security \u2014 Theft",
    category: "Security",
    location: "Merchandise Area",
    synopsis: "Vendor reports shoplifting. Suspect description obtained, CCTV footage pulled.",
    priority: "high",
    status: "cleared",
    officer: "Sgt. Patel",
    clearCode: "Escalated to Incident",
    timeAgo: "1.5hr ago",
  },
  {
    id: "DSP-2026-00034",
    code: "Vendor \u2014 Cleanup",
    category: "Vendor",
    location: "Main Entrance",
    synopsis: "Spill from food vendor blocking foot traffic. Cleanup crew dispatched.",
    priority: "low",
    status: "cleared",
    officer: "Staff Hendricks",
    clearCode: "Completed",
    timeAgo: "2hr ago",
  },
];

const MOCK_OFFICERS: Officer[] = [
  { name: "Officer Martinez", status: "en-route" },
  { name: "Officer Rivera", status: "on-scene" },
  { name: "Sgt. Patel", status: "on-scene", rank: "Sgt" },
  { name: "Officer Davis", status: "en-route" },
  { name: "Officer Kim", status: "available" },
  { name: "Staff Hendricks", status: "available" },
];

/* ─── Filter Chip Component ───────────────────────────────────── */

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

function DispatchCard({ dispatch, onClick }: { dispatch: DispatchItem; onClick?: () => void }) {
  const priority = PRIORITY_CONFIG[dispatch.priority];

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
          {dispatch.status === "active" && dispatch.activeSubStatus && (
            <ActiveStatusPill status={dispatch.activeSubStatus} />
          )}
          {dispatch.status === "cleared" && dispatch.clearCode && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--green-500) 12%, transparent)",
                color: "var(--green-600)",
              }}
            >
              {dispatch.clearCode}
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
}

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

export default function DispatchPage() {
  const { toast } = useToast();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [assignModal, setAssignModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [clearModal, setClearModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [escalateModal, setEscalateModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [drawerOpen, setDrawerOpen] = useState<{ open: boolean; dispatchId?: string }>({ open: false });
  const [bulkModal, setBulkModal] = useState<{ open: boolean; operation: "delete" | "assign" | "status_change" | "export" | "archive" }>({ open: false, operation: "export" });
  const [escalationChainModal, setEscalationChainModal] = useState<{ open: boolean; dispatchId?: string }>({ open: false });

  const filtered = useMemo(() => {
    if (priorityFilter === "all") return MOCK_DISPATCHES;
    return MOCK_DISPATCHES.filter((d) => d.priority === priorityFilter);
  }, [priorityFilter]);

  const pending = filtered.filter((d) => d.status === "pending");
  const active = filtered.filter((d) => d.status === "active");
  const cleared = filtered.filter((d) => d.status === "cleared");

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
      <OfficerStatusBar officers={MOCK_OFFICERS} />

      {/* ── Modals ──────────────────────────────────────────────── */}
      <CreateDispatchModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSubmit={async (data) => {
          toast("Dispatch created", { variant: "success" });
          setCreateModal(false);
        }}
      />

      <EditDispatchModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false })}
        onSubmit={async (data) => {
          toast("Dispatch updated", { variant: "success" });
          setEditModal({ open: false });
        }}
        initialData={editModal.data ?? null}
      />

      <AssignOfficerModal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false })}
        onSubmit={async (officerId) => {
          toast("Officer assigned to dispatch", { variant: "success" });
          setAssignModal({ open: false });
        }}
      />

      <ClearDispatchModal
        open={clearModal.open}
        onClose={() => setClearModal({ open: false })}
        onConfirm={async (data) => {
          toast("Dispatch cleared", { variant: "success" });
          setClearModal({ open: false });
        }}
        dispatchId={clearModal.dispatchId}
      />

      <EscalateToIncidentModal
        open={escalateModal.open}
        onClose={() => setEscalateModal({ open: false })}
        onConfirm={async (prefill) => {
          toast("Incident created from dispatch", { variant: "info" });
          setEscalateModal({ open: false });
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
        onConfirm={async (data) => {
          toast(`Bulk ${bulkModal.operation} completed`, { variant: "success" });
          setBulkModal({ open: false, operation: "export" });
        }}
        operation={bulkModal.operation}
        selectedCount={0}
        selectedItems={[]}
        entityType="dispatch"
      />

      <EscalationChainModal
        open={escalationChainModal.open}
        onClose={() => setEscalationChainModal({ open: false })}
        onSubmit={async (data) => {
          toast("Dispatch escalated to incident", { variant: "success" });
          setEscalationChainModal({ open: false });
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
