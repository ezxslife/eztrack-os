"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
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

interface DailyLogEntry {
  id: string;
  recordNumber: string;
  topic: string;
  location: string;
  priority: "low" | "medium" | "high";
  status: string;
  createdAt: string;
  createdBy: string;
  [key: string]: unknown;
}

const MOCK_DATA: DailyLogEntry[] = [
  {
    id: "1",
    recordNumber: "DL-0001",
    topic: "Main Stage barrier check completed",
    location: "Main Stage",
    priority: "low",
    status: "closed",
    createdAt: "2 min ago",
    createdBy: "Officer Rivera",
  },
  {
    id: "2",
    recordNumber: "DL-0002",
    topic: "Unauthorized vendor near Gate C",
    location: "North Gate",
    priority: "medium",
    status: "open",
    createdAt: "18 min ago",
    createdBy: "Sgt. Patel",
  },
  {
    id: "3",
    recordNumber: "DL-0003",
    topic: "VIP parking lot overcrowding",
    location: "VIP Lot B",
    priority: "high",
    status: "in_progress",
    createdAt: "34 min ago",
    createdBy: "Officer Martinez",
  },
  {
    id: "4",
    recordNumber: "DL-0004",
    topic: "Sound level complaint from adjacent property",
    location: "East Perimeter",
    priority: "medium",
    status: "pending",
    createdAt: "1 hr ago",
    createdBy: "Lt. Nguyen",
  },
  {
    id: "5",
    recordNumber: "DL-0005",
    topic: "Lost child reunited with parent",
    location: "Family Zone",
    priority: "high",
    status: "closed",
    createdAt: "1.5 hr ago",
    createdBy: "Officer Davis",
  },
  {
    id: "6",
    recordNumber: "DL-0006",
    topic: "Water station resupply request",
    location: "West Field",
    priority: "low",
    status: "open",
    createdAt: "2 hr ago",
    createdBy: "Staff Hendricks",
  },
  {
    id: "7",
    recordNumber: "DL-0007",
    topic: "Perimeter fence damage from storm",
    location: "South Boundary",
    priority: "high",
    status: "in_progress",
    createdAt: "3 hr ago",
    createdBy: "Sgt. Patel",
  },
  {
    id: "8",
    recordNumber: "DL-0008",
    topic: "Shift handoff completed for evening crew",
    location: "Command Post",
    priority: "low",
    status: "closed",
    createdAt: "4 hr ago",
    createdBy: "Lt. Nguyen",
  },
  {
    id: "9",
    recordNumber: "DL-0009",
    topic: "Suspicious package reported near entrance",
    location: "Main Entrance",
    priority: "high",
    status: "follow_up",
    createdAt: "5 hr ago",
    createdBy: "Officer Rivera",
  },
  {
    id: "10",
    recordNumber: "DL-0010",
    topic: "Food vendor permit verification",
    location: "Vendor Row",
    priority: "medium",
    status: "completed",
    createdAt: "6 hr ago",
    createdBy: "Officer Davis",
  },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
  { value: "follow_up", label: "Follow Up" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function DailyLogPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortKey, setSortKey] = useState("recordNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [quickReportModal, setQuickReportModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [escalateModal, setEscalateModal] = useState<{ open: boolean; entryId?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; entryTitle?: string }>({ open: false });

  const filteredData = useMemo(() => {
    let result = [...MOCK_DATA];

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
          {row.createdAt}
        </span>
      ),
    },
    { key: "createdBy", label: "Created By" },
  ];

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
          totalCount={MOCK_DATA.length}
        />
      </div>

      {/* ── Modals ── */}
      <QuickReportModal
        open={quickReportModal}
        onClose={() => setQuickReportModal(false)}
        onSubmit={async (data) => {
          toast("Quick report created", { variant: "success" });
          setQuickReportModal(false);
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
