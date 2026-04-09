"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

import {
  buttonBaseClassName,
  buttonVariantStyles,
  type ButtonVariant,
} from "@/components/ui/Button";

const sizeStyles = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-11 w-11",
} as const;

type IconButtonSize = keyof typeof sizeStyles;

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  badge?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  label: string;
  pressed?: boolean;
  size?: IconButtonSize;
  variant?: Exclude<ButtonVariant, "link">;
}

export function IconButton({
  badge,
  children,
  className,
  disabled,
  isLoading = false,
  label,
  pressed = false,
  size = "md",
  variant = "ghost",
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-busy={isLoading || undefined}
      aria-label={label}
      aria-pressed={pressed || undefined}
      disabled={disabled || isLoading}
      title={label}
      className={clsx(
        buttonBaseClassName,
        "relative shrink-0 p-0",
        buttonVariantStyles[variant],
        sizeStyles[size],
        pressed &&
          variant === "ghost" &&
          "bg-[var(--surface-hover)] text-[var(--text-primary)]",
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        children
      )}
      {badge ? (
        <span className="pointer-events-none absolute -right-1 -top-1 z-10">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
