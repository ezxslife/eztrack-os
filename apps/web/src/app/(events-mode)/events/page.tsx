'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Ban, CalendarDays, ChevronRight, Plus, Radio } from 'lucide-react';
import { fetchEvents, type EventRow } from '@/lib/queries/events';

const STATUS_COLOR: Record<EventRow['status'], { bg: string; fg: string }> = {
  draft:     { bg: 'rgba(138, 144, 162, 0.18)', fg: 'var(--ink-700)' },
  on_sale:   { bg: 'rgba(59, 130, 246, 0.18)',  fg: '#3B82F6' },
  sold_out:  { bg: 'rgba(245, 158, 11, 0.18)',  fg: '#F59E0B' },
  live:      { bg: 'rgba(52, 199, 89, 0.18)',   fg: '#34C759' },
  hold:      { bg: 'rgba(168, 85, 247, 0.18)',  fg: '#A855F7' },
  past:      { bg: 'rgba(138, 144, 162, 0.12)', fg: 'var(--ink-400)' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.18)',   fg: '#EF4444' },
};

type FilterMode = 'active' | 'cancelled' | 'all';

export default function EventsListPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [filter, setFilter] = useState<FilterMode>('active');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchEvents();
      if (!cancelled) setEvents(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const all = events ?? [];
    const cancelled = all.filter((e) => e.status === 'cancelled' || !!e.cancelled_at).length;
    return { all: all.length, cancelled, active: all.length - cancelled };
  }, [events]);

  const visible = useMemo(() => {
    const all = events ?? [];
    if (filter === 'all') return all;
    if (filter === 'cancelled') return all.filter((e) => e.status === 'cancelled' || !!e.cancelled_at);
    return all.filter((e) => e.status !== 'cancelled' && !e.cancelled_at);
  }, [events, filter]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            Events
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            Live, upcoming, and past events for your workspace.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90"
          style={{ background: 'var(--ezxs-gradient-money)' }}
        >
          <Plus size={16} />
          New event
        </Link>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="Active" count={counts.active} active={filter === 'active'} onClick={() => setFilter('active')} />
        <FilterChip
          label="Cancelled"
          count={counts.cancelled}
          active={filter === 'cancelled'}
          onClick={() => setFilter('cancelled')}
          danger
        />
        <FilterChip label="All" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
      </div>

      {events === null ? (
        <p className="text-[13px] text-[var(--ink-400)]">Loading events…</p>
      ) : visible.length === 0 ? (
        filter === 'cancelled' ? (
          <p className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-10 text-center text-[13px] text-[var(--ink-400)]">
            No cancelled events.
          </p>
        ) : (
          <EmptyState />
        )
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  danger,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
        active
          ? danger
            ? 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]'
            : 'border-[var(--ink-700)] bg-[var(--surface-2)] text-[var(--ink-900)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-500)] hover:bg-[var(--hover)]'
      }`}
    >
      {danger ? <Ban size={11} /> : null}
      {label}
      <span className="tabular-nums text-[var(--ink-400)]">{count}</span>
    </button>
  );
}

function EventCard({ event }: { event: EventRow }) {
  const statusColor = STATUS_COLOR[event.status];
  const start = new Date(event.starts_at);
  const startLabel = start.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const isLive = event.status === 'live';
  const isCancelled = event.status === 'cancelled' || !!event.cancelled_at;

  return (
    <li className={`overflow-hidden rounded-2xl border bg-[var(--surface)] ${isCancelled ? 'border-[#EF4444]/40 opacity-70' : 'border-[var(--border)]'}`}>
      <Link
        href={`/events/${event.slug}`}
        className="block p-4 hover:bg-[var(--hover)]"
      >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[16px] font-semibold text-[var(--ink-900)]">
            {event.name}
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--ink-500)]">
            <CalendarDays size={12} />
            <span className="tabular-nums">{startLabel}</span>
            {event.is_multi_day ? <span className="ml-1">· multi-day</span> : null}
          </p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: statusColor.bg, color: statusColor.fg }}
        >
          {event.status.replace('_', ' ')}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[var(--ink-500)]">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--ink-400)]">Capacity</dt>
          <dd className="text-[14px] font-semibold tabular-nums text-[var(--ink-900)]">
            {(event.capacity ?? 0).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--ink-400)]">Slug</dt>
          <dd className="truncate font-mono text-[12px] text-[var(--ink-700)]">{event.slug}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-end gap-2">
        {isLive ? (
          <span
            className="inline-flex min-h-[28px] items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
            style={{ background: '#34C759' }}
          >
            <Radio size={11} />
            Open live
          </span>
        ) : (
          <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
            {event.record_number ?? '—'}
          </span>
        )}
        <ChevronRight size={16} className="text-[var(--ink-400)]" />
      </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--ink-400)]">
        <CalendarDays size={22} />
      </div>
      <h2 className="mt-3 text-[18px] font-bold text-[var(--ink-900)]">No events yet</h2>
      <p className="mt-1 text-[13px] text-[var(--ink-500)]">
        Create your first event to start tracking capacity, scans, and door flow.
      </p>
      <Link
        href="/events/new"
        className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90"
        style={{ background: 'var(--ezxs-gradient-money)' }}
      >
        <Plus size={16} />
        Create event
      </Link>
    </div>
  );
}
