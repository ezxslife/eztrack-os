"use client";

import clsx from "clsx";

interface FilterChipOption<T extends string> {
  accentColor?: string;
  disabled?: boolean;
  dotColor?: string;
  label: string;
  value: T;
}

interface FilterChipGroupProps<T extends string> {
  ariaLabel?: string;
  className?: string;
  onChange: (value: T) => void;
  options: FilterChipOption<T>[];
  value: T;
}

export function FilterChipGroup<T extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  value,
}: FilterChipGroupProps<T>) {
  return (
    <div
      className={clsx("flex flex-wrap items-center gap-2", className)}
      role="group"
      aria-label={ariaLabel}
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
              "inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[12px] font-medium transition-[background-color,border-color,color,box-shadow] duration-150 ease-out focus:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "shadow-[var(--shadow-xs)]"
                : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
            )}
            style={
              selected
                ? option.accentColor
                  ? {
                      backgroundColor: `color-mix(in srgb, ${option.accentColor} 14%, transparent)`,
                      borderColor: `color-mix(in srgb, ${option.accentColor} 30%, transparent)`,
                      color: option.accentColor,
                    }
                  : {
                      backgroundColor: "var(--action-primary-surface)",
                      borderColor: "var(--action-primary-border)",
                      color: "var(--action-primary)",
                    }
                : undefined
            }
          >
            {option.dotColor ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: option.dotColor }}
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
