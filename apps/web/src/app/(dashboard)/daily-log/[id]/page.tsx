"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Radio,
  Eye,
  UserCheck,
  ArrowUpRight,
  Plus,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import {
  EditDailyLogModal,
  EscalateToIncidentModal as EscalateToIncidentDailyLogModal,
  DeleteDailyLogModal,
} from "@/components/modals/daily-log";
import { CreateDispatchFromLogModal, EscalationChainModal } from "@/components/modals/workflows";
import { useToast } from "@/components/ui/Toast";
import {
  fetchDailyLogById,
  fetchDailyLogAudit,
  updateDailyLogStatus,
  updateDailyLog,
  type DailyLogDetail,
  type DailyLogAuditEntry,
} from "@/lib/queries/daily-logs";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/time";

const TAB_LIST = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "notes", label: "Notes" },
  { id: "documents", label: "Documents" },
  { id: "sharing", label: "Sharing" },
];

const TIMELINE_ICONS: Record<string, typeof Clock> = {
  create: Plus,
  escalate: ArrowUpRight,
  update: Edit,
  review: Eye,
};

export default function DailyLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { toast } = useToast();
  const { id } = use(params);
  const [detail, setDetail] = useState<DailyLogDetail | null>(null);
  const [auditEntries, setAuditEntries] = useState<DailyLogAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [escalateModal, setEscalateModal] = useState(false);
  const [editLogModal, setEditLogModal] = useState(false);
  const [deleteLogModal, setDeleteLogModal] = useState(false);
  const [escalateLogModal, setEscalateLogModal] = useState(false);
  const [createDispatchModal, setCreateDispatchModal] = useState(false);
  const [escalationChainModal, setEscalationChainModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [logDetail, audit] = await Promise.all([
        fetchDailyLogById(id),
        fetchDailyLogAudit(id),
      ]);
      setDetail(logDetail);
      setAuditEntries(audit);
    } catch (err: any) {
      setError(err.message || "Failed to load daily log");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={24} className="text-[var(--status-critical)]" />
        <p className="text-[13px] text-[var(--text-tertiary)]">{error || "Daily log not found"}</p>
        <Link href="/daily-log">
          <Button variant="outline" size="sm">Back to Daily Log</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/daily-log">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <div>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-0.5">Daily Log</p>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {detail.recordNumber}
              </h1>
              <StatusBadge status={detail.status} dot />
              <PriorityBadge priority={detail.priority} />
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
              {detail.topic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={() => setEditLogModal(true)}>
            <Edit size={14} />
            Edit
          </Button>
          <Button variant="secondary" size="md" onClick={() => setDeleteLogModal(true)}>
            <XCircle size={14} />
            Close Log
          </Button>
          <Button variant="destructive" size="md" onClick={() => setEscalateModal(true)}>
            <AlertTriangle size={14} />
            Escalate to Incident
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TAB_LIST} activeTab={activeTab} onChange={setActiveTab} />

      {/* 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left column (70%) */}
        <div className="flex-1 min-w-0" style={{ flex: "7 1 0%" }}>
          {activeTab === "overview" && (
            <div className="surface-card p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                <Field label="Topic" value={detail.topic} />
                <Field label="Location" value={detail.location?.name || "Unknown"} />
                <Field label="Priority">
                  <PriorityBadge priority={detail.priority} />
                </Field>
                <Field label="Status">
                  <StatusBadge status={detail.status} dot />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Synopsis" value={detail.synopsis ?? undefined} />
                </div>
                <Field label="Created By" value={detail.creator?.fullName || "Unknown"} />
                <Field label="Created At" value={formatDateTime(detail.createdAt)} />
                <Field label="Updated At" value={formatDateTime(detail.updatedAt)} />
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="surface-card p-5">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border-default)]" />

                <div className="space-y-5">
                  {auditEntries.length === 0 && (
                    <p className="text-[13px] text-[var(--text-tertiary)] text-center py-4">
                      No timeline entries yet
                    </p>
                  )}
                  {auditEntries.map((entry) => {
                    const IconComp = entry.action.toLowerCase().includes("creat") ? Plus
                      : entry.action.toLowerCase().includes("view") ? Eye
                      : entry.action.toLowerCase().includes("escalat") ? ArrowUpRight
                      : Edit;
                    return (
                      <div key={entry.id} className="flex gap-3 relative">
                        <div className="w-[31px] h-[31px] rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center shrink-0 z-10">
                          <IconComp size={13} className="text-[var(--text-tertiary)]" />
                        </div>
                        <div className="pt-1">
                          <p className="text-[13px] text-[var(--text-primary)]">
                            {entry.action}{entry.actorName ? ` by ${entry.actorName}` : ""}
                          </p>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            {formatRelativeTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="surface-card p-8 text-center">
              <p className="text-[13px] text-[var(--text-tertiary)]">
                No notes yet
              </p>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="surface-card p-8 text-center">
              <p className="text-[13px] text-[var(--text-tertiary)]">
                No documents attached
              </p>
            </div>
          )}

          {activeTab === "sharing" && (
            <div className="surface-card p-8 text-center">
              <p className="text-[13px] text-[var(--text-tertiary)]">
                This log has not been shared with anyone
              </p>
            </div>
          )}
        </div>

        {/* Right column (30%) */}
        <div className="w-full lg:w-auto space-y-4 lg:shrink-0" style={{ flex: "3 1 0%", minWidth: 240 }}>
          {/* Linked Records */}
          <div className="surface-card p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Linked Records
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-[var(--text-tertiary)]" />
                  <span className="text-[12px] text-[var(--text-secondary)]">Linked Incident</span>
                </div>
                <span className="text-[12px] text-[var(--text-tertiary)]">None</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={13} className="text-[var(--text-tertiary)]" />
                  <span className="text-[12px] text-[var(--text-secondary)]">Linked Dispatch</span>
                </div>
                <span className="text-[12px] text-[var(--text-tertiary)]">None</span>
              </div>
            </div>
          </div>

          {/* Escalation */}
          <div className="surface-card p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Escalation
            </h3>
            <div className="space-y-2">
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-center"
                onClick={() => setEscalateModal(true)}
              >
                <AlertTriangle size={12} />
                Escalate to Incident
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => setCreateDispatchModal(true)}
              >
                <Radio size={12} />
                Create Dispatch
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => setEscalationChainModal(true)}
              >
                <ArrowUpRight size={12} />
                Escalation Chain
              </Button>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="surface-card p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Audit Trail
            </h3>
            <div className="space-y-2.5">
              {auditEntries.length === 0 && (
                <p className="text-[12px] text-[var(--text-tertiary)]">No audit entries</p>
              )}
              {auditEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center shrink-0 mt-0.5">
                    {entry.action.toLowerCase().includes("view") ? (
                      <Eye size={10} className="text-[var(--text-tertiary)]" />
                    ) : entry.action.toLowerCase().includes("creat") ? (
                      <Plus size={10} className="text-[var(--text-tertiary)]" />
                    ) : (
                      <UserCheck size={10} className="text-[var(--text-tertiary)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] text-[var(--text-primary)]">
                      {entry.action}{entry.actorName ? ` by ${entry.actorName}` : ""}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Escalate confirmation modal (inline) */}
      <Modal open={escalateModal} onClose={() => setEscalateModal(false)} size="sm">
        <ModalHeader onClose={() => setEscalateModal(false)}>
          Escalate to Incident
        </ModalHeader>
        <ModalContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--status-warning-surface,#fffbeb)] border border-[var(--status-warning-border,#fde68a)]">
              <AlertTriangle size={16} className="text-[var(--status-warning,#d97706)] shrink-0" />
              <p className="text-[13px] text-[var(--status-warning,#d97706)]">
                This action will create a new incident from this daily log entry.
              </p>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)]">
              The daily log <strong>{detail.recordNumber}</strong> will be linked to the new incident.
              All log details, including the synopsis and timeline, will be carried over.
            </p>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" size="md" onClick={() => setEscalateModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="md" onClick={() => setEscalateModal(false)}>
            <AlertTriangle size={14} />
            Confirm Escalation
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Wired Modals ── */}
      <EditDailyLogModal
        open={editLogModal}
        onClose={() => setEditLogModal(false)}
        onSubmit={async (data) => {
          try {
            await updateDailyLog(id, {
              topic: data.topic,
              synopsis: data.notes,
              priority: data.priority,
            });
            toast("Daily log updated", { variant: "success" });
            setEditLogModal(false);
            loadData();
          } catch (err: any) {
            toast(err.message || "Failed to update", { variant: "error" });
          }
        }}
        initialData={{
          topic: detail.topic,
          location: detail.location?.name || "",
          priority: detail.priority,
          notes: detail.synopsis || "",
          staffInvolved: detail.creator?.fullName || "",
        }}
      />

      <EscalateToIncidentDailyLogModal
        open={escalateLogModal}
        onClose={() => setEscalateLogModal(false)}
        onConfirm={async (data) => {
          toast("Incident created from daily log", { variant: "info" });
          setEscalateLogModal(false);
        }}
      />

      <DeleteDailyLogModal
        open={deleteLogModal}
        onClose={() => setDeleteLogModal(false)}
        onConfirm={async () => {
          try {
            await updateDailyLogStatus(id, "closed");
            toast("Daily log closed", { variant: "info" });
            setDeleteLogModal(false);
            loadData();
          } catch (err: any) {
            toast(err.message || "Failed to close log", { variant: "error" });
          }
        }}
        entryTitle={detail.topic}
      />

      <CreateDispatchFromLogModal
        open={createDispatchModal}
        onClose={() => setCreateDispatchModal(false)}
        onSubmit={async (data) => {
          toast("Dispatch created from log entry", { variant: "success" });
          setCreateDispatchModal(false);
        }}
        logData={{
          id: detail.id,
          recordNumber: detail.recordNumber,
          topic: detail.topic,
          location: detail.location?.name || "",
          priority: detail.priority || "medium",
          synopsis: detail.synopsis || "",
          createdBy: detail.creator?.fullName || "",
        }}
      />

      <EscalationChainModal
        open={escalationChainModal}
        onClose={() => setEscalationChainModal(false)}
        onSubmit={async (data) => {
          toast("Escalation chain initiated", { variant: "success" });
          setEscalationChainModal(false);
        }}
        sourceType="daily_log"
        sourceData={{
          id: detail.id,
          title: detail.topic,
          location: detail.location?.name || "",
          priority: detail.priority || "medium",
          synopsis: detail.synopsis || "",
          createdBy: detail.creator?.fullName || "",
        }}
        targetType="dispatch"
      />
    </div>
  );
}

/* ── Field helper ── */
function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--text-primary)]">
        {children ?? value ?? "-"}
      </dd>
    </div>
  );
}
