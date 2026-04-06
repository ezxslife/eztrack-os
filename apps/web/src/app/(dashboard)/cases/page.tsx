"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DeleteCaseModal } from "@/components/modals/cases";
import { useToast } from "@/components/ui/Toast";

/* ── Types ── */
interface CaseRow {
  id: string;
  caseNumber: string;
  caseType: string;
  status: string;
  leadInvestigator: string;
  created: string;
  priority: "critical" | "high" | "medium" | "low";
  [key: string]: unknown;
}

/* ── Mock Data ── */
const MOCK_CASES: CaseRow[] = [
  {
    id: "1",
    caseNumber: "CSE-2026-001",
    caseType: "Theft Investigation",
    status: "in_progress",
    leadInvestigator: "Sgt. Maria Patel",
    created: "Apr 5, 10:30 AM",
    priority: "high",
  },
  {
    id: "2",
    caseNumber: "CSE-2026-002",
    caseType: "Assault Follow-up",
    status: "investigation",
    leadInvestigator: "Lt. Sarah Nguyen",
    created: "Apr 4, 3:15 PM",
    priority: "critical",
  },
  {
    id: "3",
    caseNumber: "CSE-2026-003",
    caseType: "Trespassing Pattern",
    status: "open",
    leadInvestigator: "Officer James Rivera",
    created: "Apr 3, 9:00 AM",
    priority: "medium",
  },
  {
    id: "4",
    caseNumber: "CSE-2026-004",
    caseType: "Drug Activity",
    status: "assigned",
    leadInvestigator: "Capt. David Kim",
    created: "Apr 2, 11:45 AM",
    priority: "high",
  },
];

export default function CasesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("caseNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; caseNumber?: string }>({ open: false });

  const filtered = useMemo(() => {
    let items = [...MOCK_CASES];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.caseType.toLowerCase().includes(q) ||
          c.leadInvestigator.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      const aVal = a[sortKey] as string;
      const bVal = b[sortKey] as string;
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [search, sortKey, sortDir]);

  const columns = [
    {
      key: "caseNumber",
      label: "Case #",
      sortable: true,
      render: (row: CaseRow) => (
        <Link
          href={`/cases/${row.id}`}
          className="text-[var(--action-primary)] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {row.caseNumber}
        </Link>
      ),
    },
    { key: "caseType", label: "Type", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: CaseRow) => <StatusBadge status={row.status} dot />,
    },
    { key: "leadInvestigator", label: "Lead Investigator" },
    { key: "created", label: "Created", sortable: true },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row: CaseRow) => <PriorityBadge priority={row.priority} />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Case Management
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Investigation workflow, evidence tracking, and case resolution
          </p>
        </div>
        <Link href="/cases/new">
          <Button variant="destructive" size="md">
            <Plus className="h-3.5 w-3.5" />
            New Case
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
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
            />
          </div>
        </div>
      </div>

      {/* ── Count ── */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} case{filtered.length !== 1 ? "s" : ""}
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
          onRowClick={(row) => router.push(`/cases/${row.id}`)}
          emptyMessage="No cases match your search"
          totalCount={filtered.length}
          pageSize={20}
        />
      </div>

      {/* ── Modals ── */}
      <DeleteCaseModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={async (reason) => {
          toast("Case deleted", { variant: "info" });
          setDeleteModal({ open: false });
        }}
        caseNumber={deleteModal.caseNumber ?? ""}
      />
    </div>
  );
}
