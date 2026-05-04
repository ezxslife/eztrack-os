'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, Tag, UserCheck } from 'lucide-react';
import {
  fetchActiveEvent,
  fetchCurrentEventDay,
  fetchWillCall,
  markWristbanded,
  type EventDayRow,
  type EventRow,
  type WillCallEntry,
} from '@/lib/queries/events';

export default function WillCallPage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [entries, setEntries] = useState<WillCallEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (eventId: string) => {
    const list = await fetchWillCall(eventId);
    setEntries(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ev = await fetchActiveEvent();
      if (cancelled) return;
      setEvent(ev);
      if (ev) {
        const [d] = await Promise.all([fetchCurrentEventDay(ev.id), refresh(ev.id)]);
        if (!cancelled) setDay(d);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleWristband(ticketId: string) {
    if (!day) return;
    setBusy(ticketId);
    try {
      await markWristbanded(ticketId, day.id);
      if (event) await refresh(event.id);
    } finally {
      setBusy(null);
    }
  }

  const q = filter.trim().toLowerCase();
  const visible = !q
    ? entries
    : entries.filter((e) =>
        [
          e.customer_first_name,
          e.customer_last_name,
          e.customer_email,
          e.tier,
          e.external_id,
        ]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(q)),
      );
  const awaiting = visible.filter((e) => !e.wristbanded_at_event_day_id);
  const wristbanded = visible.filter((e) => !!e.wristbanded_at_event_day_id);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading will-call…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
          Will-call
        </h1>
        <p className="text-[14px] text-[var(--ink-500)]">
          {event?.name ?? 'No event'} · pickups + multi-day wristband tracking
        </p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)]"
        />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, email, ticket ID"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-[14px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] focus:border-[var(--ink-700)]"
        />
      </div>

      <Section title="Awaiting pickup" count={awaiting.length}>
        {awaiting.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
            All caught up. Nothing waiting at the will-call window.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {awaiting.map((e) => (
              <Row
                key={e.ticket_id}
                entry={e}
                actionLabel={day ? 'Wristband' : 'No active day'}
                actionDisabled={!day || busy === e.ticket_id}
                actionBusy={busy === e.ticket_id}
                onAction={() => handleWristband(e.ticket_id)}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Wristbanded today" count={wristbanded.length}>
        {wristbanded.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
            None yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {wristbanded.map((e) => (
              <Row key={e.ticket_id} entry={e} actionLabel="Done" actionDisabled />
            ))}
          </ul>
        )}
      </Section>

      <p className="text-[11px] text-[var(--ink-400)]">
        Reframed Visitors module. Tickets flagged <code className="font-mono">pickup_required</code>{' '}
        from Eventbrite/Stripe automatically appear here. Multi-day pass holders get a{' '}
        <code className="font-mono">wristbanded_at_event_day_id</code> stamp on first pickup.
      </p>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          {title}
        </h2>
        <span className="text-[12px] tabular-nums text-[var(--ink-400)]">{count}</span>
      </header>
      {children}
    </section>
  );
}

function Row({
  entry,
  actionLabel,
  actionDisabled,
  actionBusy,
  onAction,
}: {
  entry: WillCallEntry;
  actionLabel: string;
  actionDisabled?: boolean;
  actionBusy?: boolean;
  onAction?: () => void;
}) {
  const name =
    entry.customer_first_name || entry.customer_last_name
      ? `${entry.customer_first_name ?? ''} ${entry.customer_last_name ?? ''}`.trim()
      : entry.customer_email ?? entry.external_id ?? 'Unknown';
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">{name}</p>
        <p className="truncate text-[11px] text-[var(--ink-400)]">
          <Tag size={10} className="mr-1 inline-block" />
          {entry.tier} · {entry.state}
          {entry.external_id ? ` · ${entry.external_id}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
        style={{ background: actionDisabled ? 'var(--ink-300)' : '#34C759' }}
      >
        {actionBusy ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
        {actionLabel}
      </button>
    </li>
  );
}
