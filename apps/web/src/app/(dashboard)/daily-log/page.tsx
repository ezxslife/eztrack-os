"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import {
  QuickReportModal,
  EditDailyLogModal,
  EscalateToIncidentModal,
  DeleteDailyLogModal,
} from "@/components/modals/daily-log";
import { useToast } from "@/components/ui/Toast";
import { fetchDailyLogs, type DailyLogRow } from "@/lib/queries/daily-logs";
import { formatRelativeTime } from "@/lib/utils/time";

interface DailyLogEntry {
  id: string;
  recordNumber: string;
  topic: string;
  location: string;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  createdAt: string;
  createdBy: string | null;
  [key: string]: unknown;
}

/* ── Status options aligned with daily_log_status DB enum ── */
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "high_prio", label: "High Priority" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function DailyLogPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [logs, setLogs] = useState<DailyLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortKey, setSortKey] = useState("recordNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [quickReportModal, setQuickReportModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [escalateModal, setEscalateModal] = useState<{ open: boolean; entryId?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; entryTitle?: string }>({ open: false });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDailyLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load daily logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredData = useMemo(() => {
    let result = [...logs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.topic.toLowerCase().includes(q) ||
          r.recordNumber.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((r) => r.priority === priorityFilter);
    }

    return result;
  }, [searchQuery, statusFilter, priorityFilter]);

  const columns = [
    {
      key: "recordNumber",
      label: "Record #",
      sortable: true,
      render: (row: DailyLogEntry) => (
        <span className="font-mono text-[12px] font-medium text-[var(--interactive)]">
          {row.recordNumber}
        </span>
      ),
    },
    {
      key: "topic",
      label: "Topic",
      sortable: true,
      render: (row: DailyLogEntry) => (
        <span className="text-[13px] font-medium">{row.topic}</span>
      ),
    },
    { key: "location", label: "Location" },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row: DailyLogEntry) => (
        <PriorityBadge priority={row.priority} />
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: DailyLogEntry) => (
        <StatusBadge status={row.status} dot />
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row: DailyLogEntry) => (
        <span className="text-[12px] text-[var(--text-tertiary)]">
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
    { key: "createdBy", label: "Created By" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={24} className="text-[var(--status-critical)]" />
        <p className="text-[13px] text-[var(--text-tertiary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={loadLogs}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Daily Log
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
            Activity log with quick report and escalation paths
          </p>
        </div>
        <Button variant="default" size="md" onClick={() => setQuickReportModal(true)}>
          <Plus size={14} />
          New Entry
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            options={PRIORITY_OPTIONS}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Data grid */}
      <div className="surface-card overflow-hidden">
        <DataGrid
          columns={columns}
          data={filteredData}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={(key, dir) => {
            setSortKey(key);
            setSortDirection(dir);
          }}
          onRowClick={(row) => router.push(`/daily-log/${row.id}`)}
          totalCount={logs.length}
        />
      </div>

      {/* ── Modals ── */}
      <QuickReportModal
        open={quickReportModal}
        onClose={() => setQuickReportModal(false)}
        onSubmit={async (data) => {
          toast("Quick report created", { variant: "success" });
          setQuickReportModal(false);
          loadLogs();
        }}
      />

      <EditDailyLogModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false })}
        onSubmit={async (data) => {
          toast("Daily log updated", { variant: "success" });
          setEditModal({ open: false });
        }}
        initialData={editModal.data ?? null}
      />

      <EscalateToIncidentModal
        open={escalateModal.open}
        onClose={() => setEscalateModal({ open: false })}
        onConfirm={async (data) => {
          toast("Incident created from daily log", { variant: "info" });
          setEscalateModal({ open: false });
        }}
      />

      <DeleteDailyLogModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={async () => {
          toast("Daily log deleted", { variant: "info" });
          setDeleteModal({ open: false });
        }}
        entryTitle={deleteModal.entryTitle}
      />
    </div>
  );
}
