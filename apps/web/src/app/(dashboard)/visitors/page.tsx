"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Users,
  Clock,
  LogIn,
  LogOut,
  Star,
  Truck,
  HardHat,
  Camera,
  Music,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CreateVisitModal,
  SignInModal,
  SignOutModal,
} from "@/components/modals/visitors";

/* ── Types ── */
type VisitPurpose = "vip_guest" | "vendor_check_in" | "contractor" | "media" | "performer";
type VisitStatus = "pending" | "signed_in" | "signed_out" | "no_show" | "cancelled";

interface Visitor {
  name: string;
  organization: string;
}

interface Visit {
  id: string;
  visitNumber: string;
  purpose: VisitPurpose;
  status: VisitStatus;
  host: string;
  location: string;
  scheduledAt: string;
  scheduledDate: string;
  visitors: Visitor[];
  notes: string;
}

/* ── Purpose Config ── */
const PURPOSE_CONFIG: Record<VisitPurpose, { label: string; tone: "info" | "warning" | "success" | "critical" | "attention"; icon: React.ReactNode }> = {
  vip_guest: { label: "VIP Guest", tone: "attention", icon: <Star className="h-3 w-3" /> },
  vendor_check_in: { label: "Vendor", tone: "info", icon: <Truck className="h-3 w-3" /> },
  contractor: { label: "Contractor", tone: "warning", icon: <HardHat className="h-3 w-3" /> },
  media: { label: "Media", tone: "critical", icon: <Camera className="h-3 w-3" /> },
  performer: { label: "Performer", tone: "success", icon: <Music className="h-3 w-3" /> },
};

/* ── Mock Data ── */
const MOCK_VISITS: Visit[] = [
  {
    id: "1",
    visitNumber: "VIS-2026-0034",
    purpose: "vip_guest",
    status: "signed_in",
    host: "Sarah Chen, Event Director",
    location: "VIP Lounge — Main Stage",
    scheduledAt: "10:00 AM",
    scheduledDate: "Apr 5, 2026",
    visitors: [
      { name: "David Park", organization: "Horizon Media Group" },
      { name: "Lisa Wang", organization: "Horizon Media Group" },
    ],
    notes: "Reserved parking spot #12. Escort from gate required.",
  },
  {
    id: "2",
    visitNumber: "VIS-2026-0035",
    purpose: "vendor_check_in",
    status: "pending",
    host: "Mike Torres, Operations",
    location: "Loading Dock B",
    scheduledAt: "11:30 AM",
    scheduledDate: "Apr 5, 2026",
    visitors: [
      { name: "Carlos Ruiz", organization: "FreshBite Catering" },
      { name: "Ana Morales", organization: "FreshBite Catering" },
      { name: "Jim Patel", organization: "FreshBite Catering" },
    ],
    notes: "Delivery of food supplies for weekend event. 2 refrigerated trucks.",
  },
  {
    id: "3",
    visitNumber: "VIS-2026-0036",
    purpose: "contractor",
    status: "signed_in",
    host: "Rachel Kim, Facilities",
    location: "Maintenance Bay 3",
    scheduledAt: "8:00 AM",
    scheduledDate: "Apr 5, 2026",
    visitors: [
      { name: "Tom Bradley", organization: "Apex Electrical Inc." },
    ],
    notes: "Electrical panel repair, Section D. Must wear hard hat at all times.",
  },
  {
    id: "4",
    visitNumber: "VIS-2026-0037",
    purpose: "media",
    status: "no_show",
    host: "Jennifer Liu, PR",
    location: "Press Room — Admin Building",
    scheduledAt: "9:00 AM",
    scheduledDate: "Apr 5, 2026",
    visitors: [
      { name: "Mark Stevens", organization: "City Times" },
      { name: "Yuki Tanaka", organization: "City Times" },
    ],
    notes: "Press credentials required. Interview with CEO at 9:30 AM.",
  },
  {
    id: "5",
    visitNumber: "VIS-2026-0038",
    purpose: "performer",
    status: "signed_out",
    host: "DJ Control, Entertainment",
    location: "Backstage — North Stage",
    scheduledAt: "2:00 PM",
    scheduledDate: "Apr 5, 2026",
    visitors: [
      { name: "Ava Monroe", organization: "Stellar Talent Agency" },
      { name: "Jordan Ellis", organization: "Stellar Talent Agency" },
      { name: "Chris Vega", organization: "Stellar Talent Agency" },
      { name: "Nina Brooks", organization: "Stellar Talent Agency" },
    ],
    notes: "Sound check at 2:30 PM. Performance at 4:00 PM. 2 dressing rooms reserved.",
  },
];

/* ── Filter Options ── */
const PURPOSE_OPTIONS = [
  { value: "", label: "All Purposes" },
  { value: "vip_guest", label: "VIP Guest" },
  { value: "vendor_check_in", label: "Vendor" },
  { value: "contractor", label: "Contractor" },
  { value: "media", label: "Media" },
  { value: "performer", label: "Performer" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "signed_in", label: "Signed In" },
  { value: "signed_out", label: "Signed Out" },
  { value: "no_show", label: "No Show" },
  { value: "cancelled", label: "Cancelled" },
];

/* ── Purpose Badge Component ── */
function PurposeBadge({ purpose }: { purpose: VisitPurpose }) {
  const config = PURPOSE_CONFIG[purpose];
  return (
    <Badge tone={config.tone}>
      <span className="inline-flex items-center gap-1">
        {config.icon}
        {config.label}
      </span>
    </Badge>
  );
}

/* ── Page ── */
export default function VisitorsPage() {
  const [view, setView] = useState<"today" | "all">("today");
  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const filtered = useMemo(() => {
    let items = [...MOCK_VISITS];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (v) =>
          v.visitNumber.toLowerCase().includes(q) ||
          v.host.toLowerCase().includes(q) ||
          v.visitors.some((vis) => vis.name.toLowerCase().includes(q)) ||
          v.visitors.some((vis) => vis.organization.toLowerCase().includes(q))
      );
    }
    if (purposeFilter) items = items.filter((v) => v.purpose === purposeFilter);
    if (statusFilter) items = items.filter((v) => v.status === statusFilter);

    return items;
  }, [search, purposeFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Visitors</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Sign-in/out tracking, badge generation, and visitor management
          </p>
        </div>
        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Visit
        </Button>
      </div>

      {/* ── View Toggle + Filters ── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
          <button
            onClick={() => setView("today")}
            className={`flex items-center gap-1.5 px-3 h-9 text-[13px] font-medium transition-colors ${
              view === "today"
                ? "bg-[var(--action-primary)] text-white"
                : "bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Today&apos;s Visitors
          </button>
          <button
            onClick={() => setView("all")}
            className={`flex items-center gap-1.5 px-3 h-9 text-[13px] font-medium transition-colors border-l border-[var(--border-default)] ${
              view === "all"
                ? "bg-[var(--action-primary)] text-white"
                : "bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            All Visits
          </button>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
            />
          </div>
        </div>

        <div className="w-full sm:w-[150px]">
          <Select
            options={PURPOSE_OPTIONS}
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
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
        {filtered.length} visit{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* ── Today's Visitors — Card View ── */}
      {view === "today" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((visit) => (
            <Card key={visit.id} hover>
              <CardContent className="space-y-3">
                {/* Top row: Visit # + badges */}
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/visitors/${visit.id}`}
                    className="text-[13px] font-semibold text-[var(--action-primary)] hover:underline"
                  >
                    {visit.visitNumber}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <PurposeBadge purpose={visit.purpose} />
                    <StatusBadge status={visit.status} dot />
                  </div>
                </div>

                {/* Host */}
                <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                  <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                  <span className="truncate">Host: {visit.host}</span>
                </div>

                {/* Scheduled time */}
                <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]">
                  <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
                  <span>{visit.scheduledDate} at {visit.scheduledAt}</span>
                </div>

                {/* Visitors */}
                <div className="text-[13px] text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide font-medium">
                    Visitors ({visit.visitors.length})
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {visit.visitors.slice(0, 3).map((vis, idx) => (
                      <div key={idx} className="text-[var(--text-primary)] truncate">
                        {vis.name}
                        <span className="text-[var(--text-tertiary)]"> — {vis.organization}</span>
                      </div>
                    ))}
                    {visit.visitors.length > 3 && (
                      <div className="text-[var(--text-tertiary)] text-[12px]">
                        +{visit.visitors.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-default)]">
                  {(visit.status === "pending") && (
                    <Button size="sm" variant="default" onClick={() => { setSelectedVisit(visit); setSignInOpen(true); }}>
                      <LogIn className="h-3 w-3" />
                      Sign In
                    </Button>
                  )}
                  {(visit.status === "signed_in") && (
                    <Button size="sm" variant="secondary" onClick={() => { setSelectedVisit(visit); setSignOutOpen(true); }}>
                      <LogOut className="h-3 w-3" />
                      Sign Out
                    </Button>
                  )}
                  <Link href={`/visitors/${visit.id}`} className="ml-auto">
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-8 text-center">
              <p className="text-[13px] text-[var(--text-tertiary)]">No visits match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* ── All Visits — Table View ── */}
      {view === "all" && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-secondary)]">
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Visit #</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Purpose</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Host</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Location</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Scheduled</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Visitors</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((visit) => (
                  <tr
                    key={visit.id}
                    className="border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/visitors/${visit.id}`}
                        className="text-[var(--action-primary)] hover:underline font-medium"
                      >
                        {visit.visitNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <PurposeBadge purpose={visit.purpose} />
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-primary)]">{visit.host.split(",")[0]}</td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">{visit.location}</td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] whitespace-nowrap">
                      {visit.scheduledDate} {visit.scheduledAt}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-primary)]">
                      {visit.visitors.length} visitor{visit.visitors.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={visit.status} dot />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {visit.status === "pending" && (
                          <Button size="sm" variant="default" onClick={() => { setSelectedVisit(visit); setSignInOpen(true); }}>
                            <LogIn className="h-3 w-3" />
                            Sign In
                          </Button>
                        )}
                        {visit.status === "signed_in" && (
                          <Button size="sm" variant="secondary" onClick={() => { setSelectedVisit(visit); setSignOutOpen(true); }}>
                            <LogOut className="h-3 w-3" />
                            Sign Out
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                      No visits match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <CreateVisitModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          console.log("Create visit:", data);
          setCreateOpen(false);
        }}
      />
      <SignInModal
        open={signInOpen}
        onClose={() => { setSignInOpen(false); setSelectedVisit(null); }}
        onSubmit={async (data) => {
          console.log("Sign in:", data);
          setSignInOpen(false);
          setSelectedVisit(null);
        }}
      />
      <SignOutModal
        open={signOutOpen}
        onClose={() => { setSignOutOpen(false); setSelectedVisit(null); }}
        onConfirm={async () => {
          console.log("Sign out:", selectedVisit?.id);
          setSignOutOpen(false);
          setSelectedVisit(null);
        }}
        visitorName={selectedVisit?.visitors[0]?.name ?? "Visitor"}
        badgeNumber=""
        signInTime=""
      />
    </div>
  );
}
