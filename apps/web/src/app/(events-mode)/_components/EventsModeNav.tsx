'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookmarkPlus,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  Crown,
  Radio,
  ShieldCheck,
  Ticket,
  Tv,
  UserCheck,
  Users,
} from 'lucide-react';
import { VenueModeSwitch } from '@/components/venue-mode/VenueModeSwitch';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Radio;
  enabled?: boolean;
}

const ITEMS: NavItem[] = [
  { href: '/live', label: 'Live', icon: Radio, enabled: true },
  { href: '/pos', label: 'POS', icon: Ticket, enabled: true },
  { href: '/run-of-show', label: 'Run-of-show', icon: CalendarRange, enabled: true },
  { href: '/staff', label: 'Staff', icon: Users, enabled: true },
  { href: '/will-call', label: 'Will-call', icon: UserCheck, enabled: true },
  { href: '/vip-deny', label: 'VIP/Deny', icon: Crown, enabled: true },
  { href: '/events', label: 'Events', icon: CalendarDays, enabled: true },
  { href: '/templates', label: 'Templates', icon: BookmarkPlus, enabled: true },
  { href: '/notification-rules', label: 'Notify rules', icon: Bell, enabled: true },
  { href: '/audit', label: 'Audit', icon: ShieldCheck, enabled: true },
  { href: '/wall-display', label: 'Wall display', icon: Tv, enabled: true },
];

export function EventsModeNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="Events mode"
      className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5"
    >
      <div className="flex items-center gap-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]"
        >
          <ChevronLeft size={16} />
          Dashboard
        </Link>
        <span aria-hidden className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ul className="flex items-center gap-0.5">
          {ITEMS.map(({ href, label, icon: Icon, enabled }) => {
            const active =
              pathname === href || pathname.startsWith(href + '/');
            const cls = `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium ${
              active
                ? 'bg-[var(--surface-2)] text-[var(--ink-900)]'
                : 'text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]'
            } ${enabled === false ? 'opacity-40' : ''}`;
            if (enabled === false) {
              return (
                <li key={href}>
                  <span
                    className={cls}
                    aria-disabled="true"
                    title="Lands in L2"
                  >
                    <Icon size={14} />
                    {label}
                  </span>
                </li>
              );
            }
            return (
              <li key={href}>
                <Link href={href} className={cls} aria-current={active ? 'page' : undefined}>
                  <Icon size={14} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <VenueModeSwitch variant="events" />
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white"
          style={{ background: 'var(--ezxs-gradient-money)' }}
        >
          Events Mode
        </span>
      </div>
    </nav>
  );
}
