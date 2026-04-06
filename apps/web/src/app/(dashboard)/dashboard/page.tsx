"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Radio,
  ClipboardList,
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  FileText,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const STATS = [
  {
    label: "Total Incidents",
    value: 24,
    trend: "+12%",
    trendUp: true,
    icon: ShieldAlert,
    iconBg: "var(--red-500, #ef4444)",
  },
  {
    label: "Active Dispatches",
    value: 7,
    trend: "+3",
    trendUp: true,
    icon: Radio,
    iconBg: "var(--eztrack-accent-500)",
  },
  {
    label: "Daily Logs Today",
    value: 18,
    trend: "-3%",
    trendUp: false,
    icon: ClipboardList,
    iconBg: "var(--eztrack-primary-500)",
  },
  {
    label: "Officers on Duty",
    value: 12,
    trend: "+2",
    trendUp: true,
    icon: Users,
    iconBg: "var(--purple-500, #a855f7)",
  },
];

const QUICK_ACTIONS = [
  { label: "New Daily Log", href: "/daily-log/new", icon: ClipboardList },
  { label: "Create Incident", href: "/incidents/new", icon: ShieldAlert },
  { label: "Dispatch Officer", href: "/dispatch", icon: Radio },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    description: "Medical incident reported at Main Stage",
    timeAgo: "4 min ago",
    module: "Incident",
    color: "var(--red-500, #ef4444)",
    icon: AlertTriangle,
  },
  {
    id: 2,
    description: "Daily log entry DL-0024 created by Officer Rivera",
    timeAgo: "12 min ago",
    module: "Daily Log",
    color: "var(--eztrack-primary-500)",
    icon: FileText,
  },
  {
    id: 3,
    description: "Officer Martinez dispatched to VIP Parking Lot B",
    timeAgo: "23 min ago",
    module: "Dispatch",
    color: "var(--eztrack-accent-500)",
    icon: MapPin,
  },
  {
    id: 4,
    description: "Patron flagged for watch list at North Gate",
    timeAgo: "38 min ago",
    module: "Patrons",
    color: "var(--purple-500, #a855f7)",
    icon: Users,
  },
  {
    id: 5,
    description: "Shift briefing posted for evening rotation",
    timeAgo: "1 hr ago",
    module: "Briefings",
    color: "var(--blue-500, #3b82f6)",
    icon: Clock,
  },
];

export default function DashboardPage() {
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {greeting}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
          Here&apos;s your operations overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="surface-card p-4">
              <div className="flex items-start justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${stat.iconBg} 12%, transparent)`,
                    color: stat.iconBg,
                  }}
                >
                  <Icon size={18} />
                </div>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium rounded-full px-1.5 py-0.5"
                  style={{
                    color: stat.trendUp
                      ? "var(--green-600, #059669)"
                      : "var(--red-600, #dc2626)",
                    backgroundColor: stat.trendUp
                      ? "var(--green-50, #ecfdf5)"
                      : "var(--red-50, #fef2f2)",
                  }}
                >
                  {stat.trendUp ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {stat.trend}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">
                  {stat.value}
                </p>
                <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
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
      </div>

      {/* Recent Activity */}
      <div className="surface-card overflow-hidden">
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
          {RECENT_ACTIVITY.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors duration-[var(--duration-fast)]"
              >
                <div
                  className="flex items-center justify-center h-7 w-7 rounded-full shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)`,
                    color: item.color,
                  }}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-primary)] truncate">
                    {item.description}
                  </p>
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
                  {item.timeAgo}
                </span>
                <span
                  className="text-[11px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                    color: item.color,
                  }}
                >
                  {item.module}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
