"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreatePatronModal } from "@/components/modals/patrons";

/* ── Flag config ── */
type PatronFlag = "banned" | "watch" | "vip" | "warning" | "none";

const FLAG_CONFIG: Record<
  PatronFlag,
  { label: string; tone: "critical" | "attention" | "info" | "warning" | "default"; color: string }
> = {
  banned: { label: "Banned", tone: "critical", color: "#dc2626" },
  watch: { label: "Watch", tone: "attention", color: "#ca8a04" },
  vip: { label: "VIP", tone: "info", color: "#2563eb" },
  warning: { label: "Warning", tone: "warning", color: "#d97706" },
  none: { label: "None", tone: "default", color: "#6b7280" },
};

const FLAG_FILTERS: { value: PatronFlag | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "watch", label: "Watch" },
  { value: "banned", label: "Banned" },
  { value: "vip", label: "VIP" },
  { value: "warning", label: "Warning" },
  { value: "none", label: "None" },
];

/* ── Mock data ── */
interface Patron {
  id: string;
  firstName: string;
  lastName: string;
  flag: PatronFlag;
  flagReason: string;
  lastLocation: string;
  lastSeen: string;
  photo?: string;
}

const MOCK_PATRONS: Patron[] = [
  { id: "1", firstName: "Marcus", lastName: "Johnson", flag: "banned", flagReason: "Repeat disruptive behavior", lastLocation: "Main Stage", lastSeen: "2hr ago" },
  { id: "2", firstName: "Sarah", lastName: "Chen", flag: "vip", flagReason: "Artist performer", lastLocation: "VIP Lounge", lastSeen: "30m ago" },
  { id: "3", firstName: "Jake", lastName: "Williams", flag: "watch", flagReason: "Previous noise complaint", lastLocation: "Campground A", lastSeen: "1hr ago" },
  { id: "4", firstName: "Maria", lastName: "Rodriguez", flag: "none", flagReason: "", lastLocation: "Family Zone", lastSeen: "45m ago" },
  { id: "5", firstName: "Tyler", lastName: "Brooks", flag: "warning", flagReason: "ID mismatch flagged", lastLocation: "North Gate", lastSeen: "15m ago" },
  { id: "6", firstName: "Aisha", lastName: "Patel", flag: "vip", flagReason: "Sponsor guest", lastLocation: "VIP Tent A", lastSeen: "1hr ago" },
  { id: "7", firstName: "David", lastName: "Kim", flag: "none", flagReason: "", lastLocation: "West Field", lastSeen: "3hr ago" },
  { id: "8", firstName: "Lisa", lastName: "Thompson", flag: "banned", flagReason: "Drug violation, ejected", lastLocation: "South Gate", lastSeen: "5hr ago" },
];

/* ── Initials avatar ── */
function Avatar({ firstName, lastName, color }: { firstName: string; lastName: string; color: string }) {
  const initials = `${firstName[0]}${lastName[0]}`;
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[13px] font-semibold shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export default function PatronsPage() {
  const [search, setSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState<PatronFlag | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_PATRONS.filter((p) => {
      const matchesSearch =
        !search ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        p.lastLocation.toLowerCase().includes(search.toLowerCase());
      const matchesFlag = flagFilter === "all" || p.flag === flagFilter;
      return matchesSearch && matchesFlag;
    });
  }, [search, flagFilter]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Patron Management
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
            Flag system, ID scanning, and entry tracking
          </p>
        </div>
        <Button variant="default" size="md" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} />
          Add Patron
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patrons by name or location..."
          className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
        />
      </div>

      {/* Filter chips + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FLAG_FILTERS.map((f) => {
            const isActive = flagFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFlagFilter(f.value)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[var(--action-primary)] text-white border-[var(--action-primary)]"
                    : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 border border-[var(--border-default)] rounded-lg p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              view === "grid"
                ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              view === "list"
                ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
            aria-label="List view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} patron{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid view */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((patron) => {
            const cfg = FLAG_CONFIG[patron.flag];
            return (
              <Link key={patron.id} href={`/patrons/${patron.id}`}>
                <div className="surface-card p-4 hover:border-[var(--border-hover)] transition-all duration-150 cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <Avatar
                      firstName={patron.firstName}
                      lastName={patron.lastName}
                      color={cfg.color}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--action-primary)] transition-colors">
                        {patron.firstName} {patron.lastName}
                      </p>
                      <div className="mt-1">
                        <Badge tone={cfg.tone} dot>
                          {cfg.label}
                        </Badge>
                      </div>
                      {patron.flagReason && (
                        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)] truncate">
                          {patron.flagReason}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={10} />
                          {patron.lastLocation}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={10} />
                          {patron.lastSeen}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="surface-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Patron
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Flag
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden sm:table-cell">
                  Reason
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">
                  Last Location
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patron) => {
                const cfg = FLAG_CONFIG[patron.flag];
                return (
                  <Link
                    key={patron.id}
                    href={`/patrons/${patron.id}`}
                    className="contents"
                  >
                    <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            firstName={patron.firstName}
                            lastName={patron.lastName}
                            color={cfg.color}
                          />
                          <span className="font-medium text-[var(--text-primary)]">
                            {patron.firstName} {patron.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={cfg.tone} dot>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-tertiary)] hidden sm:table-cell">
                        {patron.flagReason || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)] hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={10} className="text-[var(--text-tertiary)]" />
                          {patron.lastLocation}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-tertiary)]">
                        {patron.lastSeen}
                      </td>
                    </tr>
                  </Link>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-[13px] text-[var(--text-tertiary)]">
            No patrons match your search or filter.
          </p>
        </div>
      )}

      {/* ── Modals ── */}
      <CreatePatronModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => {
          console.log("Create patron:", data);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
