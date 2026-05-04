'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Calendar, Save } from 'lucide-react';
import Link from 'next/link';
import {
  createEvent,
  fetchCurrentOrgId,
  slugify,
  type EventRow,
} from '@/lib/queries/events';

type FormStatus = Extract<EventRow['status'], 'draft' | 'on_sale' | 'live'>;

function defaultStartIso(): string {
  // Default: 1 hour from now, rounded down to the nearest 15 minutes
  const d = new Date(Date.now() + 60 * 60_000);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 15));
  return toLocalIsoForInput(d);
}

function defaultEndIso(): string {
  const d = new Date(Date.now() + 5 * 60 * 60_000);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 15));
  return toLocalIsoForInput(d);
}

/** Format a Date for an `<input type="datetime-local">` (no Z, no seconds). */
function toLocalIsoForInput(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewEventPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugDirty, setSlugDirty] = useState(false);
  const [startsAt, setStartsAt] = useState(defaultStartIso());
  const [endsAt, setEndsAt] = useState(defaultEndIso());
  const [capacity, setCapacity] = useState('200');
  const [status, setStatus] = useState<FormStatus>('live');
  const [reentry, setReentry] = useState<
    'count_once_per_day' | 'count_once_per_event' | 'count_every_scan' | 'no_reentry'
  >('count_once_per_day');

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

  // Auto-generate slug from name unless the operator has typed in the slug field.
  useEffect(() => {
    if (!slugDirty) setSlug(slugify(name));
  }, [name, slugDirty]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orgId) {
      setError('Workspace not loaded yet — try again in a moment.');
      return;
    }
    if (!name.trim()) {
      setError('Give the event a name.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required (lowercase, dashes only).');
      return;
    }
    const cap = parseInt(capacity, 10);
    if (Number.isNaN(cap) || cap <= 0) {
      setError('Capacity must be a positive number.');
      return;
    }
    const startMs = new Date(startsAt).getTime();
    const endMs = new Date(endsAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setError('Start and end must be valid dates.');
      return;
    }
    if (endMs <= startMs) {
      setError('Doors close must be after doors open.');
      return;
    }

    setSubmitting(true);
    try {
      const ev = await createEvent({
        org_id: orgId,
        name: name.trim(),
        slug: slug.trim(),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        capacity: cap,
        status,
        reentry_policy: reentry,
      });
      router.push(ev.status === 'live' ? '/live' : '/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event.');
      setSubmitting(false);
    }
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
            Single-day for now. Multi-day editor lands in L3.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        {orgError ? (
          <div className="mb-3 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-[13px] text-[#EF4444]">
            <AlertTriangle size={13} className="mr-1.5 inline-block" />
            {orgError}
          </div>
        ) : null}

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
          <Field label="Doors open" htmlFor="starts_at" icon={Calendar}>
            <input
              id="starts_at"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Doors close" htmlFor="ends_at" icon={Calendar}>
            <input
              id="ends_at"
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Capacity" htmlFor="capacity">
            <input
              id="capacity"
              type="number"
              min={1}
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="input tabular-nums"
            />
          </Field>
          <Field label="Status" htmlFor="status">
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
          <Field label="Re-entry policy" htmlFor="reentry" wide>
            <select
              id="reentry"
              value={reentry}
              onChange={(e) => setReentry(e.target.value as typeof reentry)}
              className="input"
            >
              <option value="count_once_per_day">
                count_once_per_day · re-scans = re-entry (default)
              </option>
              <option value="count_once_per_event">count_once_per_event</option>
              <option value="count_every_scan">count_every_scan · festivals</option>
              <option value="no_reentry">no_reentry · red banner on rescan</option>
            </select>
          </Field>
        </div>

        {error ? (
          <p className="mt-4 text-[13px] text-[#EF4444]" role="alert">
            <AlertTriangle size={13} className="mr-1.5 inline-block" />
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
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

      <style jsx>{`
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

function Field({
  label,
  htmlFor,
  icon: Icon,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  icon?: typeof Calendar;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label
        htmlFor={htmlFor}
        className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]"
      >
        {Icon ? <Icon size={11} /> : null}
        {label}
      </label>
      {children}
    </div>
  );
}
