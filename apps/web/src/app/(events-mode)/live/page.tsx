'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  PauseCircle,
  Radio,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { ManualScanWidget } from '../_components/ManualScanWidget';
import {
  fetchActiveEvent,
  fetchCurrentEventDay,
  fetchEventDays,
  fetchEventRollup,
  fetchLatestCapacitySnapshot,
  fetchRecentCheckIns,
  fetchScansSince,
  pageStaffBroadcast,
  pauseEventSales,
  sourceLabel,
  thresholdColor,
  type CapacitySnapshotRow,
  type CheckInRow,
  type DayRollupRow,
  type EventDayRow,
  type EventRow,
} from '@/lib/queries/events';

const DOOR_FLOW_WINDOW_MIN = 60;
const SURGE_RATIO = 2;

/**
 * /live — multi-day-aware capacity board. The single most-opened screen
 * during an event. Subscribes to `capacity_snapshots` + `check_ins` Realtime
 * channels for sub-500ms updates.
 */
export default function LivePage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [eventDays, setEventDays] = useState<EventDayRow[]>([]);
  const [viewingDayId, setViewingDayId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CapacitySnapshotRow | null>(null);
  const [scans, setScans] = useState<CheckInRow[]>([]);
  const [scans60min, setScans60min] = useState<CheckInRow[]>([]);
  const [rollup, setRollup] = useState<DayRollupRow[]>([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const eventDay = useMemo(
    () => eventDays.find((d) => d.id === viewingDayId) ?? null,
    [eventDays, viewingDayId],
  );

  const refresh = useCallback(async () => {
    const ev = await fetchActiveEvent();
    setEvent(ev);
    if (!ev) {
      setLoading(false);
      return;
    }

    const [days, currentDay, eventRollup] = await Promise.all([
      fetchEventDays(ev.id),
      fetchCurrentEventDay(ev.id),
      fetchEventRollup(ev.id),
    ]);
    setEventDays(days);
    setRollup(eventRollup);

    const initialDayId =
      currentDay?.id ?? days[0]?.id ?? null;
    setViewingDayId(initialDayId);

    if (initialDayId) {
      const [snap, recent, since] = await Promise.all([
        fetchLatestCapacitySnapshot(initialDayId),
        fetchRecentCheckIns(initialDayId),
        fetchScansSince(initialDayId, DOOR_FLOW_WINDOW_MIN),
      ]);
      setSnapshot(snap);
      setScans(recent);
      setScans60min(since);
    }
    setLoading(false);
  }, []);

  // When operator picks a different day from the picker, refetch day-scoped state.
  const switchDay = useCallback(async (dayId: string) => {
    setViewingDayId(dayId);
    const [snap, recent, since] = await Promise.all([
      fetchLatestCapacitySnapshot(dayId),
      fetchRecentCheckIns(dayId),
      fetchScansSince(dayId, DOOR_FLOW_WINDOW_MIN),
    ]);
    setSnapshot(snap);
    setScans(recent);
    setScans60min(since);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Realtime: capacity_snapshots — refresh the bar on each new snapshot.
  // Hook generic requires Record<string, unknown>; cast row inside callback.
  useRealtimeSubscription({
    table: 'capacity_snapshots',
    filter: event ? `event_id=eq.${event.id}` : undefined,
    enabled: !!event,
    onInsert: (row) => {
      const nextSnapshot = row as unknown as CapacitySnapshotRow;
      if (nextSnapshot.event_day_id === viewingDayId) {
        setSnapshot(nextSnapshot);
      }
      setRollup((prev) =>
        prev.map((day) =>
          day.event_day_id === nextSnapshot.event_day_id
            ? {
                ...day,
                checked_in: nextSnapshot.checked_in,
                capacity_pct: nextSnapshot.capacity_pct,
                threshold_breached: nextSnapshot.threshold_breached,
              }
            : day,
        ),
      );
    },
  });

  // Realtime: check_ins — prepend to the recent-scans feed AND append to the
  // 60-min door-flow window. Drop entries older than the window each tick.
  useRealtimeSubscription({
    table: 'check_ins',
    filter: viewingDayId ? `event_day_id=eq.${viewingDayId}` : undefined,
    enabled: !!viewingDayId,
    onInsert: (row) => {
      const scan = row as unknown as CheckInRow;
      setScans((prev) => [scan, ...prev.filter((s) => s.id !== scan.id)].slice(0, 20));
      setScans60min((prev) => {
        const cutoff = Date.now() - DOOR_FLOW_WINDOW_MIN * 60_000;
        return [...prev.filter((s) => Date.parse(s.scanned_at) >= cutoff), scan];
      });
    },
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading live ops…</span>
      </div>
    );
  }

  if (!event) return <NoEventState />;
  if (!eventDay) return <BetweenDoorsState event={event} now={now} />;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <Header
        event={event}
        eventDay={eventDay}
        eventDays={eventDays}
        onPickDay={switchDay}
        now={now}
      />
      <CapacityCard eventDay={eventDay} snapshot={snapshot} />
      <CountsRow snapshot={snapshot} eventDay={eventDay} />
      <DoorFlowChart scans={scans60min} now={now} />
      {event.is_multi_day ? (
        <RollingTotalsCard
          rollup={rollup}
          viewingDayId={viewingDayId}
          onPickDay={switchDay}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <RecentScansCard scans={scans} className="lg:col-span-2" />
        <div className="flex flex-col gap-5">
          <QuickActions event={event} />
          <ManualScanWidget orgId={event.org_id} eventId={event.id} />
        </div>
      </div>
    </div>
  );
}

/* ─── Header (with multi-day picker) ─────────────── */

function Header({
  event,
  eventDay,
  eventDays,
  onPickDay,
  now,
}: {
  event: EventRow;
  eventDay: EventDayRow;
  eventDays: EventDayRow[];
  onPickDay: (dayId: string) => void;
  now: Date;
}) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
          {event.name}
        </h1>
        <div className="mt-0.5 flex items-center gap-2 text-[14px] text-[var(--ink-500)]">
          {event.is_multi_day ? (
            <DayPicker eventDay={eventDay} eventDays={eventDays} onPick={onPickDay} />
          ) : (
            <span>Tonight</span>
          )}
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1 text-[12px] font-medium text-[var(--ink-500)]">
        <Activity size={14} className="text-[#34C759]" />
        Live
      </div>
    </header>
  );
}

function DayPicker({
  eventDay,
  eventDays,
  onPick,
}: {
  eventDay: EventDayRow;
  eventDays: EventDayRow[];
  onPick: (dayId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (eventDays.length <= 1) {
    return (
      <span>
        {eventDay.label} · Day {eventDay.day_index}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex min-h-[28px] items-center gap-1 rounded-md px-1.5 py-0.5 text-[14px] font-medium text-[var(--ink-700)] hover:bg-[var(--hover)]"
      >
        <CalendarDays size={14} />
        {eventDay.label} · Day {eventDay.day_index} of {eventDays.length}
        <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
        >
          {eventDays.map((d) => {
            const selected = d.id === eventDay.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onPick(d.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-[var(--hover)] ${
                    selected ? 'text-[var(--ink-900)]' : 'text-[var(--ink-700)]'
                  }`}
                >
                  <span>
                    Day {d.day_index} · {d.label}
                  </span>
                  <span className="text-[12px] tabular-nums text-[var(--ink-400)]">
                    {new Date(d.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ─── Capacity ───────────────────────────────────── */

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

/* ─── Counts row ─────────────────────────────────── */

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
    <section aria-label="Counts" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

/* ─── Door-flow chart ────────────────────────────── */

interface MinuteBucket {
  minuteOffset: number;
  scans: number;
}

function DoorFlowChart({ scans, now }: { scans: CheckInRow[]; now: Date }) {
  const buckets = useMemo<MinuteBucket[]>(() => {
    const out: MinuteBucket[] = [];
    const nowMs = now.getTime();
    for (let i = DOOR_FLOW_WINDOW_MIN - 1; i >= 0; i--) {
      out.push({ minuteOffset: i, scans: 0 });
    }
    for (const s of scans) {
      const ageMin = Math.floor((nowMs - Date.parse(s.scanned_at)) / 60_000);
      if (ageMin < 0 || ageMin >= DOOR_FLOW_WINDOW_MIN) continue;
      const idx = DOOR_FLOW_WINDOW_MIN - 1 - ageMin;
      if (out[idx]) out[idx].scans += 1;
    }
    return out;
  }, [scans, now]);

  const totalScans = scans.length;
  const max = Math.max(1, ...buckets.map((b) => b.scans));
  const baselinePerMin = totalScans / DOOR_FLOW_WINDOW_MIN;
  const lastFiveMin = buckets.slice(-5).reduce((sum, b) => sum + b.scans, 0) / 5;
  const surge = baselinePerMin > 0 && lastFiveMin >= baselinePerMin * SURGE_RATIO;

  return (
    <section
      aria-label="Door flow (last 60 min)"
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Door flow · last 60 min
        </h2>
        <div className="flex items-center gap-2 text-[12px] tabular-nums text-[var(--ink-400)]">
          <span>{totalScans} scans</span>
          {surge ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-[#EF4444] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white"
              role="status"
            >
              <TrendingUp size={11} />
              Surge
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex h-16 items-end gap-[2px]">
        {buckets.map((b) => {
          const h = (b.scans / max) * 100;
          return (
            <div
              key={b.minuteOffset}
              className="flex-1 rounded-sm"
              style={{
                height: `${Math.max(2, h)}%`,
                background:
                  b.scans === 0
                    ? 'var(--border)'
                    : b.scans >= max
                      ? '#34C759'
                      : 'var(--ink-300)',
              }}
              title={`${b.minuteOffset === 0 ? 'now' : `${b.minuteOffset}m ago`}: ${b.scans} scans`}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[var(--ink-400)]">
        <span>60m ago</span>
        <span>30m ago</span>
        <span>now</span>
      </div>
    </section>
  );
}

/* ─── Multi-day rolling totals ───────────────────── */

function RollingTotalsCard({
  rollup,
  viewingDayId,
  onPickDay,
}: {
  rollup: DayRollupRow[];
  viewingDayId: string | null;
  onPickDay: (dayId: string) => void;
}) {
  const totalCheckedIn = rollup.reduce((sum, d) => sum + d.checked_in, 0);
  const totalCapacity = rollup.reduce((sum, d) => sum + d.capacity, 0);
  const totalPct = totalCapacity > 0
    ? Math.min(100, Math.round((totalCheckedIn / totalCapacity) * 100))
    : 0;

  return (
    <section
      aria-label="Multi-day rolling totals"
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Across event
        </h2>
        <span className="text-[12px] tabular-nums text-[var(--ink-400)]">
          {totalCheckedIn.toLocaleString()} / {totalCapacity.toLocaleString()} ·{' '}
          {totalPct}%
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rollup.map((d) => {
          const pct = d.capacity > 0
            ? Math.min(100, Math.round((d.checked_in / d.capacity) * 100))
            : 0;
          const breach = d.threshold_breached;
          const barColor =
            breach === 'alert'
              ? '#EF4444'
              : breach === 'red'
                ? '#F97316'
                : breach === 'yellow'
                  ? '#F59E0B'
                  : '#34C759';
          const selected = d.event_day_id === viewingDayId;
          return (
            <li key={d.event_day_id}>
              <button
                type="button"
                onClick={() => onPickDay(d.event_day_id)}
                aria-pressed={selected}
                className={`block w-full rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-[var(--ink-700)] bg-[var(--surface-2)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[var(--ink-900)]">
                    Day {d.day_index} · {d.label}
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
                    {pct}%
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 text-[12px] tabular-nums text-[var(--ink-500)]">
                  <span>{d.checked_in.toLocaleString()}</span>
                  <span className="text-[var(--ink-400)]">
                    / {d.capacity.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Recent scans ───────────────────────────────── */

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

/* ─── Quick actions ──────────────────────────────── */

function QuickActions({ event }: { event: EventRow }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paused, setPaused] = useState(event.status === 'sold_out');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handlePageStaff() {
    const message = window.prompt('Broadcast message to on-shift staff:', 'All hands to door 1');
    if (!message) return;
    setBusy('page');
    try {
      const res = await pageStaffBroadcast({
        org_id: event.org_id,
        event_id: event.id,
        message,
      });
      setToast(res.ok ? 'Broadcast queued via Alerts hub' : `Failed: ${res.error ?? 'unknown'}`);
    } finally {
      setBusy(null);
    }
  }

  async function handlePauseSales() {
    if (paused) {
      setToast('Already paused. Set status back to live in /events to reopen.');
      return;
    }
    if (!window.confirm('Pause sales for this event? Sets status=sold_out.')) return;
    setBusy('pause');
    try {
      const res = await pauseEventSales(event.id);
      if (res.ok) {
        setPaused(true);
        setToast('Sales paused — status=sold_out');
      } else {
        setToast(`Failed: ${res.error ?? 'unknown'}`);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-label="Quick actions"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
    >
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        <li>
          <Link
            href="/incidents/new"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90"
            style={{ background: '#EF4444' }}
          >
            <AlertTriangle size={18} />
            Log incident
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={handlePageStaff}
            disabled={busy === 'page'}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--ezxs-gradient-money)' }}
          >
            <Radio size={18} />
            {busy === 'page' ? 'Sending…' : 'Page staff'}
          </button>
        </li>
        <li>
          <Link
            href="/will-call"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90"
            style={{ background: 'var(--ezxs-gradient-money)' }}
          >
            <Users size={18} />
            Open will-call
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={handlePauseSales}
            disabled={busy === 'pause' || paused}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: paused ? 'var(--ink-300)' : 'var(--ezxs-gradient-money)' }}
          >
            <PauseCircle size={18} />
            {paused ? 'Sales paused' : busy === 'pause' ? 'Pausing…' : 'Pause sales'}
          </button>
        </li>
      </ul>
      {toast ? (
        <p
          role="status"
          className="mt-2 rounded-md bg-[var(--surface-2)] px-3 py-1.5 text-[12px] text-[var(--ink-700)]"
        >
          {toast}
        </p>
      ) : null}
    </section>
  );
}

/* ─── Empty states ───────────────────────────────── */

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
        href="/settings/integrations"
        className="mt-2 inline-flex min-h-[44px] items-center rounded-xl px-5 py-2 text-[14px] font-semibold text-white hover:opacity-90"
        style={{ background: 'var(--ezxs-gradient-money)' }}
      >
        Connect Eventbrite
      </Link>
    </div>
  );
}

function BetweenDoorsState({ event, now }: { event: EventRow; now: Date }) {
  const startsAt = new Date(event.starts_at);
  const closed = startsAt.getTime() < now.getTime();

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
