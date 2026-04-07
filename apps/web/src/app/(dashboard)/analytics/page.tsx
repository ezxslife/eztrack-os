"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Radio,
  Users,
  Flag,
  ClipboardList,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchIncidentsByStatus,
  fetchIncidentsByType,
  fetchIncidentsOverTime,
  fetchDispatchResponseTimes,
  fetchPatronFlagDistribution,
  fetchModuleActivityCounts,
} from "@/lib/queries/analytics";

/* ── Color palettes for chart slices ── */
const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];
const STATUS_COLORS: Record<string, string> = {
  Open: "#d97706",
  "In Progress": "#6366f1",
  Resolved: "#059669",
  Closed: "#94a3b8",
  Active: "#d97706",
  Pending: "#6366f1",
};
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  critical: "#dc2626",
  High: "#d97706",
  high: "#d97706",
  Medium: "#6366f1",
  medium: "#6366f1",
  Low: "#059669",
  low: "#059669",
};

/* ── Reusable: Horizontal Bar Chart ── */
function HorizontalBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-tertiary)] w-20 shrink-0 truncate">{item.label}</span>
          <div className="flex-1 h-5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: item.color }}
            />
          </div>
          <span className="text-[12px] font-medium text-[var(--text-primary)] w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Reusable: SVG Donut Chart ── */
function DonutChart({ segments }: { segments: { label: string; percent: number; color: string }[] }) {
  let offset = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
      <svg viewBox="0 0 36 36" className="h-28 w-28 shrink-0">
        {segments.map((seg, i) => {
          const currentOffset = offset;
          offset += seg.percent;
          return (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              strokeWidth="3"
              stroke={seg.color}
              strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
              strokeDashoffset={-currentOffset}
              className="transition-all duration-500"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-[var(--text-tertiary)]">{seg.label}</span>
            <span className="text-[11px] font-medium text-[var(--text-primary)]">{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reusable: SVG Trend Line ── */
function TrendLine({ data, labels, color = "var(--eztrack-primary-500, #6366f1)" }: { data: number[]; labels?: string[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 280 + 10},${90 - ((v - min) / range) * 70}`)
    .join(" ");
  return (
    <div>
      <svg viewBox="0 0 300 100" className="w-full h-24" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <circle
            key={i}
            cx={(i / (data.length - 1)) * 280 + 10}
            cy={90 - ((v - min) / range) * 70}
            r="3"
            fill={color}
          />
        ))}
      </svg>
      {labels && (
        <div className="flex justify-between mt-1 px-2">
          {labels.map((l) => (
            <span key={l} className="text-[10px] text-[var(--text-tertiary)]">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Loading placeholder ── */
function ChartSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Data state
  const [incidentsByType, setIncidentsByType] = useState<{ label: string; value: number; color: string }[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<{ label: string; percent: number; color: string }[]>([]);
  const [incidentsOverTime, setIncidentsOverTime] = useState<number[]>([]);
  const [incidentsOverTimeLabels, setIncidentsOverTimeLabels] = useState<string[]>([]);
  const [responseTime, setResponseTime] = useState({ avg_minutes: 0, median_minutes: 0 });
  const [patronFlags, setPatronFlags] = useState<{ label: string; value: number; color: string }[]>([]);
  const [moduleActivity, setModuleActivity] = useState<{ label: string; value: number; color: string }[]>([]);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);

  // Fetch orgId from profile
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

  // Fetch analytics data once orgId is available
  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [byType, byStatus, overTime, respTimes, flags, modules] = await Promise.all([
        fetchIncidentsByType(orgId),
        fetchIncidentsByStatus(orgId),
        fetchIncidentsOverTime(orgId, 7),
        fetchDispatchResponseTimes(orgId),
        fetchPatronFlagDistribution(orgId),
        fetchModuleActivityCounts(orgId),
      ]);

      // Incidents by type → bar chart data
      setIncidentsByType(byType.slice(0, 6).map((d, i) => ({ label: d.label, value: d.count, color: BAR_COLORS[i % BAR_COLORS.length] })));

      // Status distribution → donut chart
      const total = byStatus.reduce((s, d) => s + d.count, 0) || 1;
      setTotalIncidents(total);
      setStatusDistribution(
        byStatus.map((d) => ({
          label: d.label,
          percent: Math.round((d.count / total) * 100),
          color: STATUS_COLORS[d.label] || "#94a3b8",
        }))
      );

      // Open vs closed counts
      const openStatuses = ["Open", "open", "Active", "active", "In Progress", "in_progress"];
      const closedStatuses = ["Closed", "closed", "Resolved", "resolved"];
      setOpenCount(byStatus.filter((d) => openStatuses.includes(d.label)).reduce((s, d) => s + d.count, 0));
      setClosedCount(byStatus.filter((d) => closedStatuses.includes(d.label)).reduce((s, d) => s + d.count, 0));

      // Incidents over time → trend line
      const dayLabels = overTime.map((d) => {
        const dt = new Date(d.date);
        return dt.toLocaleDateString(undefined, { weekday: "short" });
      });
      setIncidentsOverTime(overTime.map((d) => d.count));
      setIncidentsOverTimeLabels(dayLabels);

      // Response time
      setResponseTime(respTimes);

      // Patron flags → bar chart
      setPatronFlags(flags.slice(0, 6).map((d, i) => ({ label: d.label, value: d.count, color: BAR_COLORS[i % BAR_COLORS.length] })));

      // Module activity → bar chart
      setModuleActivity(modules.slice(0, 6).map((d, i) => ({ label: d.module, value: d.count, color: BAR_COLORS[i % BAR_COLORS.length] })));
    } catch {
      // Silently handle errors — charts will show empty
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalBar = openCount + closedCount || 1;

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Analytics
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
            Operational intelligence and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] text-[13px] text-[var(--text-secondary)]">
          <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          Last 7 days
        </div>
      </div>

      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: loading ? "--" : String(totalIncidents), icon: <BarChart3 className="h-4 w-4" /> },
          { label: "Avg Response", value: loading ? "--" : `${responseTime.avg_minutes} min`, icon: <TrendingDown className="h-4 w-4" /> },
          { label: "Median Response", value: loading ? "--" : `${responseTime.median_minutes} min`, icon: <Clock className="h-4 w-4" /> },
          { label: "Open / Closed", value: loading ? "--" : `${openCount} / ${closedCount}`, icon: <CheckCircle2 className="h-4 w-4" /> },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{kpi.label}</span>
                <span className="text-[var(--text-tertiary)]">{kpi.icon}</span>
              </div>
              <span className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">{kpi.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Incidents by Type */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Incidents by Type</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{totalIncidents} total</p>
              </div>
              <BarChart3 className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            {loading ? <ChartSkeleton /> : <HorizontalBarChart data={incidentsByType} />}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Status Distribution</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Current incidents</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            {loading ? <ChartSkeleton /> : <DonutChart segments={statusDistribution} />}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Incidents Over Time */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Incidents Over Time</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Last 7 days</p>
              </div>
              <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            {loading ? (
              <ChartSkeleton />
            ) : incidentsOverTime.length > 1 ? (
              <TrendLine data={incidentsOverTime} labels={incidentsOverTimeLabels} />
            ) : (
              <p className="text-[12px] text-[var(--text-tertiary)] text-center py-6">Not enough data</p>
            )}
          </CardContent>
        </Card>

        {/* Patron Flag Distribution */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Patron Flags</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Flag distribution</p>
              </div>
              <Flag className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            {loading ? <ChartSkeleton /> : <HorizontalBarChart data={patronFlags} />}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 3 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Module Activity */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Module Activity</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Last 30 days</p>
              </div>
              <ClipboardList className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            {loading ? <ChartSkeleton /> : <HorizontalBarChart data={moduleActivity} />}
          </CardContent>
        </Card>

        {/* Open vs Closed */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Open vs Closed</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Current ratio — {openCount} : {closedCount}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <div>
                <div className="flex rounded-full overflow-hidden h-3 bg-[var(--surface-secondary)]">
                  <div className="h-full rounded-l-full" style={{ width: `${(openCount / totalBar) * 100}%`, backgroundColor: "var(--status-warning,#d97706)" }} />
                  <div className="h-full rounded-r-full" style={{ width: `${(closedCount / totalBar) * 100}%`, backgroundColor: "var(--status-success,#059669)" }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[11px] text-[var(--status-warning,#d97706)]">{openCount} Open</span>
                  <span className="text-[11px] text-[var(--status-success,#059669)]">{closedCount} Closed</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
