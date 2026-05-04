'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  PauseCircle,
  Radio,
  Ticket,
  Users,
} from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import {
  fetchActiveEvent,
  fetchCurrentEventDay,
  fetchLatestCapacitySnapshot,
  fetchRecentCheckIns,
  sourceLabel,
  thresholdColor,
  type CapacitySnapshotRow,
  type CheckInRow,
  type EventDayRow,
  type EventRow,
} from '@/lib/queries/events';

/**
 * /live — multi-day-aware capacity board. The single most-opened screen
 * during an event. Subscribes to `capacity_snapshots` + `check_ins` Realtime
 * channels for sub-500ms updates.
 */
export default function LivePage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [eventDay, setEventDay] = useState<EventDayRow | null>(null);
  const [snapshot, setSnapshot] = useState<CapacitySnapshotRow | null>(null);
  const [scans, setScans] = useState<CheckInRow[]>([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const ev = await fetchActiveEvent();
    setEvent(ev);
    if (!ev) {
      setLoading(false);
      return;
    }
    const ed = await fetchCurrentEventDay(ev.id);
    setEventDay(ed);
    if (ed) {
      const [snap, recent] = await Promise.all([
        fetchLatestCapacitySnapshot(ed.id),
        fetchRecentCheckIns(ed.id),
      ]);
      setSnapshot(snap);
      setScans(recent);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Realtime: capacity_snapshots — refresh the bar on each new snapshot.
  // Hook generic requires Record<string, unknown>; cast row inside callback.
  useRealtimeSubscription({
    table: 'capacity_snapshots',
    filter: eventDay ? `event_day_id=eq.${eventDay.id}` : undefined,
    enabled: !!eventDay,
    onInsert: (row) => setSnapshot(row as unknown as CapacitySnapshotRow),
  });

  // Realtime: check_ins — prepend to the recent-scans feed
  useRealtimeSubscription({
    table: 'check_ins',
    filter: eventDay ? `event_day_id=eq.${eventDay.id}` : undefined,
    enabled: !!eventDay,
    onInsert: (row) => {
      const scan = row as unknown as CheckInRow;
      setScans((prev) => [scan, ...prev.filter((s) => s.id !== scan.id)].slice(0, 20));
    },
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading live ops…</span>
      </div>
    );
  }

  if (!event) {
    return <NoEventState />;
  }

  if (!eventDay) {
    return <BetweenDoorsState event={event} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <Header event={event} eventDay={eventDay} now={now} />
      <CapacityCard eventDay={eventDay} snapshot={snapshot} />
      <CountsRow snapshot={snapshot} eventDay={eventDay} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <RecentScansCard scans={scans} className="lg:col-span-2" />
        <QuickActions />
      </div>
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────── */

function Header({
  event,
  eventDay,
  now,
}: {
  event: EventRow;
  eventDay: EventDayRow;
  now: Date;
}) {
  const dayLabel = event.is_multi_day
    ? `${eventDay.label} · Day ${eventDay.day_index}`
    : 'Tonight';

  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
          {event.name}
        </h1>
        <p className="text-[14px] text-[var(--ink-500)]">
          {dayLabel}
          {' · '}
          <span className="tabular-nums">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1 text-[12px] font-medium text-[var(--ink-500)]">
        <Activity size={14} className="text-[#34C759]" />
        Live
      </div>
    </header>
  );
}

function CapacityCard({
  eventDay,
  snapshot,
}: {
  eventDay: EventDayRow;
  snapshot: CapacitySnapshotRow | null;
}) {
  const checkedIn = snapshot?.checked_in ?? 0;
  const capacity = eventDay.capacity || 1;
  const pct = Math.min(100, Math.round((checkedIn / capacity) * 100));
  const color = thresholdColor(snapshot);

  return (
    <section
      aria-label="Capacity"
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Capacity
        </h2>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ background: color.bg, color: color.fg }}
        >
          {color.label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[44px] font-bold leading-none tabular-nums text-[var(--ink-900)]">
          {checkedIn.toLocaleString()}
        </span>
        <span className="text-[20px] tabular-nums text-[var(--ink-400)]">
          / {capacity.toLocaleString()}
        </span>
        <span className="ml-auto text-[24px] font-semibold tabular-nums text-[var(--ink-500)]">
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--bg)]">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color.bg }}
        />
      </div>
    </section>
  );
}

function CountsRow({
  snapshot,
  eventDay,
}: {
  snapshot: CapacitySnapshotRow | null;
  eventDay: EventDayRow;
}) {
  const sold = snapshot?.sold ?? 0;
  const checkedIn = snapshot?.checked_in ?? 0;
  const reentries = snapshot?.reentries ?? 0;
  const remaining = Math.max(0, eventDay.capacity - checkedIn);

  const items: Array<{ label: string; value: number; icon: typeof Ticket }> = [
    { label: 'Sold (today)', value: sold, icon: Ticket },
    { label: 'Checked in', value: checkedIn, icon: Users },
    { label: 'Re-entries', value: reentries, icon: Activity },
    { label: 'Remaining', value: remaining, icon: AlertTriangle },
  ];

  return (
    <section
      aria-label="Counts"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-[var(--ink-400)]">
            <Icon size={14} />
            {label}
          </div>
          <div className="mt-1 text-[28px] font-bold leading-tight tabular-nums text-[var(--ink-900)]">
            {value.toLocaleString()}
          </div>
        </div>
      ))}
    </section>
  );
}

function RecentScansCard({
  scans,
  className = '',
}: {
  scans: CheckInRow[];
  className?: string;
}) {
  return (
    <section
      aria-label="Recent scans"
      className={`flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Recent scans
        </h2>
        <span className="text-[12px] tabular-nums text-[var(--ink-400)]">
          {scans.length} shown
        </span>
      </header>
      <ul className="divide-y divide-[var(--border)]">
        {scans.length === 0 ? (
          <li className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
            Waiting for scans…
          </li>
        ) : (
          scans.map((scan) => <ScanRow key={scan.id} scan={scan} />)
        )}
      </ul>
    </section>
  );
}

function ScanRow({ scan }: { scan: CheckInRow }) {
  const time = useMemo(
    () =>
      new Date(scan.scanned_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [scan.scanned_at],
  );
  const ok = scan.result === 'success';
  const reentry = scan.result === 'already_scanned';
  const color = ok ? '#34C759' : reentry ? '#F59E0B' : '#EF4444';
  const label = ok ? 'IN' : reentry ? 'RE' : 'NO';

  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <span
        className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10px] font-bold tabular-nums text-white"
        style={{ background: color }}
        aria-label={scan.result}
      >
        {label}
      </span>
      <span className="flex-1 truncate text-[13px] text-[var(--ink-900)]">
        {scan.location ?? scan.device ?? 'Door scan'}
        {scan.entry_number > 1 ? (
          <span className="ml-1 text-[var(--ink-400)]">· entry {scan.entry_number}</span>
        ) : null}
      </span>
      <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
        {sourceLabel(scan.source)}
      </span>
      <span className="flex-none text-[12px] tabular-nums text-[var(--ink-400)]">{time}</span>
    </li>
  );
}

function QuickActions() {
  // 44pt minimum tap targets per CLAUDE.md theme guidance.
  const actions: Array<{ label: string; href: string; icon: typeof Radio; tone: 'primary' | 'danger' }> = [
    { label: 'Log incident', href: '/incidents/new', icon: AlertTriangle, tone: 'danger' },
    { label: 'Page staff', href: '#', icon: Radio, tone: 'primary' },
    { label: 'Open will-call', href: '#', icon: Users, tone: 'primary' },
    { label: 'Pause sales', href: '#', icon: PauseCircle, tone: 'primary' },
  ];

  return (
    <section
      aria-label="Quick actions"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
    >
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {actions.map(({ label, href, icon: Icon, tone }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90"
              style={{
                background:
                  tone === 'danger' ? '#EF4444' : 'var(--ezxs-gradient-money)',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoEventState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--ink-400)]">
        <Activity size={26} />
      </div>
      <h1 className="text-[22px] font-bold text-[var(--ink-900)]">No event live right now</h1>
      <p className="text-[14px] text-[var(--ink-500)]">
        Connect Eventbrite or create an event to see real-time capacity, scans, and door flow.
      </p>
      <Link
        href="/settings#connections"
        className="mt-2 inline-flex min-h-[44px] items-center rounded-xl px-5 py-2 text-[14px] font-semibold text-white hover:opacity-90"
        style={{ background: 'var(--ezxs-gradient-money)' }}
      >
        Connect Eventbrite
      </Link>
    </div>
  );
}

function BetweenDoorsState({ event }: { event: EventRow }) {
  const startsAt = new Date(event.starts_at);
  const closed = startsAt.getTime() < Date.now();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--ink-400)]">
        <Activity size={26} />
      </div>
      <h1 className="text-[22px] font-bold text-[var(--ink-900)]">{event.name}</h1>
      <p className="text-[14px] text-[var(--ink-500)]">
        {closed
          ? 'Doors are closed for the night. The next event_day starts soon.'
          : `Doors open ${startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
      </p>
    </div>
  );
}
