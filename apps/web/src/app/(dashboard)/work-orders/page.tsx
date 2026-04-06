"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { CreateWorkOrderModal } from "@/components/modals/work-orders";

/* ── Types ── */
interface WorkOrderRow {
  id: string;
  woNumber: string;
  title: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  assignedTo: string;
  dueDate: string;
  [key: string]: unknown;
}

/* ── Mock Data ── */
const MOCK_WORK_ORDERS: WorkOrderRow[] = [
  {
    id: "1",
    woNumber: "WO-2026-001",
    title: "Replace blown stage lighting circuit breaker",
    category: "Electrical",
    priority: "high",
    status: "in_progress",
    assignedTo: "Mike Thompson",
    dueDate: "Apr 5, 6:00 PM",
  },
  {
    id: "2",
    woNumber: "WO-2026-002",
    title: "Fix leaking water line at Restroom Block 4",
    category: "Plumbing",
    priority: "critical",
    status: "assigned",
    assignedTo: "Carlos Mendez",
    dueDate: "Apr 5, 4:00 PM",
  },
  {
    id: "3",
    woNumber: "WO-2026-003",
    title: "Repair damaged crowd barrier at Gate B",
    category: "Structural",
    priority: "medium",
    status: "open",
    assignedTo: "Unassigned",
    dueDate: "Apr 6, 12:00 PM",
  },
  {
    id: "4",
    woNumber: "WO-2026-004",
    title: "Post-event cleanup — Food Court West",
    category: "Cleanup",
    priority: "low",
    status: "pending",
    assignedTo: "Cleanup Crew A",
    dueDate: "Apr 6, 8:00 AM",
  },
  {
    id: "5",
    woNumber: "WO-2026-005",
    title: "Recalibrate PA system — South Stage",
    category: "Equipment",
    priority: "medium",
    status: "completed",
    assignedTo: "Audio Team",
    dueDate: "Apr 4, 5:00 PM",
  },
];

/* ── Category badge tones ── */
const categoryTone: Record<string, "warning" | "info" | "critical" | "default" | "attention"> = {
  Electrical: "warning",
  Plumbing: "info",
  Structural: "critical",
  Cleanup: "default",
  Equipment: "attention",
};

/* ── Filter Options ── */
const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Electrical", label: "Electrical" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Structural", label: "Structural" },
  { value: "Cleanup", label: "Cleanup" },
  { value: "Equipment", label: "Equipment" },
];

export default function WorkOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState("woNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    let items = [...MOCK_WORK_ORDERS];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (w) =>
          w.woNumber.toLowerCase().includes(q) ||
          w.title.toLowerCase().includes(q) ||
          w.assignedTo.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) items = items.filter((w) => w.category === categoryFilter);
    items.sort((a, b) => {
      const aVal = a[sortKey] as string;
      const bVal = b[sortKey] as string;
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [search, categoryFilter, sortKey, sortDir]);

  const columns = [
    {
      key: "woNumber",
      label: "WO #",
      sortable: true,
      render: (row: WorkOrderRow) => (
        <span className="text-[var(--action-primary)] font-medium">
          {row.woNumber}
        </span>
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (row: WorkOrderRow) => (
        <span className="text-[var(--text-primary)] truncate max-w-[260px] block">
          {row.title}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row: WorkOrderRow) => (
        <Badge tone={categoryTone[row.category] ?? "default"}>
          {row.category}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row: WorkOrderRow) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: WorkOrderRow) => <StatusBadge status={row.status} dot />,
    },
    { key: "assignedTo", label: "Assigned To" },
    { key: "dueDate", label: "Due Date", sortable: true },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Work Orders
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Maintenance tracking, repairs, and facility operations
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Work Order
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search work orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
            />
          </div>
        </div>
        <div className="w-full sm:w-[160px]">
          <Select
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ── Count ── */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} work order{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── Data Grid ── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
        <DataGrid
          columns={columns}
          data={filtered}
          sortKey={sortKey}
          sortDirection={sortDir}
          onSort={(key, dir) => {
            setSortKey(key);
            setSortDir(dir);
          }}
          emptyMessage="No work orders match your filters"
          totalCount={filtered.length}
          pageSize={20}
        />
      </div>

      {/* ── Modals ── */}
      <CreateWorkOrderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => {
          console.log("Create work order:", data);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
