"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Radio,
  ClipboardList,
  Users,
  Plus,
  ArrowRight,
  AlertTriangle,
  FileText,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AppPage, PageHeader, PageSection } from "@/components/layout/AppPage";
import { Button } from "@/components/ui/Button";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  type DashboardStats,
  type RecentActivityItem,
} from "@/lib/queries/dashboard";
import { formatRelativeTime } from "@/lib/utils/time";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const STAT_CONFIG = [
  {
    key: "totalIncidents" as const,
    label: "Total Incidents",
    icon: ShieldAlert,
    iconBg: "var(--red-500, #ef4444)",
  },
  {
    key: "activeDispatches" as const,
    label: "Active Dispatches",
    icon: Radio,
    iconBg: "var(--eztrack-accent-500)",
  },
  {
    key: "dailyLogsToday" as const,
    label: "Daily Logs Today",
    icon: ClipboardList,
    iconBg: "var(--eztrack-primary-500)",
  },
  {
    key: "officersOnDuty" as const,
    label: "Officers on Duty",
    icon: Users,
    iconBg: "var(--purple-500, #a855f7)",
  },
];

const QUICK_ACTIONS = [
  { label: "New Daily Log", href: "/daily-log/new", icon: ClipboardList },
  { label: "Create Incident", href: "/incidents/new", icon: ShieldAlert },
  { label: "Dispatch Officer", href: "/dispatch", icon: Radio },
];

/** Map entity_type → display label and color */
const MODULE_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  incident: { label: "Incident", color: "var(--red-500, #ef4444)", icon: AlertTriangle },
  daily_log: { label: "Daily Log", color: "var(--eztrack-primary-500)", icon: FileText },
  dispatch: { label: "Dispatch", color: "var(--eztrack-accent-500)", icon: MapPin },
  patron: { label: "Patrons", color: "var(--purple-500, #a855f7)", icon: Users },
  briefing: { label: "Briefings", color: "var(--blue-500, #3b82f6)", icon: Clock },
};

function getModuleMeta(entityType: string) {
  return MODULE_META[entityType] ?? { label: entityType, color: "var(--text-tertiary)", icon: Clock };
}

function formatActivityDescription(item: RecentActivityItem): string {
  const actor = item.actorName ? ` by ${item.actorName}` : "";
  return `${item.action} ${item.entityType.replace(/_/g, " ")}${actor}`;
}

export default function DashboardPage() {
  const greeting = useMemo(() => getGreeting(), []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, a] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentActivity(8),
      ]);
      setStats(s);
      setActivity(a);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <AppPage width="wide">
        <PageSection className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
        </PageSection>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage width="wide">
        <PageSection className="flex flex-col items-center justify-center gap-3 py-20">
          <AlertCircle size={24} className="text-[var(--status-critical)]" />
          <p className="text-[13px] text-[var(--text-tertiary)]">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry
          </Button>
        </PageSection>
      </AppPage>
    );
  }

  return (
    <AppPage width="wide" className="animate-fade-in">
      <PageHeader
        title={greeting}
        subtitle="Here’s your operations overview."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIG.map((cfg) => {
          const Icon = cfg.icon;
          const value = stats?.[cfg.key] ?? 0;
          return (
            <div key={cfg.key} className="surface-card p-4">
              <div className="flex items-start justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${cfg.iconBg} 12%, transparent)`,
                    color: cfg.iconBg,
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">
                  {value}
                </p>
                <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
                  {cfg.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <PageSection>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button variant="secondary" size="md">
                  <Plus size={14} />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </PageSection>

      <PageSection padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
            Recent Activity
          </h2>
          <Link
            href="/daily-log"
            className="inline-flex items-center gap-1 text-[12px] text-[var(--interactive)] hover:underline font-medium"
          >
            View all activity
            <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-[var(--border-subdued)]">
          {activity.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-[var(--text-tertiary)]">No recent activity</p>
            </div>
          )}
          {activity.map((item) => {
            const meta = getModuleMeta(item.entityType);
            const Icon = meta.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors duration-[var(--duration-fast)]"
              >
                <div
                  className="flex items-center justify-center h-7 w-7 rounded-full shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                    color: meta.color,
                  }}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-primary)] truncate">
                    {formatActivityDescription(item)}
                  </p>
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
                  {formatRelativeTime(item.createdAt)}
                </span>
                <span
                  className="text-[11px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
                    color: meta.color,
                  }}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </PageSection>
    </AppPage>
  );
}
