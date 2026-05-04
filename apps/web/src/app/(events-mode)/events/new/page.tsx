'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import {
  createEvent,
  fetchCurrentOrgId,
  slugify,
  type CreateEventDayInput,
  type EventDayRow,
  type EventRow,
} from '@/lib/queries/events';

type FormStatus = Extract<EventRow['status'], 'draft' | 'on_sale' | 'live'>;
type ReentryPolicy = EventDayRow['reentry_policy'];

interface DayDraft {
  label: string;
  date: string;        // YYYY-MM-DD
  starts_at: string;   // datetime-local
  ends_at: string;     // datetime-local
  capacity: string;
  reentry_policy: ReentryPolicy;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultDay(offsetDays = 0): DayDraft {
  const start = new Date(Date.now() + 60 * 60_000 + offsetDays * 24 * 60 * 60_000);
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() - (start.getMinutes() % 15));
  const end = new Date(start.getTime() + 4 * 60 * 60_000);
  return {
    label: offsetDays === 0 ? 'Tonight' : `Day ${offsetDays + 1}`,
    date: dateOnly(start),
    starts_at: toLocalIso(start),
    ends_at: toLocalIso(end),
    capacity: '200',
    reentry_policy: 'count_once_per_day',
  };
}

export default function NewEventPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugDirty, setSlugDirty] = useState(false);
  const [status, setStatus] = useState<FormStatus>('live');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [days, setDays] = useState<DayDraft[]>([defaultDay(0)]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await fetchCurrentOrgId();
      if (cancelled) return;
      if (!id) {
        setOrgError(
          'Could not resolve your workspace. Sign in or contact your operations admin.',
        );
      } else {
        setOrgId(id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!slugDirty) setSlug(slugify(name));
  }, [name, slugDirty]);

  function updateDay(idx: number, patch: Partial<DayDraft>) {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function addDay() {
    setDays((prev) => [...prev, defaultDay(prev.length)]);
  }

  function removeDay(idx: number) {
    setDays((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orgId) return setError('Workspace not loaded yet — try again in a moment.');
    if (!name.trim()) return setError('Give the event a name.');
    if (!slug.trim()) return setError('Slug is required (lowercase, dashes only).');

    const dayRows: CreateEventDayInput[] = [];
    for (const [i, d] of days.entries()) {
      if (!d.label.trim()) return setError(`Day ${i + 1}: label is required.`);
      const startMs = new Date(d.starts_at).getTime();
      const endMs = new Date(d.ends_at).getTime();
      if (Number.isNaN(startMs) || Number.isNaN(endMs)) return setError(`Day ${i + 1}: invalid times.`);
      if (endMs <= startMs) return setError(`Day ${i + 1}: doors close must be after doors open.`);
      const cap = parseInt(d.capacity, 10);
      if (Number.isNaN(cap) || cap <= 0) return setError(`Day ${i + 1}: capacity must be > 0.`);
      dayRows.push({
        label: d.label.trim(),
        date: d.date,
        starts_at: new Date(d.starts_at).toISOString(),
        ends_at: new Date(d.ends_at).toISOString(),
        capacity: cap,
        reentry_policy: d.reentry_policy,
      });
    }

    const totalCapacity = dayRows.reduce((sum, d) => sum + d.capacity, 0);

    setSubmitting(true);
    try {
      const ev = await createEvent({
        org_id: orgId,
        name: name.trim(),
        slug: slug.trim(),
        capacity: totalCapacity,
        status,
        days: dayRows,
      });
      router.push(ev.status === 'live' ? '/live' : '/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event.');
      setSubmitting(false);
    }
  }

  // When toggling multi-day on, keep current day(s); when turning off, collapse to one.
  function setMultiDay(on: boolean) {
    setIsMultiDay(on);
    if (!on && days.length > 1) setDays(days.slice(0, 1));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-center gap-2">
        <Link
          href="/events"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]"
          aria-label="Back to events"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            New event
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            Single- or multi-day. Per-day capacity + re-entry policy.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        {orgError ? (
          <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-[13px] text-[#EF4444]">
            <AlertTriangle size={13} className="mr-1.5 inline-block" />
            {orgError}
          </div>
        ) : null}

        {/* Event basics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Event name" htmlFor="name">
            <input
              id="name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skyline Lounge — Friday"
              className="input"
            />
          </Field>
          <Field label="Slug (URL-safe)" htmlFor="slug">
            <input
              id="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugDirty(true);
                setSlug(e.target.value);
              }}
              placeholder="skyline-friday"
              className="input font-mono"
            />
          </Field>
          <Field label="Status" htmlFor="status" wide>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as FormStatus)}
              className="input"
            >
              <option value="live">live (visible on /live now)</option>
              <option value="on_sale">on_sale</option>
              <option value="draft">draft</option>
            </select>
          </Field>
        </div>

        {/* Multi-day toggle */}
        <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
          <input
            type="checkbox"
            checked={isMultiDay}
            onChange={(e) => setMultiDay(e.target.checked)}
            className="h-4 w-4 accent-[#34C759]"
          />
          <CalendarDays size={14} className="text-[var(--ink-500)]" />
          <span className="text-[13px] font-medium text-[var(--ink-900)]">
            Multi-day event
          </span>
          <span className="text-[11px] text-[var(--ink-400)]">
            Festivals, multi-night residencies, conferences. Each day gets its own capacity +
            re-entry policy.
          </span>
        </label>

        {/* Day rows */}
        <div className="flex flex-col gap-3">
          {days.map((d, i) => (
            <DayRow
              key={i}
              index={i}
              total={days.length}
              day={d}
              onChange={(patch) => updateDay(i, patch)}
              onRemove={isMultiDay && days.length > 1 ? () => removeDay(i) : undefined}
            />
          ))}
          {isMultiDay ? (
            <button
              type="button"
              onClick={addDay}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--border-strong)] text-[13px] font-medium text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]"
            >
              <Plus size={14} />
              Add day
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="text-[13px] text-[#EF4444]" role="alert">
            <AlertTriangle size={13} className="mr-1.5 inline-block" />
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/events"
            className="inline-flex min-h-[36px] items-center px-3 py-1.5 text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !orgId}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--ezxs-gradient-money)' }}
          >
            <Save size={16} />
            {submitting ? 'Creating…' : 'Create event'}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--ink-900);
          font-size: 13px;
          line-height: 1.4;
        }
        .input:focus {
          outline: 2px solid var(--ink-700);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function DayRow({
  index,
  total,
  day,
  onChange,
  onRemove,
}: {
  index: number;
  total: number;
  day: DayDraft;
  onChange: (patch: Partial<DayDraft>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          <Calendar size={12} />
          {total > 1 ? `Day ${index + 1}` : 'Doors'}
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-400)] hover:bg-[var(--hover)] hover:text-[#EF4444]"
            aria-label={`Remove day ${index + 1}`}
          >
            <Trash2 size={12} />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Label" htmlFor={`label-${index}`}>
          <input
            id={`label-${index}`}
            value={day.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={total > 1 ? 'Friday' : 'Tonight'}
            className="input"
            required
          />
        </Field>
        <Field label="Date" htmlFor={`date-${index}`}>
          <input
            id={`date-${index}`}
            type="date"
            value={day.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="input"
            required
          />
        </Field>
        <Field label="Doors open" htmlFor={`starts-${index}`}>
          <input
            id={`starts-${index}`}
            type="datetime-local"
            value={day.starts_at}
            onChange={(e) => onChange({ starts_at: e.target.value })}
            className="input"
            required
          />
        </Field>
        <Field label="Doors close" htmlFor={`ends-${index}`}>
          <input
            id={`ends-${index}`}
            type="datetime-local"
            value={day.ends_at}
            onChange={(e) => onChange({ ends_at: e.target.value })}
            className="input"
            required
          />
        </Field>
        <Field label="Capacity" htmlFor={`cap-${index}`}>
          <input
            id={`cap-${index}`}
            type="number"
            min={1}
            value={day.capacity}
            onChange={(e) => onChange({ capacity: e.target.value })}
            className="input tabular-nums"
            required
          />
        </Field>
        <Field label="Re-entry policy" htmlFor={`reentry-${index}`}>
          <select
            id={`reentry-${index}`}
            value={day.reentry_policy}
            onChange={(e) =>
              onChange({ reentry_policy: e.target.value as ReentryPolicy })
            }
            className="input"
          >
            <option value="count_once_per_day">count_once_per_day</option>
            <option value="count_once_per_event">count_once_per_event</option>
            <option value="count_every_scan">count_every_scan</option>
            <option value="no_reentry">no_reentry</option>
          </select>
        </Field>
      </div>
      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink-900);
          font-size: 13px;
          line-height: 1.4;
        }
        .input:focus {
          outline: 2px solid var(--ink-700);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
