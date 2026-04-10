"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Clock,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getReadableForegroundColor } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChipGroup } from "@/components/ui/FilterChipGroup";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CreatePatronModal } from "@/components/modals/patrons";
import { fetchPatrons, createPatron, type PatronRow, type PatronFlag } from "@/lib/queries/patrons";
import { formatRelativeTime } from "@/lib/utils/time";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToast } from "@/components/ui/Toast";

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

/* ── Initials avatar ── */
function Avatar({ firstName, lastName, color }: { firstName: string; lastName: string; color: string }) {
  const initials = `${firstName[0]}${lastName[0]}`;
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
      style={{ backgroundColor: color, color: getReadableForegroundColor(color) }}
    >
      {initials}
    </div>
  );
}

export default function PatronsPage() {
  const { toast } = useToast();
  const [patrons, setPatrons] = useState<PatronRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState<PatronFlag | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPatrons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPatrons();
      setPatrons(data);
      // Get orgId for creating patrons
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user.id)
          .single();
        if (profile) setOrgId(profile.org_id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load patrons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatrons();
  }, [loadPatrons]);

  const filtered = useMemo(() => {
    return patrons.filter((p) => {
      const matchesSearch =
        !search ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchesFlag = flagFilter === "all" || p.flag === flagFilter;
      return matchesSearch && matchesFlag;
    }).map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      flag: p.flag as PatronFlag,
      flagReason: (p.notes || "") as string,
      lastLocation: "",
      lastSeen: formatRelativeTime(p.createdAt),
    }));
  }, [search, flagFilter, patrons]);

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
        <Button variant="outline" size="sm" onClick={loadPatrons}>Retry</Button>
      </div>
    );
  }

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
        <FilterChipGroup
          ariaLabel="Filter patrons by flag"
          options={FLAG_FILTERS.map((filter) => ({
            ...filter,
            dotColor:
              filter.value !== "all" && filter.value in FLAG_CONFIG
                ? FLAG_CONFIG[filter.value as PatronFlag].color
                : undefined,
          }))}
          value={flagFilter}
          onChange={setFlagFilter}
        />

        <SegmentedControl
          ariaLabel="Patron view mode"
          options={[
            { value: "grid", label: "Grid", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
            { value: "list", label: "List", icon: <List className="h-3.5 w-3.5" /> },
          ]}
          size="sm"
          value={view}
          onChange={setView}
        />
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
        <div className="surface-card">
          <EmptyState
            icon={<User size={20} />}
            title="No patrons match your search"
            description="Try a broader search or clear the current patron filter."
            action={{ label: "Add Patron", onClick: () => setShowCreateModal(true), variant: "outline" }}
          />
        </div>
      )}

      {/* ── Modals ── */}
      <CreatePatronModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => {
          try {
            if (!orgId) throw new Error("Organization not found");
            await createPatron({
              orgId,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email || undefined,
              phone: data.phone || undefined,
              dob: data.dob || undefined,
              ticketType: data.ticketType || undefined,
              idType: data.idType || undefined,
              idNumber: data.idNumber || undefined,
            });
            toast("Patron created", { variant: "success" });
            setShowCreateModal(false);
            loadPatrons();
          } catch (err: any) {
            toast(err.message || "Failed to create patron", { variant: "error" });
          }
        }}
      />
    </div>
  );
}
