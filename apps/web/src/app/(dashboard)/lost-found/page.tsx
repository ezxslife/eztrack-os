"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { CreateFoundItemModal } from "@/components/modals/lost-found";

/* ── Types ── */
interface FoundItemRow {
  id: string;
  itemNumber: string;
  description: string;
  locationFound: string;
  status: string;
  foundDate: string;
  foundBy: string;
  [key: string]: unknown;
}

interface LostReportRow {
  id: string;
  reportNumber: string;
  description: string;
  lastSeenLocation: string;
  reportedBy: string;
  date: string;
  [key: string]: unknown;
}

interface MatchRow {
  id: string;
  lostDesc: string;
  foundDesc: string;
  foundLocation: string;
  confidence: string;
}

/* ── Mock Data ── */
const FOUND_ITEMS: FoundItemRow[] = [
  {
    id: "1",
    itemNumber: "FND-001",
    description: "Black leather wallet with ID",
    locationFound: "Main Stage Area",
    status: "stored",
    foundDate: "Apr 5, 2:15 PM",
    foundBy: "Officer Rivera",
  },
  {
    id: "2",
    itemNumber: "FND-002",
    description: "iPhone 15 Pro, space black, cracked screen",
    locationFound: "Gate B Entrance",
    status: "pending_return",
    foundDate: "Apr 5, 1:30 PM",
    foundBy: "Staff Wilson",
  },
  {
    id: "3",
    itemNumber: "FND-003",
    description: "Set of car keys with BMW fob",
    locationFound: "Food Court West",
    status: "stored",
    foundDate: "Apr 5, 11:00 AM",
    foundBy: "Officer Chen",
  },
  {
    id: "4",
    itemNumber: "FND-004",
    description: "Blue North Face backpack",
    locationFound: "South Lawn",
    status: "returned",
    foundDate: "Apr 4, 6:45 PM",
    foundBy: "Staff Garcia",
  },
  {
    id: "5",
    itemNumber: "FND-005",
    description: "Ray-Ban Wayfarer sunglasses",
    locationFound: "VIP Tent A",
    status: "stored",
    foundDate: "Apr 4, 3:20 PM",
    foundBy: "Officer Martinez",
  },
  {
    id: "6",
    itemNumber: "FND-006",
    description: "Denim jacket, men's large",
    locationFound: "Campground Lot C",
    status: "disposed",
    foundDate: "Mar 28, 9:00 AM",
    foundBy: "Staff Thompson",
  },
];

const LOST_REPORTS: LostReportRow[] = [
  {
    id: "1",
    reportNumber: "LST-001",
    description: "iPhone 15 Pro, space black",
    lastSeenLocation: "Near Gate B",
    reportedBy: "Michael Torres",
    date: "Apr 5, 2:00 PM",
  },
  {
    id: "2",
    reportNumber: "LST-002",
    description: "Brown leather messenger bag",
    lastSeenLocation: "Food Court West",
    reportedBy: "Amanda Liu",
    date: "Apr 5, 12:30 PM",
  },
  {
    id: "3",
    reportNumber: "LST-003",
    description: "Silver charm bracelet",
    lastSeenLocation: "Main Stage Area",
    reportedBy: "Jessica Kim",
    date: "Apr 4, 8:15 PM",
  },
  {
    id: "4",
    reportNumber: "LST-004",
    description: "Car keys with Toyota fob",
    lastSeenLocation: "Parking Lot D",
    reportedBy: "Robert Singh",
    date: "Apr 4, 5:00 PM",
  },
];

const MATCHES: MatchRow[] = [
  {
    id: "m1",
    lostDesc: "iPhone 15 Pro, space black (LST-001)",
    foundDesc: "iPhone 15 Pro, space black, cracked screen (FND-002)",
    foundLocation: "Gate B Entrance",
    confidence: "High",
  },
  {
    id: "m2",
    lostDesc: "Car keys with Toyota fob (LST-004)",
    foundDesc: "Set of car keys with BMW fob (FND-003)",
    foundLocation: "Food Court West",
    confidence: "Low",
  },
];

/* ── Tab definitions ── */
const TAB_LIST = [
  { id: "found", label: "Found Items", count: FOUND_ITEMS.length },
  { id: "lost", label: "Lost Reports", count: LOST_REPORTS.length },
  { id: "matches", label: "Matches", count: MATCHES.length },
];

export default function LostFoundPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("found");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* ── Found Items columns ── */
  const foundColumns = [
    {
      key: "itemNumber",
      label: "Item #",
      sortable: true,
      render: (row: FoundItemRow) => (
        <Link
          href={`/lost-found/${row.id}`}
          className="text-[var(--action-primary)] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {row.itemNumber}
        </Link>
      ),
    },
    { key: "description", label: "Description" },
    { key: "locationFound", label: "Location Found" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: FoundItemRow) => <StatusBadge status={row.status} dot />,
    },
    { key: "foundDate", label: "Found Date" },
    { key: "foundBy", label: "Found By" },
  ];

  /* ── Lost Reports columns ── */
  const lostColumns = [
    {
      key: "reportNumber",
      label: "Report #",
      sortable: true,
      render: (row: LostReportRow) => (
        <span className="font-medium text-[var(--text-primary)]">
          {row.reportNumber}
        </span>
      ),
    },
    { key: "description", label: "Description" },
    { key: "lastSeenLocation", label: "Last Seen Location" },
    { key: "reportedBy", label: "Reported By" },
    { key: "date", label: "Date" },
  ];

  /* ── Filter ── */
  const filteredFound = useMemo(() => {
    if (!search) return FOUND_ITEMS;
    const q = search.toLowerCase();
    return FOUND_ITEMS.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        i.itemNumber.toLowerCase().includes(q) ||
        i.locationFound.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredLost = useMemo(() => {
    if (!search) return LOST_REPORTS;
    const q = search.toLowerCase();
    return LOST_REPORTS.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        i.reportNumber.toLowerCase().includes(q) ||
        i.lastSeenLocation.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Lost &amp; Found
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Auto-matching algorithm, return verification, and item tracking
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-3.5 w-3.5" />
          Log Found Item
        </Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs tabs={TAB_LIST} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Search ── */}
      {activeTab !== "matches" && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder={
                  activeTab === "found"
                    ? "Search found items..."
                    : "Search lost reports..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Found Items Tab ── */}
      {activeTab === "found" && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
          <DataGrid
            columns={foundColumns}
            data={filteredFound}
            onRowClick={(row) => router.push(`/lost-found/${row.id}`)}
            emptyMessage="No found items match your search"
            totalCount={filteredFound.length}
            pageSize={20}
          />
        </div>
      )}

      {/* ── Lost Reports Tab ── */}
      {activeTab === "lost" && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
          <DataGrid
            columns={lostColumns}
            data={filteredLost}
            emptyMessage="No lost reports match your search"
            totalCount={filteredLost.length}
            pageSize={20}
          />
        </div>
      )}

      {/* ── Matches Tab ── */}
      {activeTab === "matches" && (
        <div className="flex flex-col gap-3">
          {MATCHES.map((match) => (
            <Card key={match.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] mb-1">
                      Possible match ({match.confidence} confidence)
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)] mb-0.5">
                      <span className="text-[var(--text-tertiary)]">Lost:</span>{" "}
                      {match.lostDesc}
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)] mb-0.5">
                      <span className="text-[var(--text-tertiary)]">
                        Found:
                      </span>{" "}
                      {match.foundDesc}
                    </p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      Found at {match.foundLocation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="default">
                      <Check className="h-3 w-3" />
                      Match
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-3 w-3" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {MATCHES.length === 0 && (
            <div className="py-12 text-center text-[13px] text-[var(--text-tertiary)]">
              No potential matches found
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <CreateFoundItemModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => {
          console.log("Create found item:", data);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
