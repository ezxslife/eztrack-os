import { type ReactNode } from "react";
import { AppPage, PageHeader, PageSection } from "./AppPage";

interface SettingsLayoutProps {
  asideDescription: ReactNode;
  asideTitle: ReactNode;
  children: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}

export function SettingsLayout({
  asideDescription,
  asideTitle,
  children,
  primaryAction,
  secondaryActions,
  subtitle,
  title,
}: SettingsLayoutProps) {
  return (
    <AppPage width="wide">
      <PageHeader
        title={title}
        subtitle={subtitle}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <PageSection className="h-fit xl:sticky xl:top-[calc(var(--topbar-height)+var(--page-gutter-desktop))]">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Settings
            </p>
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{asideTitle}</h2>
            <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{asideDescription}</p>
          </div>
        </PageSection>
        <div className="min-w-0">{children}</div>
      </div>
    </AppPage>
  );
}
