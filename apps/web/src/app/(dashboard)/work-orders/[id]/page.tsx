"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  MapPin,
  Calendar,
  Clock,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  CircleDot,
  Circle,
  PauseCircle,
  PlayCircle,
  LinkIcon,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import dynamic from "next/dynamic";

const AssignWorkOrderModal = dynamic(() => import("@/components/modals/work-orders/AssignWorkOrderModal").then(m => ({ default: m.AssignWorkOrderModal })), { ssr: false });
const CompleteWorkOrderModal = dynamic(() => import("@/components/modals/work-orders/CompleteWorkOrderModal").then(m => ({ default: m.CompleteWorkOrderModal })), { ssr: false });
const CloseWorkOrderModal = dynamic(() => import("@/components/modals/work-orders/CloseWorkOrderModal").then(m => ({ default: m.CloseWorkOrderModal })), { ssr: false });
const AddWorkOrderNoteModal = dynamic(() => import("@/components/modals/work-orders/AddWorkOrderNoteModal").then(m => ({ default: m.AddWorkOrderNoteModal })), { ssr: false });
const DeleteWorkOrderModal = dynamic(() => import("@/components/modals/work-orders/DeleteWorkOrderModal").then(m => ({ default: m.DeleteWorkOrderModal })), { ssr: false });

import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { fetchWorkOrderById, updateWorkOrderStatus, updateWorkOrder, deleteWorkOrder, type WorkOrderDetail } from "@/lib/queries/work-orders";
import { formatDateTime } from "@/lib/utils/time";

const STATUS_STEPS = [
  { key: "open", label: "Open" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

// Notes are stored in work order description for now (no work_order_notes table exists)
const NOTES: { id: string; author: string; timestamp: string; content: string }[] = [];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

const categoryTone: Record<string, "info" | "warning" | "critical" | "default" | "success" | "attention"> = {
  security: "critical",
  maintenance: "default",
  electrical: "warning",
  plumbing: "info",
  landscaping: "success",
  general: "default",
};

function getStatusStepIndex(status: string): number {
  const map: Record<string, number> = {
    open: 0,
    assigned: 1,
    in_progress: 2,
    completed: 3,
  };
  return map[status] ?? 0;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="text-[13px] text-[var(--text-primary)]">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();

  const [workOrderData, setWorkOrderData] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkOrderById(id);
      setWorkOrderData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load work order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error || !workOrderData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={24} className="text-[var(--status-critical)]" />
        <p className="text-[13px] text-[var(--text-tertiary)]">{error || "Work order not found"}</p>
        <Link href="/work-orders"><Button variant="outline" size="sm">Back to Work Orders</Button></Link>
      </div>
    );
  }

  // Map real DB data → template shape
  const initials = workOrderData.assignedStaff?.fullName
    ? workOrderData.assignedStaff.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const wo = {
    id: workOrderData.id,
    woNumber: workOrderData.recordNumber,
    title: workOrderData.title,
    description: workOrderData.description || "No description provided",
    category: workOrderData.category,
    priority: workOrderData.priority,
    status: workOrderData.status,
    location: workOrderData.location?.name || "Unknown",
    specificLocation: "",
    assignedTo: {
      name: workOrderData.assignedStaff?.fullName || "Unassigned",
      initials,
      role: "",
      note: "",
    },
    estimatedCost: workOrderData.estimatedCost || 0,
    actualCost: null as number | null,
    scheduledDate: workOrderData.scheduledDate ? formatDateTime(workOrderData.scheduledDate) : "—",
    dueDate: workOrderData.dueDate ? formatDateTime(workOrderData.dueDate) : "—",
    completedAt: null as string | null,
    createdBy: workOrderData.creator?.fullName || "Unknown",
    createdAt: formatDateTime(workOrderData.createdAt),
    linkedCase: null as { id: string; title: string } | null,
  };

  const currentStepIndex = getStatusStepIndex(wo.status);
  const progressPercent = Math.round(((currentStepIndex + 1) / STATUS_STEPS.length) * 100);

  return (
    <div className="space-y-5 max-w-3xl pb-24">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Link
          href="/work-orders"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--surface-hover)] transition-colors mt-0.5"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-[var(--text-tertiary)]">
              {wo.woNumber}
            </span>
            <PriorityBadge priority={wo.priority} />
            <Badge tone={categoryTone[wo.category] ?? "default"}>
              {wo.category.charAt(0).toUpperCase() + wo.category.slice(1)}
            </Badge>
            <StatusBadge status={wo.status} dot />
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)] mt-1 leading-snug">
            {wo.title}
          </h1>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
            Created by {wo.createdBy} on {wo.createdAt}
          </p>
        </div>
      </div>

      {/* ── Status Timeline ── */}
      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-[520px] items-center gap-0 mb-3">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="flex items-center justify-center h-7 w-7 rounded-full border-2 transition-colors"
                        style={{
                          borderColor: isCompleted
                            ? "var(--action-primary)"
                            : "var(--border-default)",
                          backgroundColor: isCompleted
                            ? "var(--action-primary)"
                            : "transparent",
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <Circle className="h-3 w-3 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                      <span
                        className="text-[11px] font-medium whitespace-nowrap"
                        style={{
                          color: isCurrent
                            ? "var(--action-primary)"
                            : isCompleted
                              ? "var(--text-primary)"
                              : "var(--text-tertiary)",
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mx-2 rounded-full"
                        style={{
                          backgroundColor:
                            i < currentStepIndex
                              ? "var(--action-primary)"
                              : "var(--border-default)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <ProgressBar value={progressPercent} label="Overall Progress" size="sm" />
        </CardContent>
      </Card>

      {/* ── Details Card ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              Details
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
            {wo.description}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Location">
              <Link
                href="/settings/locations"
                className="text-[var(--action-primary)] hover:underline inline-flex items-center gap-1"
              >
                <MapPin className="h-3 w-3" />
                {wo.location}, {wo.specificLocation}
              </Link>
            </DetailRow>
            <DetailRow label="Category">
              <Badge tone={categoryTone[wo.category] ?? "default"}>
                {wo.category.charAt(0).toUpperCase() + wo.category.slice(1)}
              </Badge>
            </DetailRow>
            <DetailRow label="Priority">
              <PriorityBadge priority={wo.priority} />
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge status={wo.status} dot />
            </DetailRow>
          </div>
        </CardContent>
      </Card>

      {/* ── Assignment Card ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              Assignment
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div
              className="flex items-center justify-center h-9 w-9 rounded-full shrink-0 text-[12px] font-semibold"
              style={{
                backgroundColor: "var(--action-primary)",
                color: "white",
              }}
            >
              {wo.assignedTo.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                {wo.assignedTo.name}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                {wo.assignedTo.role}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAssignModal(true)} className="w-full sm:w-auto">
              <RefreshCw className="h-3 w-3" />
              Reassign
            </Button>
          </div>
          {wo.assignedTo.note && (
            <div
              className="mt-3 rounded-lg p-3 text-[13px] text-[var(--text-secondary)] leading-relaxed"
              style={{ backgroundColor: "var(--surface-secondary)" }}
            >
              <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
                Assignee Note
              </span>
              {wo.assignedTo.note}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Schedule Card ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              Schedule
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailRow label="Scheduled Date">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[var(--text-tertiary)]" />
                {wo.scheduledDate}
              </span>
            </DetailRow>
            <DetailRow label="Due Date">
              <span className="inline-flex items-center gap-1 text-[var(--status-warning, #d97706)] font-medium">
                <Clock className="h-3 w-3" />
                {wo.dueDate}
              </span>
            </DetailRow>
            <DetailRow label="Completed At">
              {wo.completedAt ? (
                <span className="inline-flex items-center gap-1 text-[var(--status-success, #059669)]">
                  <CheckCircle2 className="h-3 w-3" />
                  {wo.completedAt}
                </span>
              ) : (
                <span className="text-[var(--text-tertiary)]">--</span>
              )}
            </DetailRow>
          </div>
        </CardContent>
      </Card>

      {/* ── Costs Card ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              Costs
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailRow label="Estimated Cost">
              <span className="font-medium">${wo.estimatedCost.toFixed(2)}</span>
            </DetailRow>
            <DetailRow label="Actual Cost">
              {wo.actualCost !== null ? (
                <span className="font-medium">${wo.actualCost.toFixed(2)}</span>
              ) : (
                <span className="text-[var(--text-tertiary)]">Pending</span>
              )}
            </DetailRow>
            <DetailRow label="Variance">
              {wo.actualCost !== null ? (
                (() => {
                  const variance = wo.actualCost - wo.estimatedCost;
                  const isOver = variance > 0;
                  return (
                    <span
                      className="font-medium"
                      style={{
                        color: isOver
                          ? "var(--status-critical, #dc2626)"
                          : "var(--status-success, #059669)",
                      }}
                    >
                      {isOver ? "+" : ""}${variance.toFixed(2)}
                    </span>
                  );
                })()
              ) : (
                <span className="text-[var(--text-tertiary)]">--</span>
              )}
            </DetailRow>
          </div>
        </CardContent>
      </Card>

      {/* ── Case Link Card ── */}
      {wo.linkedCase && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                Linked Case
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/cases/${wo.linkedCase.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-colors group"
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                style={{ backgroundColor: "var(--status-info-surface, #eff6ff)" }}
              >
                <FileText className="h-4 w-4" style={{ color: "var(--status-info, #2563eb)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--action-primary)] group-hover:underline">
                  {wo.linkedCase.id}
                </p>
                <p className="text-[12px] text-[var(--text-secondary)] truncate">
                  {wo.linkedCase.title}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── Notes Section ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                Notes
                <Badge tone="default">{NOTES.length}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowNoteModal(true)}>
                <MessageSquare className="h-3 w-3" />
                Add Note
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {NOTES.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-5 w-5" />}
              title="No notes yet"
              description="Add context, updates, or handoff notes for this work order."
              action={{ label: "Add Note", onClick: () => setShowNoteModal(true), variant: "outline" }}
            />
          ) : (
            <div className="space-y-0">
              {NOTES.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 py-3 border-b border-[var(--border-default)] last:border-0 first:pt-0"
                >
                  <div
                    className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 text-[10px] font-semibold mt-0.5"
                    style={{
                      backgroundColor: "var(--surface-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {note.author
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">
                        {note.author}
                      </span>
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {note.timestamp}
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sticky Action Footer ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-3"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CircleDot className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <span className="text-[13px] text-[var(--text-secondary)]">
              Status: <StatusBadge status={wo.status} dot />
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={async () => {
                try {
                  await updateWorkOrderStatus(workOrderData.id, "on_hold" as any);
                  toast("Work order paused", { variant: "success" });
                  loadWorkOrder();
                } catch (err: any) {
                  toast(err.message || "Failed to pause work order", { variant: "error" });
                }
              }}
            >
              <PauseCircle className="h-3.5 w-3.5" />
              Pause
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              onClick={async () => {
                try {
                  await updateWorkOrderStatus(workOrderData.id, "follow_up" as any);
                  toast("Work order marked for follow-up", { variant: "success" });
                  loadWorkOrder();
                } catch (err: any) {
                  toast(err.message || "Failed to mark follow-up", { variant: "error" });
                }
              }}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Mark Follow-up
            </Button>
            <Button variant="default" size="md" className="w-full sm:w-auto" onClick={() => setShowCompleteModal(true)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete Work
            </Button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AssignWorkOrderModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSubmit={async (data) => {
          try {
            await updateWorkOrder(workOrderData.id, {
              assignedTo: (data as any).assigneeId || null,
            });
            toast("Work order assigned", { variant: "success" });
            setShowAssignModal(false);
            loadWorkOrder();
          } catch (err: any) {
            toast(err.message || "Failed to assign work order", { variant: "error" });
          }
        }}
        currentAssignee={wo.assignedTo.name}
      />
      <CompleteWorkOrderModal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onSubmit={async (data) => {
          try {
            await updateWorkOrderStatus(workOrderData.id, "completed");
            toast("Work order completed", { variant: "success" });
            setShowCompleteModal(false);
            loadWorkOrder();
          } catch (err: any) {
            toast(err.message || "Failed to complete", { variant: "error" });
          }
        }}
        estimatedCost={wo.estimatedCost}
      />
      <CloseWorkOrderModal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={async (reason) => {
          try {
            await updateWorkOrderStatus(workOrderData.id, "closed");
            toast("Work order closed", { variant: "success" });
            setShowCloseModal(false);
            loadWorkOrder();
          } catch (err: any) {
            toast(err.message || "Failed to close", { variant: "error" });
          }
        }}
      />
      <AddWorkOrderNoteModal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSubmit={async (data) => {
          try {
            // No work_order_notes table — append note to description
            const existing = workOrderData.description || "";
            const timestamp = new Date().toLocaleString();
            const separator = existing ? "\n\n---\n" : "";
            const newDescription = `${existing}${separator}[${timestamp}] ${(data as any).content}`;
            await updateWorkOrder(workOrderData.id, { description: newDescription });
            toast("Note added", { variant: "success" });
            setShowNoteModal(false);
            loadWorkOrder();
          } catch (err: any) {
            toast(err.message || "Failed to add note", { variant: "error" });
          }
        }}
      />
      <DeleteWorkOrderModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          try {
            await deleteWorkOrder(workOrderData.id);
            toast("Work order deleted", { variant: "info" });
            setShowDeleteModal(false);
            window.location.href = "/work-orders";
          } catch (err: any) {
            toast(err.message || "Failed to delete", { variant: "error" });
          }
        }}
      />
    </div>
  );
}
