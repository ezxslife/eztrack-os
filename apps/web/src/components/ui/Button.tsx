"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export const buttonVariantStyles = {
  default:
    "border-transparent bg-[var(--action-primary-fill)] text-[var(--text-on-brand)] shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--action-primary-fill-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:bg-[var(--action-primary-fill-pressed)]",
  secondary:
    "bg-[var(--action-primary-surface)] text-[var(--action-primary)] border-[var(--action-primary-border)] shadow-[var(--shadow-xs)] hover:bg-[var(--action-primary-surface-hover)] hover:border-[var(--action-primary)] active:bg-[var(--surface-selected)]",
  outline:
    "bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-default)] shadow-[var(--shadow-xs)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-sm)] active:bg-[var(--surface-active)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:bg-[var(--surface-active)]",
  destructive:
    "border-transparent bg-[var(--action-destructive)] text-[var(--text-on-critical)] shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--action-destructive-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:bg-[var(--action-destructive-pressed)]",
  link: "h-auto border-transparent bg-transparent px-0 py-0 text-[var(--action-primary)] underline-offset-4 hover:text-[var(--action-primary-hover)] hover:underline",
} as const;

export const buttonSizeStyles = {
  sm: "min-h-8 px-3 text-[12px] gap-1.5",
  md: "min-h-10 px-4 text-[13px] gap-2",
  lg: "min-h-11 px-5 text-[14px] gap-2.5",
} as const;

export const buttonBaseClassName =
  "inline-flex select-none items-center justify-center whitespace-nowrap rounded-[var(--btn-radius)] border font-semibold leading-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus:outline-none focus-visible:border-[var(--border-focused)] focus-visible:shadow-[var(--focus-ring)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100";

export type ButtonVariant = keyof typeof buttonVariantStyles;
export type ButtonSize = keyof typeof buttonSizeStyles;

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
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={clsx(
        buttonBaseClassName,
        buttonVariantStyles[variant],
        variant !== "link" && buttonSizeStyles[size],
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
