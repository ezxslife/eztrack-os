import { type ReactNode, type HTMLAttributes } from "react";
import clsx from "clsx";

/* ── Card ── */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ children, className, hover = false, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-xl shadow-sm",
        "transition-all duration-150 ease-out",
        hover && "hover:shadow-md hover:border-[var(--border-hover)] cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── CardHeader ── */
interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={clsx("px-3 pt-3 sm:px-5 sm:pt-4 pb-0 flex flex-col gap-1", className)}>
      {children}
    </div>
  );
}

/* ── CardTitle ── */
export function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3 className={clsx("text-sm font-semibold text-[var(--text-primary)] leading-tight", className)}>
      {children}
    </h3>
  );
}

/* ── CardDescription ── */
export function CardDescription({ children, className }: CardSectionProps) {
  return (
    <p className={clsx("text-[13px] text-[var(--text-secondary)] leading-snug", className)}>
      {children}
    </p>
  );
}

/* ── CardContent ── */
export function CardContent({ children, className }: CardSectionProps) {
  return (
    <div className={clsx("px-3 py-3 sm:px-5 sm:py-4", className)}>
      {children}
    </div>
  );
}

/* ── CardFooter ── */
export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div
      className={clsx(
        "px-3 py-2.5 sm:px-5 sm:py-3 border-t border-[var(--border-default)] flex items-center gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}
