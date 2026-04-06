"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ShieldAlert,
  Stethoscope,
  PackageX,
  Swords,
  PaintBucket,
  Footprints,
  Volume2,
  Pill,
  UserSearch,
  Flame,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";

/* ── Types ── */
interface Incident {
  id: string;
  recordNumber: string;
  type: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  assignedTo: string;
  reportedAt: string;
  [key: string]: unknown;
}

/* ── Icon map ── */
const TYPE_ICONS: Record<string, React.ReactNode> = {
  Medical: <Stethoscope className="h-3.5 w-3.5" />,
  Theft: <PackageX className="h-3.5 w-3.5" />,
  Assault: <Swords className="h-3.5 w-3.5" />,
  Vandalism: <PaintBucket className="h-3.5 w-3.5" />,
  Trespassing: <Footprints className="h-3.5 w-3.5" />,
  Disturbance: <Volume2 className="h-3.5 w-3.5" />,
  "Drug/Alcohol": <Pill className="h-3.5 w-3.5" />,
  "Missing Person": <UserSearch className="h-3.5 w-3.5" />,
  "Fire/Hazard": <Flame className="h-3.5 w-3.5" />,
  "Security Breach": <Lock className="h-3.5 w-3.5" />,
};

/* ── Mock Data ── */
const MOCK_INCIDENTS: Incident[] = [
  {
    id: "1",
    recordNumber: "INC-2026-00001",
    type: "Medical",
    location: "Main Stage",
    severity: "critical",
    status: "in_progress",
    assignedTo: "Officer Rivera",
    reportedAt: "4 min ago",
  },
  {
    id: "2",
    recordNumber: "INC-2026-00002",
    type: "Theft",
    location: "VIP Tent A",
    severity: "high",
    status: "assigned",
    assignedTo: "Officer Martinez",
    reportedAt: "12 min ago",
  },
  {
    id: "3",
    recordNumber: "INC-2026-00003",
    type: "Assault",
    location: "Gate B Entrance",
    severity: "critical",
    status: "investigation",
    assignedTo: "Sgt. Patel",
    reportedAt: "28 min ago",
  },
  {
    id: "4",
    recordNumber: "INC-2026-00004",
    type: "Missing Person",
    location: "Family Zone",
    severity: "high",
    status: "in_progress",
    assignedTo: "Officer Davis",
    reportedAt: "35 min ago",
  },
  {
    id: "5",
    recordNumber: "INC-2026-00005",
    type: "Drug/Alcohol",
    location: "Campground Lot C",
    severity: "medium",
    status: "assigned",
    assignedTo: "Officer Chen",
    reportedAt: "52 min ago",
  },
  {
    id: "6",
    recordNumber: "INC-2026-00006",
    type: "Disturbance",
    location: "Food Court West",
    severity: "low",
    status: "open",
    assignedTo: "Unassigned",
    reportedAt: "1 hr ago",
  },
  {
    id: "7",
    recordNumber: "INC-2026-00007",
    type: "Vandalism",
    location: "Restroom Block 4",
    severity: "medium",
    status: "follow_up",
    assignedTo: "Officer Rivera",
    reportedAt: "1.5 hr ago",
  },
  {
    id: "8",
    recordNumber: "INC-2026-00008",
    type: "Fire/Hazard",
    location: "Vendor Row East",
    severity: "critical",
    status: "completed",
    assignedTo: "Lt. Nguyen",
    reportedAt: "2 hr ago",
  },
  {
    id: "9",
    recordNumber: "INC-2026-00009",
    type: "Security Breach",
    location: "Backstage Area",
    severity: "high",
    status: "closed",
    assignedTo: "Sgt. Patel",
    reportedAt: "3 hr ago",
  },
  {
    id: "10",
    recordNumber: "INC-2026-00010",
    type: "Medical",
    location: "South Lawn",
    severity: "medium",
    status: "completed",
    assignedTo: "Officer Martinez",
    reportedAt: "4 hr ago",
  },
  {
    id: "11",
    recordNumber: "INC-2026-00011",
    type: "Trespassing",
    location: "Perimeter Fence North",
    severity: "low",
    status: "closed",
    assignedTo: "Officer Chen",
    reportedAt: "5 hr ago",
  },
  {
    id: "12",
    recordNumber: "INC-2026-00012",
    type: "Disturbance",
    location: "Parking Lot D",
    severity: "low",
    status: "open",
    assignedTo: "Unassigned",
    reportedAt: "6 hr ago",
  },
];

/* ── Filter Options ── */
const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "Medical", label: "Medical" },
  { value: "Theft", label: "Theft" },
  { value: "Assault", label: "Assault" },
  { value: "Vandalism", label: "Vandalism" },
  { value: "Trespassing", label: "Trespassing" },
  { value: "Disturbance", label: "Disturbance" },
  { value: "Drug/Alcohol", label: "Drug/Alcohol" },
  { value: "Missing Person", label: "Missing Person" },
  { value: "Fire/Hazard", label: "Fire/Hazard" },
  { value: "Security Breach", label: "Security Breach" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "follow_up", label: "Follow Up" },
  { value: "investigation", label: "Investigation" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

export default function IncidentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("recordNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let items = [...MOCK_INCIDENTS];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.recordNumber.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.assignedTo.toLowerCase().includes(q)
      );
    }
    if (typeFilter) items = items.filter((i) => i.type === typeFilter);
    if (severityFilter) items = items.filter((i) => i.severity === severityFilter);
    if (statusFilter) items = items.filter((i) => i.status === statusFilter);

    items.sort((a, b) => {
      const aVal = a[sortKey] as string;
      const bVal = b[sortKey] as string;
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [search, typeFilter, severityFilter, statusFilter, sortKey, sortDir]);

  const columns = [
    {
      key: "recordNumber",
      label: "Record #",
      sortable: true,
      render: (row: Incident) => (
        <Link
          href={`/incidents/${row.id}`}
          className="text-[var(--action-primary)] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {row.recordNumber}
        </Link>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row: Incident) => (
        <span className="inline-flex items-center gap-1.5 text-[var(--text-primary)]">
          <span className="text-[var(--text-tertiary)]">
            {TYPE_ICONS[row.type] ?? <ShieldAlert className="h-3.5 w-3.5" />}
          </span>
          {row.type}
        </span>
      ),
    },
    {
      key: "location",
      label: "Location",
    },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      render: (row: Incident) => <PriorityBadge priority={row.severity} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: Incident) => <StatusBadge status={row.status} dot />,
    },
    {
      key: "assignedTo",
      label: "Assigned To",
    },
    {
      key: "reportedAt",
      label: "Reported",
      sortable: true,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Incidents</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Track, classify, and manage all security incidents across the venue
          </p>
        </div>
        <Link href="/incidents/new">
          <Button variant="destructive" size="md">
            <Plus className="h-3.5 w-3.5" />
            New Incident
          </Button>
        </Link>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
            />
          </div>
        </div>
        <div className="w-full sm:w-[160px]">
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[150px]">
          <Select
            options={SEVERITY_OPTIONS}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[150px]">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ── Count ── */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
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
          onRowClick={(row) => router.push(`/incidents/${row.id}`)}
          emptyMessage="No incidents match your filters"
          totalCount={filtered.length}
          pageSize={20}
        />
      </div>
    </div>
  );
}
