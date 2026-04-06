import Link from 'next/link';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">System configuration and administration</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 text-sm text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
