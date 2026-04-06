"use client";

import clsx from "clsx";

const sizeMap = {
  sm: "h-1",
  md: "h-1.5",
} as const;

type ProgressBarSize = keyof typeof sizeMap;

interface ProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  size?: ProgressBarSize;
  className?: string;
}

export function ProgressBar({
  value,
  color,
  label,
  size = "sm",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--text-secondary)]">
            {label}
          </span>
          <span className="text-[12px] font-medium text-[var(--text-primary)]">
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        className={clsx(
          "w-full rounded-full bg-[var(--surface-secondary)] overflow-hidden",
          sizeMap[size]
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundColor:
              color || "var(--eztrack-primary-500, #6366f1)",
          }}
        />
      </div>
    </div>
  );
}
