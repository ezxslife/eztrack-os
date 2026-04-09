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
            className="mb-2 block text-[13px] font-semibold tracking-[0.01em] text-[var(--text-secondary)]"
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
            "w-full min-h-11 rounded-[var(--input-radius)] border bg-[var(--surface-primary)] px-[var(--input-padding-x)] text-[14px] text-[var(--text-primary)] shadow-[var(--shadow-xs)]",
            "placeholder:text-[var(--text-tertiary)]",
            "transition-all duration-150 ease-out",
            "focus:outline-none focus-visible:border-[var(--border-focused)] focus-visible:shadow-[var(--focus-ring)]",
            error
              ? "border-[var(--status-critical)] focus-visible:border-[var(--status-critical)]"
              : "border-[var(--border-default)] hover:border-[var(--border-hover)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[12px] leading-5 text-[var(--status-critical)]">{error}</p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-[12px] leading-5 text-[var(--text-tertiary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
