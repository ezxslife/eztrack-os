import Link from "next/link";
import { PageSection } from "@/components/layout/AppPage";
import { SettingsLayout } from "@/components/layout/SettingsLayout";

const settingsLinks = [
  { href: '/settings/organization', label: 'Organization Settings' },
  { href: '/settings/properties', label: 'Properties' },
  { href: '/settings/locations', label: 'Locations' },
  { href: '/settings/users', label: 'User Management' },
  { href: '/settings/roles', label: 'Roles & Permissions' },
  { href: '/settings/dropdowns', label: 'Dropdown Configuration' },
  { href: '/settings/form-templates', label: 'Form Templates' },
  { href: '/settings/notification-rules', label: 'Notification Rules' },
  { href: '/settings/integrations', label: 'Integrations' },
];

export default function SettingsPage() {
  return (
    <SettingsLayout
      title="Settings"
      subtitle="Manage the operational configuration, people, and automation rules behind EZTrack."
      asideTitle="Workspace controls"
      asideDescription="Settings stay concise and task-focused: choose a domain, then edit within a readable form or table layout."
    >
      <PageSection>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {settingsLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4 text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--action-primary-border)] hover:bg-[var(--surface-hover)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </PageSection>
    </SettingsLayout>
  );
}
