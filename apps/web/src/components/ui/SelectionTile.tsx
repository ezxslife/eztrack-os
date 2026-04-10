"use client";

import { type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import clsx from "clsx";

type SelectionTone = "default" | "success" | "warning" | "critical" | "info";
type SelectionIndicator = "radio" | "check" | "none";

const toneVars: Record<SelectionTone, CSSProperties> = {
  default: {
    backgroundColor: "var(--action-primary-surface)",
    borderColor: "var(--action-primary-border)",
    color: "var(--action-primary)",
  },
  success: {
    backgroundColor: "var(--status-success-surface)",
    borderColor: "var(--status-success-border)",
    color: "var(--status-success)",
  },
  warning: {
    backgroundColor: "var(--status-warning-surface)",
    borderColor: "var(--status-warning-border)",
    color: "var(--status-warning)",
  },
  critical: {
    backgroundColor: "var(--status-critical-surface)",
    borderColor: "var(--status-critical-border)",
    color: "var(--status-critical)",
  },
  info: {
    backgroundColor: "var(--status-info-surface)",
    borderColor: "var(--status-info-border)",
    color: "var(--status-info)",
  },
};

interface SelectionTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> {
  description?: ReactNode;
  indicator?: SelectionIndicator;
  leading?: ReactNode;
  selected?: boolean;
  selectedLabel?: ReactNode;
  tone?: SelectionTone;
  trailing?: ReactNode;
  title: ReactNode;
}

function Indicator({
  indicator,
  selected,
}: {
  indicator: SelectionIndicator;
  selected: boolean;
}) {
  if (indicator === "none") return null;

  return (
    <span
      aria-hidden="true"
      className={clsx(
        "mt-0.5 flex shrink-0 items-center justify-center border transition-colors",
        indicator === "radio" ? "h-4 w-4 rounded-full" : "h-5 w-5 rounded-md",
        selected
          ? "border-[var(--action-primary)] bg-[var(--action-primary-surface)]"
          : "border-[var(--border-default)] bg-[var(--surface-primary)]"
      )}
    >
      {selected ? (
        <span
          className={clsx(
            "block bg-[var(--action-primary)]",
            indicator === "radio" ? "h-2 w-2 rounded-full" : "h-2.5 w-2.5 rounded-[3px]"
          )}
        />
      ) : null}
    </span>
  );
}

export function SelectionTile({
  className,
  description,
  indicator = "none",
  leading,
  selected = false,
  selectedLabel,
  title,
  tone = "default",
  trailing,
  type = "button",
  ...rest
}: SelectionTileProps) {
  return (
    <button
      type={type}
      aria-pressed={selected || undefined}
      className={clsx(
        "flex w-full items-start gap-3 rounded-[var(--radius-xl)] border px-4 py-3.5 text-left transition-[background-color,border-color,box-shadow] duration-150 ease-out focus:outline-none focus-visible:shadow-[var(--focus-ring)]",
        selected
          ? "shadow-[var(--shadow-xs)]"
          : "border-[var(--border-default)] bg-[var(--surface-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]",
        className
      )}
      style={selected ? toneVars[tone] : undefined}
      {...rest}
    >
      <Indicator indicator={indicator} selected={selected} />
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={clsx("text-[13px] font-medium", selected ? "text-current" : "text-[var(--text-primary)]")}>
              {title}
            </div>
            {description ? (
              <div className={clsx("mt-1 text-[11px] leading-5", selected ? "text-current/80" : "text-[var(--text-tertiary)]")}>
                {description}
              </div>
            ) : null}
          </div>
          {trailing ? (
            <div className="shrink-0">{trailing}</div>
          ) : selected && selectedLabel ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={toneVars[tone]}
            >
              {selectedLabel}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
