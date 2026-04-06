"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, UserCog } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { CreatePersonnelModal } from "@/components/modals/personnel";

/* ── Types ── */
interface StaffRow {
  id: string;
  name: string;
  role: string;
  status: string;
  phone: string;
  lastActive: string;
  [key: string]: unknown;
}

/* ── Status label mapping ── */
const statusDisplay: Record<string, string> = {
  available: "Available",
  on_break: "On Break",
  off_duty: "Off Duty",
  dispatched: "Dispatched",
  on_scene: "On Scene",
};

const statusTone: Record<string, "success" | "warning" | "default" | "info" | "attention"> = {
  available: "success",
  on_break: "attention",
  off_duty: "default",
  dispatched: "info",
  on_scene: "warning",
};

/* ── Role badge tones ── */
const roleTone: Record<string, "info" | "warning" | "critical" | "default"> = {
  Manager: "critical",
  Dispatcher: "warning",
  Supervisor: "info",
  Staff: "default",
};

/* ── Mock Data ── */
const MOCK_STAFF: StaffRow[] = [
  {
    id: "1",
    name: "Sgt. Maria Patel",
    role: "Supervisor",
    status: "available",
    phone: "(555) 234-5678",
    lastActive: "2 min ago",
  },
  {
    id: "2",
    name: "Officer James Rivera",
    role: "Staff",
    status: "dispatched",
    phone: "(555) 345-6789",
    lastActive: "Just now",
  },
  {
    id: "3",
    name: "Lt. Sarah Nguyen",
    role: "Manager",
    status: "available",
    phone: "(555) 456-7890",
    lastActive: "5 min ago",
  },
  {
    id: "4",
    name: "Officer Lisa Chen",
    role: "Staff",
    status: "on_break",
    phone: "(555) 567-8901",
    lastActive: "15 min ago",
  },
  {
    id: "5",
    name: "Capt. David Kim",
    role: "Manager",
    status: "available",
    phone: "(555) 678-9012",
    lastActive: "8 min ago",
  },
  {
    id: "6",
    name: "Coordinator Emily Park",
    role: "Dispatcher",
    status: "available",
    phone: "(555) 789-0123",
    lastActive: "1 min ago",
  },
  {
    id: "7",
    name: "Officer Marcus Johnson",
    role: "Staff",
    status: "off_duty",
    phone: "(555) 890-1234",
    lastActive: "3 hr ago",
  },
  {
    id: "8",
    name: "Officer Ana Martinez",
    role: "Staff",
    status: "on_scene",
    phone: "(555) 901-2345",
    lastActive: "Just now",
  },
];

/* ── Filter Options ── */
const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "Manager", label: "Manager" },
  { value: "Dispatcher", label: "Dispatcher" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Staff", label: "Staff" },
];

export default function PersonnelPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let items = [...MOCK_STAFF];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }
    if (roleFilter) items = items.filter((s) => s.role === roleFilter);
    return items;
  }, [search, roleFilter]);

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: StaffRow) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <Link
            href={`/personnel/${row.id}`}
            className="text-[var(--text-primary)] font-medium hover:text-[var(--action-primary)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row: StaffRow) => (
        <Badge tone={roleTone[row.role] ?? "default"}>{row.role}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: StaffRow) => (
        <Badge tone={statusTone[row.status] ?? "default"} dot>
          {statusDisplay[row.status] ?? row.status}
        </Badge>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "lastActive", label: "Last Active", sortable: true },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Personnel
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Staff profiles, training, and scheduling
          </p>
        </div>
        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Staff
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
            />
          </div>
        </div>
        <div className="w-full sm:w-[160px]">
          <Select
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ── Count ── */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} staff member{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── Data Grid ── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
        <DataGrid
          columns={columns}
          data={filtered}
          onRowClick={(row) => router.push(`/personnel/${row.id}`)}
          emptyMessage="No personnel match your filters"
          totalCount={filtered.length}
          pageSize={20}
        />
      </div>

      {/* ── Modals ── */}
      <CreatePersonnelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          console.log("Create personnel:", data);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
