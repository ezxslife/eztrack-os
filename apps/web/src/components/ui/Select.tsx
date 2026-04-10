"use client";

import { type SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...rest }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-2 block text-[13px] font-semibold tracking-[0.01em] text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${selectId}-error` : undefined}
            className={clsx(
              "w-full min-h-11 appearance-none rounded-[var(--input-radius)] border bg-[var(--surface-primary)] px-[var(--input-padding-x)] pr-10 text-[14px] text-[var(--text-primary)] shadow-[var(--shadow-xs)]",
              "transition-all duration-150 ease-out",
              "focus:outline-none focus-visible:border-[var(--border-focused)] focus-visible:shadow-[var(--focus-ring)]",
              error
                ? "border-[var(--status-critical)] focus-visible:border-[var(--status-critical)]"
                : "border-[var(--border-default)] hover:border-[var(--border-hover)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        </div>
        {error && (
          <p id={`${selectId}-error`} role="alert" className="mt-1.5 text-[12px] leading-5 text-[var(--status-critical)]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
