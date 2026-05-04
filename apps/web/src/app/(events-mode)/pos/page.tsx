'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  CheckCircle2,
  Loader2,
  Mail,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import {
  createPosSale,
  fetchActiveEvent,
  fetchEventDays,
  fetchLatestCapacitySnapshot,
  fetchCurrentEventDay,
  tierDefinitionsFor,
  type CapacitySnapshotRow,
  type EventDayRow,
  type EventRow,
  type PosSaleResult,
  type PosTier,
} from '@/lib/queries/events';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface CompletionState {
  tier: string;
  price_cents: number;
  result: PosSaleResult['result'] | undefined;
  email?: string | null;
  receipt_email_status?: PosSaleResult['receipt_email_status'];
  pass_label?: string | null;
}

/**
 * Day-pass picker option:
 *   - { kind: 'all' }            → multi-day pass; valid_for_days = null
 *   - { kind: 'single', day }    → single-day pass; valid_for_days = [day.id],
 *                                   auto-checkin pinned to that day.
 */
type DayPick = { kind: 'all' } | { kind: 'single'; day: EventDayRow };

/**
 * /pos — walk-up sales with auto check-in. Cash mode only in v1; Stripe
 * Terminal + Square land in L2.5.
 */
export default function PosPage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [eventDay, setEventDay] = useState<EventDayRow | null>(null);
  const [days, setDays] = useState<EventDayRow[]>([]);
  const [dayPick, setDayPick] = useState<DayPick>({ kind: 'all' });
  const [snapshot, setSnapshot] = useState<CapacitySnapshotRow | null>(null);
  const [tiers, setTiers] = useState<PosTier[]>([]);
  const [submitting, setSubmitting] = useState<PosTier | null>(null);
  const [email, setEmail] = useState('');
  const [completion, setCompletion] = useState<CompletionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshHeader = useCallback(async () => {
    const ev = await fetchActiveEvent();
    setEvent(ev);
    if (!ev) {
      setLoading(false);
      return;
    }
    setTiers(tierDefinitionsFor(ev));
    const [ed, allDays] = await Promise.all([
      fetchCurrentEventDay(ev.id),
      ev.is_multi_day ? fetchEventDays(ev.id) : Promise.resolve([]),
    ]);
    setEventDay(ed);
    setDays(allDays);
    // Default the picker to the active day on multi-day events so a tap
    // through still sells the right pass; operator can switch to "All days".
    if (ev.is_multi_day && ed) setDayPick({ kind: 'single', day: ed });
    else setDayPick({ kind: 'all' });
    if (ed) setSnapshot(await fetchLatestCapacitySnapshot(ed.id));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshHeader();
  }, [refreshHeader]);

  // Live capacity update: when /pos drives auto-checkins, the bar moves.
  useRealtimeSubscription({
    table: 'capacity_snapshots',
    filter: eventDay ? `event_day_id=eq.${eventDay.id}` : undefined,
    enabled: !!eventDay,
    onInsert: (row) => setSnapshot(row as unknown as CapacitySnapshotRow),
  });

  async function handleSell(tier: PosTier) {
    if (!event) return;
    setError(null);
    setCompletion(null);
    setSubmitting(tier);
    try {
      const validForDays =
        dayPick.kind === 'single' ? [dayPick.day.id] : null;
      const autoCheckinDayId =
        dayPick.kind === 'single' ? dayPick.day.id : null;
      const passLabel =
        dayPick.kind === 'single'
          ? `Day ${dayPick.day.day_index} · ${dayPick.day.label}`
          : event.is_multi_day
            ? 'All days'
            : null;
      const res = await createPosSale({
        org_id: event.org_id,
        event_id: event.id,
        tier: tier.name,
        price_cents: tier.price_cents,
        email: email.trim() || null,
        device: 'iPad-POS',
        valid_for_days: validForDays,
        auto_checkin_day_id: autoCheckinDayId,
      });
      if (!res.ok) {
        setError(res.error ?? 'Sale failed.');
        return;
      }
      setCompletion({
        tier: tier.name,
        price_cents: tier.price_cents,
        result: res.result,
        email: email.trim() || null,
        receipt_email_status: res.receipt_email_status,
        pass_label: passLabel,
      });
      setEmail('');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading POS…</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <Ticket size={26} className="text-[var(--ink-400)]" />
        <h1 className="text-[22px] font-bold text-[var(--ink-900)]">No event live</h1>
        <p className="text-[14px] text-[var(--ink-500)]">
          Set an event to <code className="font-mono">status=live</code> on{' '}
          <Link href="/events" className="underline">/events</Link> to take walk-up sales.
        </p>
      </div>
    );
  }

  const checkedIn = snapshot?.checked_in ?? 0;
  const capacity = eventDay?.capacity ?? event.capacity ?? 0;
  const remaining = Math.max(0, capacity - checkedIn);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            Walk-up POS
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            {event.name} · {eventDay?.label ?? 'No day in progress'}
            {' · '}auto check-in on
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
            Remaining
          </p>
          <p className="text-[22px] font-bold tabular-nums text-[var(--ink-900)]">
            {remaining.toLocaleString()}
          </p>
        </div>
      </header>

      {/* Day-pass picker (multi-day events only) */}
      {event.is_multi_day && days.length > 0 ? (
        <section
          aria-label="Day pass picker"
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
            Pass type
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDayPick({ kind: 'all' })}
              aria-pressed={dayPick.kind === 'all'}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                dayPick.kind === 'all'
                  ? 'border-[var(--ink-700)] bg-[var(--surface-2)] text-[var(--ink-900)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-500)] hover:bg-[var(--hover)]'
              }`}
            >
              All days
              <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
                ({days.length})
              </span>
            </button>
            {days.map((d) => {
              const active = dayPick.kind === 'single' && dayPick.day.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayPick({ kind: 'single', day: d })}
                  aria-pressed={active}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                    active
                      ? 'border-[var(--ink-700)] bg-[var(--surface-2)] text-[var(--ink-900)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-500)] hover:bg-[var(--hover)]'
                  }`}
                >
                  Day {d.day_index}
                  <span className="text-[11px] text-[var(--ink-400)]">· {d.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-[var(--ink-400)]">
            {dayPick.kind === 'all'
              ? 'Sells a multi-day pass valid for every day of the festival.'
              : `Sells a single-day pass valid only for Day ${dayPick.day.day_index}; auto check-in pins to that day.`}
          </p>
        </section>
      ) : null}

      {/* Email receipt (optional) */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <label
          htmlFor="receipt-email"
          className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]"
        >
          <Mail size={11} />
          Receipt email (optional)
        </label>
        <input
          id="receipt-email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[14px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] focus:border-[var(--ink-700)]"
        />
        <p className="mt-1 text-[11px] text-[var(--ink-400)]">
          When provided, creates a Customer row, attaches it to the order, and queues a receipt
          via the email_outbox worker (Resend/SendGrid; graceful no-op until a provider key is set).
        </p>
      </section>

      {/* Tier buttons */}
      <section
        aria-label="Tier picker"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {tiers.map((tier) => {
          const isSubmitting = submitting?.name === tier.name;
          return (
            <button
              key={tier.name}
              type="button"
              onClick={() => void handleSell(tier)}
              disabled={!!submitting || remaining <= 0}
              className="group flex min-h-[88px] flex-col items-start justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex w-full items-center justify-between text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
                <span className="inline-flex items-center gap-1">
                  <Banknote size={12} />
                  {tier.name}
                </span>
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              </span>
              <span className="mt-1 text-[36px] font-bold leading-none tabular-nums text-[var(--ink-900)]">
                ${(tier.price_cents / 100).toFixed(2)}
              </span>
              <span className="mt-1 text-[12px] text-[var(--ink-500)]">
                Tap to sell + auto check-in
              </span>
            </button>
          );
        })}
      </section>

      {/* Completion banner */}
      {completion ? (
        <section
          role="status"
          aria-live="polite"
          className="overflow-hidden rounded-2xl border-2 border-[#34C759] p-5"
          style={{ background: 'rgba(52, 199, 89, 0.08)' }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="flex-none text-[#34C759]" />
            <div className="flex-1">
              <h2 className="text-[16px] font-bold text-[var(--ink-900)]">
                Sold {completion.tier}{' '}
                <span className="text-[var(--ink-500)]">
                  · ${(completion.price_cents / 100).toFixed(2)}
                </span>
                {completion.pass_label ? (
                  <span className="ml-2 rounded-full bg-[var(--surface-2)] px-2 py-0.5 align-middle text-[11px] font-semibold text-[var(--ink-700)]">
                    {completion.pass_label}
                  </span>
                ) : null}
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--ink-500)]">
                {completion.result === 'success'
                  ? 'Auto-checked in. Capacity bar updated.'
                  : completion.result === 'already_scanned'
                    ? 'Already scanned today (re-entry).'
                    : completion.result === 'wrong_day'
                      ? 'Wrong day for ticket.'
                      : 'Check-in pending.'}
                {completion.email
                  ? completion.receipt_email_status === 'queued'
                    ? ` Receipt queued for ${completion.email}.`
                    : completion.receipt_email_status === 'failed'
                      ? ` Receipt enqueue failed for ${completion.email} — retry from /events.`
                      : ` Customer attached: ${completion.email}.`
                  : ''}
              </p>
              <p className="mt-2 text-[11px] text-[var(--ink-400)]">
                <TrendingUp size={11} className="mr-1 inline-block" />
                Order back-flows to ezxs-settle Income via the shared `orders` row.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="text-[13px] text-[#EF4444]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
