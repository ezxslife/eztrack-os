"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, UserCog, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { CreatePersonnelModal } from "@/components/modals/personnel";
import { fetchPersonnel, type PersonnelRow } from "@/lib/queries/personnel";
import { formatRelativeTime } from "@/lib/utils/time";
import { useToast } from "@/components/ui/Toast";

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
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadPersonnel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPersonnel();
      setStaff(data.map((p) => ({
        ...p,
        lastActive: formatRelativeTime(p.lastActive),
      })));
    } catch (err: any) {
      setError(err.message || "Failed to load personnel");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPersonnel();
  }, [loadPersonnel]);

  const filtered = useMemo(() => {
    let items = [...staff];
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
        <Button variant="outline" size="sm" onClick={loadPersonnel}>Retry</Button>
      </div>
    );
  }

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
        <div className="page-toolbar-search">
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
          toast("Staff member added", { variant: "success" });
          setCreateOpen(false);
          loadPersonnel();
        }}
      />
    </div>
  );
}
