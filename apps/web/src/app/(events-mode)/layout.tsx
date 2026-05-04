'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRequireAuth } from '@/lib/api/hooks';

/**
 * Events-mode layout — settle is the canonical chrome + token source for this
 * route group (per `apps/web/src/styles/settle/index.css` import contract +
 * CLAUDE.md "Theme — split by mode"). The `data-venue-mode="events"` anchor on
 * the root div lets settle's [data-venue-mode="events"] overrides target this
 * subtree without leaking into security mode.
 *
 * The full chrome port (Sidebar, MobileNav, QuickAddSheet, AssistantPanel)
 * lands in L1 alongside /live + /pos. This layout currently keeps the slim
 * header but uses settle's surface tokens (`--surface`, `--bg`, `--ink-*`,
 * `--border`) instead of the eztrack-os ones (`--surface-bg`, etc.) so the
 * styling contract is honored from L0c onward.
 */
import '@/styles/settle/index.css';

export default function EventsModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useRequireAuth('/login');

  if (loading) {
    return (
      <div data-venue-mode="events" className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <span className="text-[13px] text-[var(--ink-500)]">Loading…</span>
      </div>
    );
  }

  return (
    <div data-venue-mode="events" className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink-900)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]"
        >
          <ChevronLeft size={16} />
          Dashboard
        </Link>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white"
          style={{ background: 'var(--ezxs-gradient-money)' }}
        >
          Events Mode
        </span>
      </header>
      <main id="main-content" className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
