"use client";

import { use, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  AlertTriangle,
  Radio,
  Briefcase,
  Link as LinkIcon,
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  Shield,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { DataGrid } from "@/components/ui/DataGrid";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { fetchReportData, exportCSV, type ReportResult } from "@/lib/queries/reports";
import { exportReportPDF } from "@/lib/export-pdf";

/* ── Report Metadata ── */
interface ReportMeta {
  name: string;
  description: string;
  icon: LucideIcon;
}

const REPORT_META: Record<string, ReportMeta> = {
  "daily-activity": { name: "Daily Activity Summary", description: "All daily log entries for a selected date range", icon: FileText },
  "incident-summary": { name: "Incident Summary Report", description: "All incidents with classification, status, and response times", icon: AlertTriangle },
  "dispatch-performance": { name: "Dispatch Performance", description: "Response times, resolution rates, officer workload", icon: Radio },
  "case-status": { name: "Case Status Report", description: "Active investigations, stage breakdown, aging", icon: Briefcase },
  "evidence-custody": { name: "Evidence Chain of Custody", description: "Full chain of custody audit trail", icon: LinkIcon },
  "shift-coverage": { name: "Shift Coverage Report", description: "Staff coverage by zone, shift gaps", icon: Users },
  "training-compliance": { name: "Training Compliance", description: "Certification status, expiring qualifications", icon: GraduationCap },
  "savings-losses": { name: "Savings & Losses Summary", description: "Financial impact across all incidents", icon: DollarSign },
  "visitor-log": { name: "Visitor Log", description: "All visits with sign-in/out times", icon: UserCheck },
  "patron-flags": { name: "Patron Flags & Bans", description: "Active flags, ban history, watch list", icon: Shield },
};

/* ── Property Options ── */
const PROPERTY_OPTIONS = [
  { value: "", label: "All Properties" },
  { value: "main-venue", label: "Main Venue" },
  { value: "north-campus", label: "North Campus" },
  { value: "south-campus", label: "South Campus" },
  { value: "parking-complex", label: "Parking Complex" },
];

/* ── Stat Card ── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-[var(--text-primary)] mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Mock data generators removed — real data fetched from Supabase ── */

/* ── All mock data generators removed — fetched from Supabase via reports.ts ── */

/* ── Extra Filters by Type ── */
const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const ZONE_OPTIONS = [
  { value: "", label: "All Zones" },
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "perimeter", label: "Perimeter" },
];

const SHIFT_OPTIONS = [
  { value: "", label: "All Shifts" },
  { value: "day", label: "Day" },
  { value: "swing", label: "Swing" },
  { value: "night", label: "Night" },
];

const FLAG_TYPE_OPTIONS = [
  { value: "", label: "All Flag Types" },
  { value: "ban", label: "Ban" },
  { value: "watch", label: "Watch" },
  { value: "alert", label: "Alert" },
];

/* ── Main Component ── */
export default function ReportViewerPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const meta = REPORT_META[type] || { name: type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), description: "Report details", icon: FileText };
  const IconComponent = meta.icon;

  const { toast } = useToast();

  const [dateFrom, setDateFrom] = useState("2026-03-29");
  const [dateTo, setDateTo] = useState("2026-04-05");
  const [property, setProperty] = useState("");
  const [extraFilter, setExtraFilter] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResult | null>(null);

  // Fetch orgId on mount
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!orgId) {
      toast("Unable to load user profile", { variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const data = await fetchReportData(orgId, type, { dateFrom, dateTo });
      setReportData(data);
      setGenerated(true);
      toast("Report generated successfully", { variant: "success" });
    } catch (err: any) {
      toast(err.message || "Failed to generate report", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [orgId, type, dateFrom, dateTo, toast]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.rows.length) {
      toast("No data to export", { variant: "error" });
      return;
    }
    const filename = `${type}-${dateFrom}-to-${dateTo}.csv`;
    exportCSV(reportData.rows, filename);
    toast("Report exported as CSV", { variant: "success" });
  };

  const handleExportPDF = () => {
    if (!reportData) {
      toast("Generate the report first", { variant: "warning" });
      return;
    }
    try {
      exportReportPDF(reportData, {
        title: meta.name,
        dateRange: `${dateFrom} to ${dateTo}`,
        orgName: "EZTrack",
      });
      toast("PDF ready — use your browser's Save as PDF option", { variant: "success" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "PDF export failed", { variant: "error" });
    }
  };

  const handlePrint = () => {
    if (!reportData) {
      toast("Generate the report first", { variant: "warning" });
      return;
    }
    // Reuse the PDF export — browser print dialog lets user print or save as PDF
    try {
      exportReportPDF(reportData, {
        title: meta.name,
        dateRange: `${dateFrom} to ${dateTo}`,
        orgName: "EZTrack",
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Print failed", { variant: "error" });
    }
  };

  /* ── Extra filter selector based on report type ── */
  const extraFilterConfig = useMemo(() => {
    switch (type) {
      case "incident-summary":
        return { options: PRIORITY_OPTIONS, label: "Priority" };
      case "dispatch-performance":
      case "shift-coverage":
        return { options: ZONE_OPTIONS, label: "Zone" };
      case "training-compliance":
        return { options: SHIFT_OPTIONS, label: "Shift" };
      case "patron-flags":
        return { options: FLAG_TYPE_OPTIONS, label: "Flag Type" };
      default:
        return null;
    }
  }, [type]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-[var(--text-tertiary)]" />
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{meta.name}</h1>
            </div>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{meta.description}</p>
          </div>
        </div>
        {generated && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPDF}>
              <Download className="h-3 w-3" />
              PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="h-3 w-3" />
              CSV
            </Button>
          </div>
        )}
      </div>

      {/* ── Configuration Panel ── */}
      <Card>
        <CardContent className="py-3.5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
              />
            </div>
            <div className="w-full sm:w-[180px]">
              <Select
                label="Property"
                options={PROPERTY_OPTIONS}
                value={property}
                onChange={(e) => setProperty(e.target.value)}
              />
            </div>
            {extraFilterConfig && (
              <div className="w-full sm:w-[160px]">
                <Select
                  label={extraFilterConfig.label}
                  options={extraFilterConfig.options}
                  value={extraFilter}
                  onChange={(e) => setExtraFilter(e.target.value)}
                />
              </div>
            )}
            <Button variant="default" size="md" onClick={handleGenerate} isLoading={loading}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Report Content (shown after generate) ── */}
      {generated && reportData && (
        <>
          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {reportData.stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} sub={stat.sub} />
            ))}
          </div>

          {/* ── Data Table ── */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] overflow-hidden">
            <DataGrid
              columns={reportData.columns}
              data={reportData.rows}
              sortKey={sortKey}
              sortDirection={sortDir}
              onSort={(key, dir) => {
                setSortKey(key);
                setSortDir(dir);
              }}
              emptyMessage="No data available for the selected filters"
              totalCount={reportData.rows.length}
              pageSize={20}
            />
          </div>
        </>
      )}

      {/* ── Empty state before generation ── */}
      {!generated && !loading && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] py-16 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Configure and generate
          </h3>
          <p className="text-[13px] text-[var(--text-tertiary)] max-w-sm mx-auto">
            Set your date range and filters above, then click &ldquo;Generate Report&rdquo; to view the data.
          </p>
        </div>
      )}
    </div>
  );
}
