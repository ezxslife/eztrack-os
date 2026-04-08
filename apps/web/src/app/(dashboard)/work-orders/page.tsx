"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { CreateWorkOrderModal } from "@/components/modals/work-orders";
import { fetchWorkOrders, createWorkOrder, type WorkOrderRow } from "@/lib/queries/work-orders";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { formatRelativeTime } from "@/lib/utils/time";
import { useToast } from "@/components/ui/Toast";

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
  const { toast } = useToast();
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState("woNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ orgId: string; propertyId: string | null } | null>(null);

  const resolveUserProfile = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("org_id, property_id")
      .eq("id", user.id)
      .single();

    if (error || !profile?.org_id) {
      throw new Error("Unable to determine organization");
    }

    const resolved = {
      orgId: profile.org_id,
      propertyId: profile.property_id,
    };

    setUserProfile(resolved);
    return resolved;
  }, []);

  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkOrders();
      setWorkOrders(data);
      await resolveUserProfile();
    } catch (err: any) {
      setError(err.message || "Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, [resolveUserProfile]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const filtered = useMemo(() => {
    let items = [...workOrders];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (w) =>
          w.woNumber.toLowerCase().includes(q) ||
          w.title.toLowerCase().includes(q) ||
          (w.assignedTo || "").toLowerCase().includes(q)
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
  }, [workOrders, search, categoryFilter, sortKey, sortDir]);

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
        <Button variant="outline" size="sm" onClick={loadWorkOrders}>Retry</Button>
      </div>
    );
  }

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
          try {
            const profile = userProfile ?? (await resolveUserProfile());
            await createWorkOrder({
              orgId: profile.orgId,
              propertyId: profile.propertyId,
              title: data.title,
              description: data.description || undefined,
              category: data.category,
              priority: data.priority,
              locationId: data.location || null,
              assignedTo: data.assignTo || null,
              dueDate: data.dueDate || undefined,
              scheduledDate: data.scheduledDate || undefined,
              estimatedCost: data.estimatedCost || undefined,
            });
            toast("Work order created", { variant: "success" });
            setShowCreateModal(false);
            await loadWorkOrders();
          } catch (err: any) {
            toast(err.message || "Failed to create work order", { variant: "error" });
          }
        }}
      />
    </div>
  );
}
