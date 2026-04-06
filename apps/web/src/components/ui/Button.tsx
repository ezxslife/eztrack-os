"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

const variantStyles = {
  default:
    "bg-[var(--action-primary)] text-white hover:bg-[var(--action-primary-hover)] active:bg-[var(--action-primary-pressed)]",
  secondary:
    "bg-[var(--surface-primary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] active:bg-[var(--surface-pressed)]",
  outline:
    "bg-transparent text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] active:bg-[var(--surface-pressed)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-pressed)]",
  destructive:
    "bg-[var(--status-critical)] text-white hover:bg-[var(--status-critical-hover,#dc2626)] active:bg-[var(--status-critical-pressed,#b91c1c)]",
  link: "bg-transparent text-[var(--action-primary)] underline-offset-4 hover:underline p-0 h-auto",
} as const;

const sizeStyles = {
  sm: "h-7 text-xs px-2.5 gap-1",
  md: "h-8 text-[13px] px-3 gap-1.5",
  lg: "h-9 text-sm px-4 gap-2",
} as const;

type ButtonVariant = keyof typeof variantStyles;
type ButtonSize = keyof typeof sizeStyles;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "default",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-all duration-150 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-primary)]",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variantStyles[variant],
        variant !== "link" && sizeStyles[size],
        className
      )}
      {...rest}
    >
      {isLoading && (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      )}
      {children}
    </button>
  );
}
