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
            className="mb-2 block text-[13px] font-semibold tracking-[0.01em] text-[var(--text-secondary)]"
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
            "w-full min-h-[96px] rounded-[var(--input-radius)] border bg-[var(--surface-primary)] px-[var(--input-padding-x)] py-3 text-[14px] text-[var(--text-primary)] shadow-[var(--shadow-xs)]",
            "placeholder:text-[var(--text-tertiary)]",
            "resize-y",
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
          <p id={`${textareaId}-error`} role="alert" className="mt-1.5 text-[12px] leading-5 text-[var(--status-critical)]">{error}</p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-[12px] leading-5 text-[var(--text-tertiary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
