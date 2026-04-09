import { type ReactNode } from "react";
import clsx from "clsx";
import { AppPage, PageHeader, PageSection, type AppPageWidth } from "./AppPage";

interface IndexPageLayoutProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  subtitle?: ReactNode;
  summary?: ReactNode;
  title: ReactNode;
  toolbar?: ReactNode;
  width?: AppPageWidth;
}

export function IndexPageLayout({
  children,
  className,
  contentClassName,
  primaryAction,
  secondaryActions,
  subtitle,
  summary,
  title,
  toolbar,
  width = "full",
}: IndexPageLayoutProps) {
  return (
    <AppPage width={width} className={className}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
      <PageSection className={clsx("flex flex-col gap-[var(--toolbar-gap)]", contentClassName)}>
        {toolbar ? <div className="flex min-w-0 flex-col gap-[var(--toolbar-gap)]">{toolbar}</div> : null}
        {summary ? (
          <p className="text-[12px] font-medium text-[var(--text-tertiary)]">{summary}</p>
        ) : null}
        <div className="min-w-0">{children}</div>
      </PageSection>
    </AppPage>
  );
}
