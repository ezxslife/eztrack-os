"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Check, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { CreateFoundItemModal } from "@/components/modals/lost-found";
import {
  fetchFoundItems,
  fetchLostReports,
  createFoundItem,
  type FoundItemRow,
  type LostReportRow,
} from "@/lib/queries/lost-found";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { formatRelativeTime } from "@/lib/utils/time";
import { useToast } from "@/components/ui/Toast";

export default function LostFoundPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [foundItems, setFoundItems] = useState<FoundItemRow[]>([]);
  const [lostReports, setLostReports] = useState<LostReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("found");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ orgId: string; propertyId: string | null } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [found, lost] = await Promise.all([
        fetchFoundItems(),
        fetchLostReports(),
      ]);
      setFoundItems(found);
      setLostReports(lost);

      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id, property_id")
          .eq("id", user.id)
          .single();
        if (profile) setUserProfile({ orgId: profile.org_id, propertyId: profile.property_id });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load lost & found data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const TAB_LIST = [
    { id: "found", label: "Found Items", count: foundItems.length },
    { id: "lost", label: "Lost Reports", count: lostReports.length },
    { id: "matches", label: "Matches", count: 0 },
  ];

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
    if (!search) return foundItems;
    const q = search.toLowerCase();
    return foundItems.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        i.itemNumber.toLowerCase().includes(q) ||
        i.locationFound.toLowerCase().includes(q)
    );
  }, [search, foundItems]);

  const filteredLost = useMemo(() => {
    if (!search) return lostReports;
    const q = search.toLowerCase();
    return lostReports.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        i.reportNumber.toLowerCase().includes(q) ||
        (i.lastSeenLocation || "").toLowerCase().includes(q)
    );
  }, [search, lostReports]);

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
        <Button variant="outline" size="sm" onClick={loadData}>Retry</Button>
      </div>
    );
  }

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
        <div className="py-12 text-center text-[13px] text-[var(--text-tertiary)]">
          Auto-matching engine coming soon. Manual matching available from item detail pages.
        </div>
      )}

      {/* ── Modals ── */}
      <CreateFoundItemModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => {
          try {
            if (!userProfile) throw new Error("User profile not loaded");
            await createFoundItem({
              orgId: userProfile.orgId,
              propertyId: userProfile.propertyId,
              description: data.description,
              category: data.category,
              foundLocationId: data.foundLocation || null,
              foundBy: data.foundBy || undefined,
              storageLocation: data.storageLocation || undefined,
              notes: data.notes || undefined,
            });
            toast("Found item logged", { variant: "success" });
            setShowCreateModal(false);
            loadData();
          } catch (err: any) {
            toast(err.message || "Failed to log found item", { variant: "error" });
          }
        }}
      />
    </div>
  );
}
