'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  Save,
  ShieldAlert,
  Ticket,
  Trash2,
} from 'lucide-react';
import {
  addEventDay,
  deleteEventDay,
  fetchEventBySlug,
  fetchEventDays,
  fetchEventIncidents,
  tierDefinitionsFor,
  updateEventDay,
  updateEventLiveOpsConfig,
  updateEventStatus,
  type EventDayRow,
  type EventRow,
  type IncidentRow,
  type PosTier,
} from '@/lib/queries/events';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  const [event, setEvent] = useState<EventRow | null>(null);
  const [days, setDays] = useState<EventDayRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [tiers, setTiers] = useState<PosTier[]>([]);
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const ev = await fetchEventBySlug(slug);
    setEvent(ev);
    if (!ev) {
      setLoading(false);
      return;
    }
    const cfg = ev.live_ops_config as { auto_checkin_at_pos?: boolean };
    setAutoCheckin(cfg.auto_checkin_at_pos !== false);
    setTiers(tierDefinitionsFor(ev));
    const [d, inc] = await Promise.all([fetchEventDays(ev.id), fetchEventIncidents(ev.id)]);
    setDays(d);
    setIncidents(inc);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleAutoCheckin(next: boolean) {
    if (!event || busy) return;
    setBusy(true);
    try {
      const res = await updateEventLiveOpsConfig(event.id, { auto_checkin_at_pos: next });
      if (res.ok) {
        setAutoCheckin(next);
        setToast(`Auto check-in ${next ? 'enabled' : 'disabled'}`);
      } else {
        setToast(`Failed: ${res.error ?? 'unknown'}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(status: EventRow['status']) {
    if (!event || busy) return;
    setBusy(true);
    try {
      const res = await updateEventStatus(event.id, status);
      if (res.ok) {
        setEvent({ ...event, status });
        setToast(`Status → ${status}`);
      } else {
        setToast(`Failed: ${res.error ?? 'unknown'}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDay() {
    if (!event || busy) return;
    const lastDay = days[days.length - 1];
    const baseStart = lastDay ? new Date(lastDay.starts_at) : new Date();
    baseStart.setDate(baseStart.getDate() + 1);
    const baseEnd = new Date(baseStart.getTime() + 4 * 60 * 60_000);
    setBusy(true);
    try {
      const res = await addEventDay({
        event_id: event.id,
        label: `Day ${days.length + 1}`,
        date: baseStart.toISOString().slice(0, 10),
        starts_at: baseStart.toISOString(),
        ends_at: baseEnd.toISOString(),
        capacity: lastDay?.capacity ?? event.capacity ?? 200,
      });
      if (res.ok) {
        await refresh();
        setToast('Day added');
      } else {
        setToast(`Failed: ${res.error ?? 'unknown'}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDay(id: string) {
    if (!event || days.length <= 1) {
      setToast('At least one day is required.');
      return;
    }
    if (!window.confirm('Delete this day? Capacity snapshots will keep their references.')) return;
    setBusy(true);
    try {
      await deleteEventDay(id);
      await refresh();
      setToast('Day removed');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTiers(nextTiers: PosTier[]) {
    if (!event || busy) return;
    setBusy(true);
    try {
      const res = await updateEventLiveOpsConfig(event.id, { pos_tiers: nextTiers });
      if (res.ok) {
        setTiers(nextTiers);
        setToast('Tiers saved');
      } else {
        setToast(`Failed: ${res.error ?? 'unknown'}`);
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading event…</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <CalendarDays size={26} className="mx-auto text-[var(--ink-400)]" />
        <h1 className="mt-3 text-[22px] font-bold text-[var(--ink-900)]">Event not found</h1>
        <Link
          href="/events"
          className="mt-3 inline-flex items-center gap-1 text-[13px] text-[var(--ink-700)] underline"
        >
          <ArrowLeft size={12} /> Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-center gap-2">
        <Link
          href="/events"
          aria-label="Back to events"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            {event.name}
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            <span className="font-mono">{event.slug}</span>
            {' · '}
            <span className="uppercase tracking-wider">{event.status.replace('_', ' ')}</span>
            {event.is_multi_day ? ` · ${days.length}-day` : ' · single-day'}
          </p>
        </div>
        {event.status === 'live' ? (
          <Link
            href="/live"
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white"
            style={{ background: '#34C759' }}
          >
            Open /live
          </Link>
        ) : null}
      </header>

      {/* Status switcher */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Status
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['draft', 'on_sale', 'live', 'sold_out', 'past', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatus(s)}
              disabled={busy || event.status === s}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider transition-colors ${
                event.status === s
                  ? 'bg-[var(--ink-700)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--ink-700)] hover:bg-[var(--hover)]'
              } disabled:opacity-50`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      {/* Auto check-in toggle */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              POS auto check-in
            </h2>
            <p className="mt-1 text-[13px] text-[var(--ink-500)]">
              When on, every walk-up sale on /pos auto-fires a check-in via the canonical router.
              Turn off for advance sales that shouldn't count as door entries yet.
            </p>
          </div>
          <Toggle on={autoCheckin} onChange={handleAutoCheckin} disabled={busy} />
        </div>
      </section>

      {/* POS tiers editor */}
      <TiersEditor tiers={tiers} onSave={handleSaveTiers} busy={busy} />

      {/* Days */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <header className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Days · {days.length}
          </h2>
          <button
            type="button"
            onClick={handleAddDay}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--surface-2)] px-3 text-[13px] font-medium text-[var(--ink-900)] hover:bg-[var(--hover)] disabled:opacity-50"
          >
            <Plus size={12} /> Add day
          </button>
        </header>

        <ul className="mt-3 divide-y divide-[var(--border)]">
          {days.map((d) => (
            <DayRow
              key={d.id}
              day={d}
              canDelete={days.length > 1}
              busy={busy}
              onChange={async (patch) => {
                setBusy(true);
                try {
                  const res = await updateEventDay(d.id, patch);
                  if (res.ok) {
                    await refresh();
                    setToast('Day updated');
                  } else {
                    setToast(`Failed: ${res.error ?? 'unknown'}`);
                  }
                } finally {
                  setBusy(false);
                }
              }}
              onDelete={() => handleDeleteDay(d.id)}
            />
          ))}
        </ul>
      </section>

      {/* Incidents tied to this event */}
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Incidents · {incidents.length}
          </h2>
          <Link
            href={`/log-incident?event=${event.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-md text-[12px] font-medium text-[var(--ink-700)] hover:text-[var(--ink-900)]"
          >
            <Plus size={12} /> Log incident
          </Link>
        </header>
        {incidents.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
            No incidents logged for this event.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {incidents.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-2.5">
                <ShieldAlert
                  size={14}
                  className="flex-none"
                  color={
                    i.severity === 'critical'
                      ? '#EF4444'
                      : i.severity === 'high'
                        ? '#F97316'
                        : i.severity === 'medium'
                          ? '#F59E0B'
                          : 'var(--ink-400)'
                  }
                />
                <span className="text-[11px] font-mono tabular-nums text-[var(--ink-400)]">
                  {i.record_number}
                </span>
                <span className="flex-1 truncate text-[13px] text-[var(--ink-900)]">
                  {i.synopsis ?? i.incident_type}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[var(--ink-400)]">
                  {i.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ink-900)] px-4 py-2 text-[12px] text-white"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────── */

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`flex h-7 w-12 flex-none items-center rounded-full p-1 transition-colors disabled:opacity-50 ${
        on ? 'bg-[#34C759]' : 'bg-[var(--ink-300)]'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function DayRow({
  day,
  canDelete,
  busy,
  onChange,
  onDelete,
}: {
  day: EventDayRow;
  canDelete: boolean;
  busy: boolean;
  onChange: (
    patch: Partial<Pick<EventDayRow, 'label' | 'capacity' | 'starts_at' | 'ends_at' | 'reentry_policy'>>,
  ) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(day.label);
  const [capacity, setCapacity] = useState(String(day.capacity));

  if (!editing) {
    return (
      <li className="flex items-center gap-3 py-2.5">
        <Clock size={14} className="flex-none text-[var(--ink-400)]" />
        <div className="flex-1 min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">
            Day {day.day_index} · {day.label}
          </p>
          <p className="truncate text-[11px] text-[var(--ink-400)]">
            {new Date(day.starts_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            → cap {day.capacity.toLocaleString()} · {day.reentry_policy.replace(/_/g, ' ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={busy}
          className="text-[12px] font-medium text-[var(--ink-700)] hover:text-[var(--ink-900)]"
        >
          Edit
        </button>
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="text-[var(--ink-400)] hover:text-[#EF4444]"
            aria-label="Delete day"
          >
            <Trash2 size={14} />
          </button>
        ) : null}
      </li>
    );
  }

  return (
    <li className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
        className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
      />
      <input
        type="number"
        min={1}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] tabular-nums text-[var(--ink-900)]"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const cap = parseInt(capacity, 10);
            if (!label.trim() || Number.isNaN(cap) || cap <= 0) return;
            onChange({ label: label.trim(), capacity: cap });
            setEditing(false);
          }}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--ink-700)] px-3 text-[13px] font-medium text-white"
        >
          <Save size={12} /> Save
        </button>
        <button
          type="button"
          onClick={() => {
            setLabel(day.label);
            setCapacity(String(day.capacity));
            setEditing(false);
          }}
          disabled={busy}
          className="text-[12px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        >
          Cancel
        </button>
      </div>
    </li>
  );
}

function TiersEditor({
  tiers,
  onSave,
  busy,
}: {
  tiers: PosTier[];
  onSave: (next: PosTier[]) => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<PosTier[]>(tiers);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(tiers);
    setDirty(false);
  }, [tiers]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <header className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          POS tiers
        </h2>
        <button
          type="button"
          onClick={() => {
            setDraft([...draft, { name: 'New', price_cents: 1000 }]);
            setDirty(true);
          }}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--surface-2)] px-3 text-[13px] font-medium text-[var(--ink-900)] hover:bg-[var(--hover)] disabled:opacity-50"
        >
          <Plus size={12} /> Add tier
        </button>
      </header>
      {draft.length === 0 ? (
        <p className="mt-3 text-[13px] text-[var(--ink-400)]">
          No tiers configured. /pos defaults to GA $25 + VIP $50.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {draft.map((t, i) => (
            <li key={i} className="flex items-center gap-2">
              <Ticket size={14} className="text-[var(--ink-400)]" />
              <input
                value={t.name}
                onChange={(e) => {
                  const copy = [...draft];
                  copy[i] = { ...copy[i], name: e.target.value };
                  setDraft(copy);
                  setDirty(true);
                }}
                placeholder="GA"
                className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
              />
              <input
                type="number"
                min={0}
                step="100"
                value={t.price_cents}
                onChange={(e) => {
                  const copy = [...draft];
                  copy[i] = { ...copy[i], price_cents: parseInt(e.target.value, 10) || 0 };
                  setDraft(copy);
                  setDirty(true);
                }}
                className="h-9 w-32 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] tabular-nums text-[var(--ink-900)]"
              />
              <button
                type="button"
                onClick={() => {
                  setDraft(draft.filter((_, j) => j !== i));
                  setDirty(true);
                }}
                className="text-[var(--ink-400)] hover:text-[#EF4444]"
                aria-label="Remove tier"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {dirty ? (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(tiers);
              setDirty(false);
            }}
            className="text-[12px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave(draft)}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--ink-700)] px-3 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save tiers
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[var(--ink-400)]">
          <AlertTriangle size={11} className="mr-1 inline-block" />
          Prices in cents. Saved to <code className="font-mono">events.live_ops_config.pos_tiers</code>.
        </p>
      )}
    </section>
  );
}
