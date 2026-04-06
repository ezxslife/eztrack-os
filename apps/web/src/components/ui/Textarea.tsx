"use client";

import { type TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, rows = 3, ...rest }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          className={clsx(
            "w-full min-h-[80px] rounded-lg border bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-tertiary)]",
            "resize-y",
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
          <p id={`${textareaId}-error`} role="alert" className="mt-1 text-xs text-[var(--status-critical)]">{error}</p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1 text-xs text-[var(--text-tertiary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
