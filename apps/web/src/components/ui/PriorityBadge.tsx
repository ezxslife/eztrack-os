"use client";

import clsx from "clsx";
import { PRIORITY_COLORS } from "@eztrack/shared";

type Priority = keyof typeof PRIORITY_COLORS;

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.low;
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-1.5 text-[11px] font-medium leading-5 whitespace-nowrap",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: colors.text }}
      />
      {label}
    </span>
  );
}
