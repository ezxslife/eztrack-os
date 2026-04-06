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
            className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1"
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
              "w-full appearance-none h-9 rounded-lg border bg-[var(--surface-primary)] px-3 pr-8 text-[13px] text-[var(--text-primary)]",
              "transition-all duration-150 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)]",
              error
                ? "border-[var(--status-critical)] focus-visible:ring-[var(--status-critical)]"
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
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)] pointer-events-none" />
        </div>
        {error && (
          <p id={`${selectId}-error`} role="alert" className="mt-1 text-xs text-[var(--status-critical)]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
