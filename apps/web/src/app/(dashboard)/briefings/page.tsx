"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { CreateBriefingModal } from "@/components/modals/briefings";
import { fetchBriefings, type BriefingRow } from "@/lib/queries/briefings";
import { formatRelativeTime } from "@/lib/utils/time";
import { useToast } from "@/components/ui/Toast";

/* ── Priority tone map ── */
const priorityTone: Record<string, "critical" | "warning" | "info"> = {
  high: "critical",
  medium: "warning",
  low: "info",
};

/* ── Filter Options ── */
const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function BriefingsPage() {
  const { toast } = useToast();
  const [briefings, setBriefings] = useState<BriefingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const loadBriefings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBriefings();
      setBriefings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load briefings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBriefings();
  }, [loadBriefings]);

  const filtered = useMemo(() => {
    let items = [...briefings];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.preview.toLowerCase().includes(q)
      );
    }
    if (priorityFilter) {
      items = items.filter((b) => b.priority === priorityFilter);
    }
    return items;
  }, [search, priorityFilter, briefings]);

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
        <Button variant="outline" size="sm" onClick={loadBriefings}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Briefings
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Shift handoff communications and operational updates
          </p>
        </div>
        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Briefing
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search briefings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
            />
          </div>
        </div>
        <div className="w-full sm:w-[160px]">
          <Select
            options={PRIORITY_OPTIONS}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ── Count ── */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} briefing{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── Briefing Feed ── */}
      <div className="flex flex-col gap-3">
        {filtered.map((briefing) => (
          <Card key={briefing.id} hover>
            <CardContent className="pb-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-[13px] font-medium text-[var(--text-primary)] leading-tight">
                  {briefing.title}
                </h3>
                <Badge tone={priorityTone[briefing.priority]} dot>
                  {briefing.priority.charAt(0).toUpperCase() +
                    briefing.priority.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-2.5">
                <Avatar name={briefing.author} size="xs" />
                <span className="text-[12px] text-[var(--text-secondary)]">
                  {briefing.author}
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {formatRelativeTime(briefing.createdAt)}
                </span>
              </div>

              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {briefing.preview}
              </p>
            </CardContent>

            <CardFooter className="justify-between">
              <span className="text-[12px] text-[var(--text-tertiary)]">
                Briefing
              </span>
              <Link
                href={`/briefings/${briefing.id}`}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--action-primary)] hover:underline"
              >
                Read more
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardFooter>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-[var(--text-tertiary)]">
            No briefings match your filters
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <CreateBriefingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          toast("Briefing created", { variant: "success" });
          setCreateOpen(false);
          loadBriefings();
        }}
      />
    </div>
  );
}
