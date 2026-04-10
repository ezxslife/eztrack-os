import { type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

export type AppPageWidth = "form" | "base" | "wide" | "full";

const widthMap: Record<AppPageWidth, string> = {
  form: "page-width-form",
  base: "page-width-base",
  wide: "page-width-wide",
  full: "page-width-full",
};

interface AppPageProps extends HTMLAttributes<HTMLDivElement> {
  width?: AppPageWidth;
}

export function AppPage({
  width = "base",
  className,
  children,
  ...rest
}: AppPageProps) {
  return (
    <div
      className={clsx(
        "mx-auto flex w-full min-w-0 flex-col gap-[var(--page-section-gap)]",
        widthMap[width],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  breadcrumbs?: ReactNode;
  className?: string;
  meta?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}

export function PageHeader({
  breadcrumbs,
  className,
  meta,
  primaryAction,
  secondaryActions,
  subtitle,
  title,
}: PageHeaderProps) {
  return (
    <header className={clsx("flex flex-col gap-4", className)}>
      {breadcrumbs ? <div className="min-w-0">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-[2rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-3xl text-[14px] leading-6 text-[var(--text-secondary)]">
              {subtitle}
            </p>
          ) : null}
          {meta ? <div className="pt-1">{meta}</div> : null}
        </div>
        {primaryAction || secondaryActions ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {secondaryActions}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}

interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  padding?: "sm" | "md" | "lg" | "none";
  surface?: boolean;
}

const paddingMap: Record<NonNullable<PageSectionProps["padding"]>, string> = {
  none: "",
  sm: "p-[var(--card-padding-sm)]",
  md: "p-[var(--card-padding-md)]",
  lg: "p-6 sm:p-7",
};

export function PageSection({
  children,
  className,
  padding = "md",
  surface = true,
  ...rest
}: PageSectionProps) {
  return (
    <section
      className={clsx(
        "min-w-0",
        surface && "surface-card",
        paddingMap[padding],
        className
      )}
      {...rest}
    >
      {children}
    </section>
  );
}
