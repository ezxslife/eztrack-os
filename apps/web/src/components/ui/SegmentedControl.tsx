"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

interface SegmentedOption<T extends string> {
  count?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  label: ReactNode;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  ariaLabel?: string;
  className?: string;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  scrollable?: boolean;
  size?: "sm" | "md";
  stretch?: boolean;
  value: T;
}

const containerSizeStyles = {
  sm: "p-0.5",
  md: "p-1",
} as const;

const optionSizeStyles = {
  sm: "min-h-9 rounded-lg px-3 text-[12px]",
  md: "min-h-11 rounded-lg px-3.5 text-[13px]",
} as const;

export function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  scrollable = false,
  size = "md",
  stretch = false,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx(scrollable ? "overflow-x-auto pb-1" : "", className)}
      role="group"
      aria-label={ariaLabel}
    >
      <div
        className={clsx(
          "inline-flex min-w-full items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] shadow-[var(--shadow-xs)]",
          containerSizeStyles[size],
          stretch && "w-full"
        )}
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={clsx(
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background-color,color,box-shadow] duration-150 ease-out focus:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
                optionSizeStyles[size],
                stretch && "flex-1",
                selected
                  ? "bg-[var(--surface-primary)] text-[var(--action-primary)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              {option.icon}
              <span>{option.label}</span>
              {option.count !== undefined ? (
                <span
                  className={clsx(
                    "tabular-nums",
                    selected ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"
                  )}
                >
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
