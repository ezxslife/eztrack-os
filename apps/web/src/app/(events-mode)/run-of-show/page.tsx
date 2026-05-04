'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Clock,
  Copy,
  Loader2,
  Plus,
  Send,
  Square,
  Trash2,
} from 'lucide-react';
import {
  addChecklistItem,
  addRosSlot,
  cloneRunOfShowDay,
  deleteRosSlot,
  fetchActiveEvent,
  fetchChecklistItems,
  fetchCurrentEventDay,
  fetchEventDays,
  fetchOrCreateRunOfShow,
  fetchRosSlots,
  publishRunOfShow,
  toggleChecklistItem,
  type ChecklistItemRow,
  type EventDayRow,
  type EventRow,
  type RosSlotRow,
  type RunOfShowRow,
} from '@/lib/queries/events';
import { useAuth } from '@/lib/api/hooks';

export default function RunOfShowPage() {
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [days, setDays] = useState<EventDayRow[]>([]);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [ros, setRos] = useState<RunOfShowRow | null>(null);
  const [slots, setSlots] = useState<RosSlotRow[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (eventId: string, eventDayId: string, orgId: string) => {
    const r = await fetchOrCreateRunOfShow(orgId, eventId, eventDayId);
    setRos(r);
    const [s, c] = await Promise.all([fetchRosSlots(r.id), fetchChecklistItems(r.id)]);
    setSlots(s);
    setChecklist(c);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ev = await fetchActiveEvent();
      if (cancelled || !ev) {
        setEvent(ev);
        setLoading(false);
        return;
      }
      setEvent(ev);
      const [allDays, currentDay] = await Promise.all([
        fetchEventDays(ev.id),
        fetchCurrentEventDay(ev.id),
      ]);
      setDays(allDays);
      const d = currentDay ?? allDays[0] ?? null;
      setDay(d);
      if (d) await refresh(ev.id, d.id, ev.org_id);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleAddSlot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ros || busy) return;
    const fd = new FormData(e.currentTarget);
    const label = String(fd.get('label') ?? '').trim();
    const startsAt = String(fd.get('starts_at') ?? '');
    const endsAt = String(fd.get('ends_at') ?? '');
    if (!label || !startsAt || !endsAt) return;
    setBusy(true);
    try {
      await addRosSlot({
        ros_id: ros.id,
        label,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
      });
      setSlots(await fetchRosSlots(ros.id));
      e.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddChecklist(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ros || busy) return;
    const fd = new FormData(e.currentTarget);
    const label = String(fd.get('label') ?? '').trim();
    if (!label) return;
    setBusy(true);
    try {
      await addChecklistItem(ros.id, label);
      setChecklist(await fetchChecklistItems(ros.id));
      e.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(id: string, complete: boolean) {
    setChecklist((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, completed_at: complete ? new Date().toISOString() : null }
          : c,
      ),
    );
    await toggleChecklistItem(id, complete, user?.id ?? null);
  }

  async function handlePublish() {
    if (!ros) return;
    setBusy(true);
    try {
      await publishRunOfShow(ros.id);
      setRos({ ...ros, published_to_staff_at: new Date().toISOString() });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!ros) return;
    await deleteRosSlot(id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSwitchDay(targetDay: EventDayRow) {
    if (!event || busy) return;
    setBusy(true);
    try {
      setDay(targetDay);
      await refresh(event.id, targetDay.id, event.org_id);
    } finally {
      setBusy(false);
    }
  }

  async function handleCloneFrom(sourceDay: EventDayRow) {
    if (!event || !day || !ros || busy) return;
    setBusy(true);
    try {
      // Need the source ros for the source day
      const sourceRos = await fetchOrCreateRunOfShow(
        event.org_id,
        event.id,
        sourceDay.id,
      );
      const res = await cloneRunOfShowDay({
        source_ros_id: sourceRos.id,
        source_event_day_id: sourceDay.id,
        target_event_day_id: day.id,
        target_event_id: event.id,
        org_id: event.org_id,
      });
      if (!res.ok) {
        console.error('clone failed', res.error);
        return;
      }
      await refresh(event.id, day.id, event.org_id);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading run-of-show…</span>
      </div>
    );
  }

  if (!event || !day || !ros) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <Clock size={26} className="mx-auto text-[var(--ink-400)]" />
        <h1 className="mt-3 text-[22px] font-bold text-[var(--ink-900)]">No active event day</h1>
        <p className="mt-1 text-[14px] text-[var(--ink-500)]">
          Create or set an event live to start a run-of-show.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            Run-of-show
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            {event.name} · {day.label}
            {days.length > 1 ? ` · Day ${day.day_index} of ${days.length}` : ''}
            {ros.published_to_staff_at
              ? ` · published ${new Date(ros.published_to_staff_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : ' · draft'}
          </p>
        </div>
        <button
          type="button"
          onClick={handlePublish}
          disabled={busy || !!ros.published_to_staff_at}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--ezxs-gradient-money)' }}
        >
          <Send size={14} />
          {ros.published_to_staff_at ? 'Published' : 'Publish to staff'}
        </button>
      </header>

      {/* Day tabs (multi-day only) + Clone-from picker */}
      {days.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <ul className="flex flex-wrap gap-1 rounded-xl bg-[var(--surface)] p-1">
            {days.map((d) => {
              const active = d.id === day.id;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => handleSwitchDay(d)}
                    disabled={busy}
                    aria-pressed={active}
                    className={`min-h-[36px] rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-[var(--surface-2)] text-[var(--ink-900)]'
                        : 'text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]'
                    }`}
                  >
                    Day {d.day_index} · {d.label}
                  </button>
                </li>
              );
            })}
          </ul>
          {slots.length === 0 && checklist.length === 0 ? (
            <CloneFromPicker
              days={days.filter((d) => d.id !== day.id)}
              busy={busy}
              onPick={handleCloneFrom}
            />
          ) : null}
        </div>
      ) : null}

      {/* Timeline */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Timeline
        </h2>
        {slots.length === 0 ? (
          <p className="mt-3 text-[13px] text-[var(--ink-400)]">
            Add load-in, sound check, doors, sets, last call, load-out.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {slots.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <Clock size={14} className="flex-none text-[var(--ink-400)]" />
                <span className="w-32 flex-none text-[12px] tabular-nums text-[var(--ink-500)]">
                  {new Date(s.starts_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  –{' '}
                  {new Date(s.ends_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="flex-1 truncate text-[14px] font-medium text-[var(--ink-900)]">
                  {s.label}
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${s.label}`}
                  onClick={() => handleDeleteSlot(s.id)}
                  className="text-[var(--ink-400)] hover:text-[#EF4444]"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddSlot} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input
            name="label"
            placeholder="Doors open"
            required
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)] sm:col-span-2"
          />
          <input
            name="starts_at"
            type="datetime-local"
            required
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
          />
          <input
            name="ends_at"
            type="datetime-local"
            required
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[var(--surface-2)] px-3 text-[13px] font-medium text-[var(--ink-900)] hover:bg-[var(--hover)] disabled:opacity-50 sm:col-span-4"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add slot
          </button>
        </form>
      </section>

      {/* Checklist */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Pre-event checklist
        </h2>
        {checklist.length === 0 ? (
          <p className="mt-3 text-[13px] text-[var(--ink-400)]">
            Add radio test, ID check training, bar setup, etc.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {checklist.map((c) => {
              const done = !!c.completed_at;
              return (
                <li key={c.id} className="flex items-center gap-2 py-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(c.id, !done)}
                    aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    className={`flex-none ${done ? 'text-[#34C759]' : 'text-[var(--ink-400)] hover:text-[var(--ink-700)]'}`}
                  >
                    {done ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                  <span
                    className={`flex-1 text-[13px] ${
                      done ? 'text-[var(--ink-400)] line-through' : 'text-[var(--ink-900)]'
                    }`}
                  >
                    {c.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleAddChecklist} className="mt-4 flex gap-2">
          <input
            name="label"
            placeholder="Radio test"
            required
            className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center gap-1 rounded-lg bg-[var(--surface-2)] px-3 text-[13px] font-medium text-[var(--ink-900)] hover:bg-[var(--hover)] disabled:opacity-50"
          >
            <Plus size={12} />
            Add
          </button>
        </form>
      </section>
    </div>
  );
}

function CloneFromPicker({
  days,
  busy,
  onPick,
}: {
  days: EventDayRow[];
  busy: boolean;
  onPick: (day: EventDayRow) => void;
}) {
  const [open, setOpen] = useState(false);
  if (days.length === 0) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--hover)] disabled:opacity-50"
      >
        <Copy size={12} />
        Clone from…
      </button>
      {open ? (
        <ul className="absolute left-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
          {days.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onPick(d);
                }}
                className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[var(--ink-700)] hover:bg-[var(--hover)]"
              >
                Day {d.day_index} · {d.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
