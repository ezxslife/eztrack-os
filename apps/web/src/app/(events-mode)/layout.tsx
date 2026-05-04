'use client';

import { useRequireAuth } from '@/lib/api/hooks';
import { EventsModeNav } from './_components/EventsModeNav';
import { PendingInvitesBanner } from './_components/PendingInvitesBanner';

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
    <div
      data-venue-mode="events"
      className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink-900)]"
    >
      <EventsModeNav />
      <PendingInvitesBanner />
      <main id="main-content" className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
