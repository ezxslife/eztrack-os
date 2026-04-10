"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

interface InlineActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function InlineAction({
  children,
  className,
  leadingIcon,
  trailingIcon,
  type = "button",
  ...rest
}: InlineActionProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[12px] font-medium text-[var(--action-primary)] underline-offset-4 transition-colors duration-150 ease-out hover:text-[var(--action-primary-hover)] hover:underline focus:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
