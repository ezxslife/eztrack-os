"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          className={clsx(
            "w-full h-9 rounded-lg border bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-tertiary)]",
            "transition-all duration-150 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)]",
            error
              ? "border-[var(--status-critical)] focus-visible:ring-[var(--status-critical)]"
              : "border-[var(--border-default)] hover:border-[var(--border-hover)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-[var(--status-critical)]">{error}</p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-[var(--text-tertiary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
