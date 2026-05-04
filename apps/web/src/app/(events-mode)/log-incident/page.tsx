'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import {
  createEventIncident,
  fetchActiveEvent,
  fetchCurrentEventDay,
  INCIDENT_TYPES,
  type EventDayRow,
  type EventRow,
  type IncidentSeverity,
} from '@/lib/queries/events';

export default function NewIncidentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventOverride = searchParams.get('event');

  const [event, setEvent] = useState<EventRow | null>(null);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState(INCIDENT_TYPES[0].value);
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [synopsis, setSynopsis] = useState('');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ev = await fetchActiveEvent();
      if (cancelled) return;
      setEvent(ev);
      if (ev) {
        const d = await fetchCurrentEventDay(ev.id);
        if (!cancelled) setDay(d);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventOverride]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!event) return setError('No active event.');
    if (!synopsis.trim()) return setError('Synopsis is required.');

    setSubmitting(true);
    try {
      const res = await createEventIncident({
        org_id: event.org_id,
        event_id: event.id,
        event_day_id: day?.id ?? null,
        incident_type: type,
        severity,
        synopsis: synopsis.trim(),
        description: description.trim() || undefined,
        reported_by: reportedBy.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? 'Could not log incident.');
        setSubmitting(false);
        return;
      }
      router.push(`/live`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log incident.');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-center gap-2">
        <Link
          href="/live"
          aria-label="Back to live"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            Log incident
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            {event ? (
              <>
                {event.name}
                {day ? ` · ${day.label}` : ''} · scoped to current event_day
              </>
            ) : (
              'No active event.'
            )}
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <Field label="Incident type" htmlFor="type">
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Severity" htmlFor="severity">
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'critical'] as IncidentSeverity[]).map((s) => {
              const colors: Record<IncidentSeverity, string> = {
                low: '#3B82F6',
                medium: '#F59E0B',
                high: '#F97316',
                critical: '#EF4444',
              };
              const active = severity === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider ${
                    active
                      ? 'border-transparent text-white'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-700)]'
                  }`}
                  style={active ? { background: colors[s] } : undefined}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Synopsis" htmlFor="synopsis">
          <input
            id="synopsis"
            required
            autoFocus
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="Patron in distress at door 2"
            className="input"
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
            rows={3}
            className="input resize-y"
          />
        </Field>

        <Field label="Reported by" htmlFor="reported_by">
          <input
            id="reported_by"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            placeholder="Door staff name (optional)"
            className="input"
          />
        </Field>

        {error ? (
          <p className="text-[13px] text-[#EF4444]" role="alert">
            <AlertTriangle size={13} className="mr-1.5 inline-block" />
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Link
            href="/live"
            className="inline-flex min-h-[36px] items-center px-3 py-1.5 text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !event}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ background: '#EF4444' }}
          >
            <ShieldAlert size={16} />
            {submitting ? 'Logging…' : 'Log incident'}
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

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
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
