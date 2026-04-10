"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  Radio,
  Briefcase,
  DollarSign,
  UserCheck,
  Shield,
  Download,
  Zap,
  Package,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  buildReportRoute,
  fetchReportCatalog,
  type ReportCatalogItem,
} from "@/lib/queries/reports";

/* ── Report Definition ── */
interface ReportDef {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  formats: readonly string[];
  recordCount: number;
  latestActivity: string | null;
  category: string;
  quick?: boolean;
}

interface ReportCategory {
  title: string;
  reports: ReportDef[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  "daily-activity": FileText,
  "incident-summary": AlertTriangle,
  "dispatch-performance": Radio,
  "case-status": Briefcase,
  "savings-losses": DollarSign,
  "visitor-log": UserCheck,
  "patron-flags": Shield,
  "lost-found-inventory": Package,
};

function formatActivityDate(value: string | null) {
  if (!value) return "No records available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [quickLoading, setQuickLoading] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = getSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;
        if (!profile?.org_id) throw new Error("Organization not found");
        const catalog = await fetchReportCatalog(profile.org_id);
        if (cancelled) return;
        setReports(
          catalog.map((item: ReportCatalogItem) => ({
            ...item,
            icon: ICON_MAP[item.slug] ?? FileText,
          })),
        );
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  const reportCategories = useMemo<ReportCategory[]>(() => {
    const grouped = new Map<string, ReportDef[]>();
    for (const report of reports) {
      const current = grouped.get(report.category) ?? [];
      current.push(report);
      grouped.set(report.category, current);
    }
    return Array.from(grouped.entries()).map(([title, groupedReports]) => ({
      title,
      reports: groupedReports,
    }));
  }, [reports]);

  const quickReports = useMemo(
    () => reports.filter((report) => report.quick).slice(0, 4),
    [reports],
  );

  const handleQuickGenerate = (slug: string, name: string) => {
    setQuickLoading(slug);
    router.push(buildReportRoute(slug));
    toast(`Opening ${name}`, { variant: "info" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Reports</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
          Generate and export operational reports
        </p>
      </div>

      {/* ── Quick Generate ── */}
      <Card>
        <CardContent className="py-3.5">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              Quick Generate
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReports.map((r) => (
              <Button
                key={r.slug}
                variant="secondary"
                size="sm"
                isLoading={quickLoading === r.slug}
                onClick={() => handleQuickGenerate(r.slug, r.name)}
              >
                <r.icon className="h-3 w-3" />
                {r.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Report Categories ── */}
      {reportCategories.map((category) => (
        <div key={category.title} className="space-y-3">
          <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {category.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {category.reports.map((report) => (
              <Card key={report.slug} hover>
                <CardContent className="py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                      <report.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                        {report.name}
                      </h3>
                      <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 leading-snug">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {report.formats.map((fmt) => (
                          <Badge key={fmt} tone="default">
                            {fmt}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 space-y-0.5 text-[11px] text-[var(--text-tertiary)]">
                        <p>{report.recordCount.toLocaleString()} records available</p>
                        <p>Latest activity: {formatActivityDate(report.latestActivity)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link href={`/reports/${report.slug}`}>
                      <Button variant="secondary" size="sm">
                        <Download className="h-3 w-3" />
                        Generate
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
