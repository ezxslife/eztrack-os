"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { CreateBriefingModal } from "@/components/modals/briefings";

/* ── Types ── */
interface BriefingItem {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  author: string;
  timestamp: string;
  preview: string;
  acknowledgments: number;
}

/* ── Priority tone map ── */
const priorityTone: Record<string, "critical" | "warning" | "info"> = {
  high: "critical",
  medium: "warning",
  low: "info",
};

/* ── Mock Data ── */
const MOCK_BRIEFINGS: BriefingItem[] = [
  {
    id: "1",
    title: "Evening Shift Handoff",
    priority: "high",
    author: "Sgt. Maria Patel",
    timestamp: "12 min ago",
    preview:
      "Gate B had two unresolved disturbance calls during day shift. VIP section requires additional patrol due to artist arrival at 7 PM. Medical tent reported low supply of cold packs.",
    acknowledgments: 3,
  },
  {
    id: "2",
    title: "Weather Alert: Storm Warning",
    priority: "high",
    author: "Lt. James Nguyen",
    timestamp: "45 min ago",
    preview:
      "NWS has issued a severe thunderstorm warning for our area from 6 PM to 10 PM. All outdoor stages may need evacuation protocol activation. Shelter points are marked on the updated venue map.",
    acknowledgments: 8,
  },
  {
    id: "3",
    title: "VIP Arrival Protocol Update",
    priority: "medium",
    author: "Capt. Sarah Chen",
    timestamp: "2 hr ago",
    preview:
      "Updated escort routes for tonight's headliner arrival. North entrance will be secured 30 minutes prior. Credential checks have been tightened for backstage access per artist management request.",
    acknowledgments: 5,
  },
  {
    id: "4",
    title: "Medical Tent Location Change",
    priority: "medium",
    author: "Officer David Rivera",
    timestamp: "3 hr ago",
    preview:
      "Secondary medical tent has been relocated from Lot C to the south lawn near Gate D due to drainage issues. Updated signage is being posted. Radio dispatch has been notified of the new coordinates.",
    acknowledgments: 4,
  },
  {
    id: "5",
    title: "Radio Channel Assignment Update",
    priority: "low",
    author: "Dispatch Coordinator Kim",
    timestamp: "5 hr ago",
    preview:
      "Channels 3 and 7 have been reassigned for the evening operations. Security ops moves to Channel 3, medical stays on Channel 5. See attached frequency table for full breakdown.",
    acknowledgments: 11,
  },
];

/* ── Filter Options ── */
const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function BriefingsPage() {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let items = [...MOCK_BRIEFINGS];
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
  }, [search, priorityFilter]);

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
                  {briefing.timestamp}
                </span>
              </div>

              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {briefing.preview}
              </p>
            </CardContent>

            <CardFooter className="justify-between">
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {briefing.acknowledgments} acknowledgment
                {briefing.acknowledgments !== 1 ? "s" : ""}
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
          console.log("Create briefing:", data);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
