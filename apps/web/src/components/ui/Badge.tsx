"use client";

import { type ReactNode } from "react";
import clsx from "clsx";
import { getStatusColors } from "@eztrack/shared";

/* ── Tone-based generic Badge ── */
const toneMap = {
  default: {
    bg: "var(--surface-secondary)",
    text: "var(--text-secondary)",
    border: "var(--border-default)",
  },
  success: {
    bg: "var(--status-success-surface, #ecfdf5)",
    text: "var(--status-success, #059669)",
    border: "var(--status-success-border, #a7f3d0)",
  },
  warning: {
    bg: "var(--status-warning-surface, #fffbeb)",
    text: "var(--status-warning, #d97706)",
    border: "var(--status-warning-border, #fde68a)",
  },
  critical: {
    bg: "var(--status-critical-surface, #fef2f2)",
    text: "var(--status-critical, #dc2626)",
    border: "var(--status-critical-border, #fecaca)",
  },
  info: {
    bg: "var(--status-info-surface, #eff6ff)",
    text: "var(--status-info, #2563eb)",
    border: "var(--status-info-border, #bfdbfe)",
  },
  attention: {
    bg: "var(--status-attention-surface, #fefce8)",
    text: "var(--status-attention, #ca8a04)",
    border: "var(--status-attention-border, #fef08a)",
  },
} as const;

type BadgeTone = keyof typeof toneMap;

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ tone = "default", children, className, dot = false }: BadgeProps) {
  const colors = toneMap[tone];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-1.5 text-[11px] font-medium leading-5 border whitespace-nowrap",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: colors.text }}
        />
      )}
      {children}
    </span>
  );
}

/* ── StatusBadge — uses getStatusColors from shared ── */
interface StatusBadgeProps {
  status: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = false }: StatusBadgeProps) {
  const colors = getStatusColors(status);
  const label = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-1.5 text-[11px] font-medium leading-5 border whitespace-nowrap",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: colors.text }}
        />
      )}
      {label}
    </span>
  );
}
