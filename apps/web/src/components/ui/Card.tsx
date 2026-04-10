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
        "bg-[var(--surface-primary)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-sm",
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
    <div className={clsx("flex flex-col gap-1 px-[var(--card-padding-sm)] pb-0 pt-[var(--card-padding-sm)] sm:px-[var(--card-padding-md)] sm:pt-[var(--card-padding-md)]", className)}>
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
    <div className={clsx("px-[var(--card-padding-sm)] py-[var(--card-padding-sm)] sm:px-[var(--card-padding-md)] sm:py-[var(--card-padding-md)]", className)}>
      {children}
    </div>
  );
}

/* ── CardFooter ── */
export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 border-t border-[var(--border-default)] px-[var(--card-padding-sm)] py-3 sm:px-[var(--card-padding-md)]",
        className
      )}
    >
      {children}
    </div>
  );
}
