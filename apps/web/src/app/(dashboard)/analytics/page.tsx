"use client";

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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

/* ── Mock Chart Data ── */
const INCIDENTS_BY_TYPE = [
  { label: "Medical", value: 45, color: "#6366f1" },
  { label: "Theft", value: 32, color: "#8b5cf6" },
  { label: "Assault", value: 18, color: "#a78bfa" },
  { label: "Trespass", value: 15, color: "#c4b5fd" },
  { label: "Drug", value: 12, color: "#ddd6fe" },
  { label: "Other", value: 8, color: "#ede9fe" },
];

const DISPATCH_BY_PRIORITY = [
  { label: "Critical", value: 8, color: "#dc2626" },
  { label: "High", value: 23, color: "#d97706" },
  { label: "Medium", value: 45, color: "#6366f1" },
  { label: "Low", value: 15, color: "#059669" },
];

const STATUS_DISTRIBUTION = [
  { label: "Open", percent: 35, color: "#d97706" },
  { label: "In Progress", percent: 25, color: "#6366f1" },
  { label: "Resolved", percent: 30, color: "#059669" },
  { label: "Closed", percent: 10, color: "#94a3b8" },
];

const RESPONSE_TIME_TREND = [5.1, 4.8, 6.2, 4.0, 3.8, 4.5, 4.2];
const RESPONSE_TIME_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAILY_ACTIVITY_SPARKLINE = [38, 52, 41, 60, 45, 48, 28];

const TOP_LOCATIONS = [
  { label: "Main Gate", value: 34, color: "#6366f1" },
  { label: "Parking A", value: 28, color: "#8b5cf6" },
  { label: "Food Court", value: 21, color: "#a78bfa" },
  { label: "Stage North", value: 16, color: "#c4b5fd" },
  { label: "VIP Area", value: 11, color: "#ddd6fe" },
];

const OFFICER_WORKLOAD = [
  { label: "Patel", value: 24, color: "#6366f1" },
  { label: "Chen", value: 21, color: "#8b5cf6" },
  { label: "Okafor", value: 19, color: "#a78bfa" },
  { label: "Rivera", value: 17, color: "#c4b5fd" },
  { label: "Kim", value: 14, color: "#ddd6fe" },
  { label: "Jones", value: 10, color: "#ede9fe" },
];

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
    <div className="flex items-center gap-6">
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

export default function AnalyticsPage() {
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
          Apr 1 - Apr 5, 2026
        </div>
      </div>

      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: "130", trend: { value: "8%", up: true }, icon: <BarChart3 className="h-4 w-4" /> },
          { label: "Avg Response", value: "4.2 min", trend: { value: "12%", up: false }, icon: <TrendingDown className="h-4 w-4" /> },
          { label: "Dispatches Today", value: "128", trend: { value: "8%", up: true }, icon: <Radio className="h-4 w-4" /> },
          { label: "Officer Utilization", value: "78%", icon: <Users className="h-4 w-4" /> },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{kpi.label}</span>
                <span className="text-[var(--text-tertiary)]">{kpi.icon}</span>
              </div>
              <span className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">{kpi.value}</span>
              {kpi.trend && (
                <div className="flex items-center gap-1 mt-1">
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${kpi.trend.up ? "text-[var(--status-success,#059669)]" : "text-[var(--status-critical,#dc2626)]"}`}>
                    {kpi.trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.trend.value}
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">vs last week</span>
                </div>
              )}
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
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">This week — 130 total</p>
              </div>
              <BarChart3 className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <HorizontalBarChart data={INCIDENTS_BY_TYPE} />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Status Distribution</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Current open incidents</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <DonutChart segments={STATUS_DISTRIBUTION} />
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response Time Trend */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Response Time Trend</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Avg minutes — 7-day window</p>
              </div>
              <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <TrendLine data={RESPONSE_TIME_TREND} labels={RESPONSE_TIME_LABELS} />
          </CardContent>
        </Card>

        {/* Dispatch by Priority */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Dispatch by Priority</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">91 dispatches this week</p>
              </div>
              <Flag className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <HorizontalBarChart data={DISPATCH_BY_PRIORITY} />
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 3 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Locations */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Top Locations</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">By incident count</p>
              </div>
              <MapPin className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <HorizontalBarChart data={TOP_LOCATIONS} />
          </CardContent>
        </Card>

        {/* Officer Workload */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Officer Workload</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Dispatch count this week</p>
              </div>
              <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <HorizontalBarChart data={OFFICER_WORKLOAD} />
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row: Activity Sparkline + Open vs Closed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Daily Log Activity</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">312 entries this week</p>
              </div>
              <ClipboardList className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <TrendLine data={DAILY_ACTIVITY_SPARKLINE} labels={RESPONSE_TIME_LABELS} color="#8b5cf6" />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Open vs Closed</h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Current ratio — 12 : 35</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <div className="flex rounded-full overflow-hidden h-3 bg-[var(--surface-secondary)]">
                <div className="h-full rounded-l-full" style={{ width: `${(12 / 47) * 100}%`, backgroundColor: "var(--status-warning,#d97706)" }} />
                <div className="h-full rounded-r-full" style={{ width: `${(35 / 47) * 100}%`, backgroundColor: "var(--status-success,#059669)" }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-[var(--status-warning,#d97706)]">12 Open</span>
                <span className="text-[11px] text-[var(--status-success,#059669)]">35 Closed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
