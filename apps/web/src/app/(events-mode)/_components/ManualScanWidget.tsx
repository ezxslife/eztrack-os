'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, UserCheck } from 'lucide-react';
import {
  searchTickets,
  triggerManualCheckIn,
  type TicketSearchResult,
} from '@/lib/queries/events';

const RESULT_COLOR: Record<string, { bg: string; label: string }> = {
  success: { bg: '#34C759', label: 'CHECKED IN' },
  already_scanned: { bg: '#F59E0B', label: 'RE-ENTRY' },
  invalid: { bg: '#EF4444', label: 'INVALID' },
  expired: { bg: '#EF4444', label: 'EXPIRED' },
  wrong_day: { bg: '#F97316', label: 'WRONG DAY' },
  wrong_event: { bg: '#EF4444', label: 'WRONG EVENT' },
};

interface BannerState {
  bg: string;
  label: string;
  detail: string;
}

export function ManualScanWidget({
  orgId,
  eventId,
}: {
  orgId: string;
  eventId: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TicketSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submittingTicketId, setSubmittingTicketId] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchTickets(eventId, query);
        setResults(found);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed.');
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, eventId]);

  async function handleManualCheckIn(ticketId: string) {
    setSubmittingTicketId(ticketId);
    setError(null);
    try {
      const res = await triggerManualCheckIn({
        org_id: orgId,
        event_id: eventId,
        ticket_id: ticketId,
        location: 'Manual lookup',
      });
      if (!res.ok) {
        setError(res.error ?? 'Manual check-in failed.');
        setBanner({ bg: '#EF4444', label: 'FAILED', detail: res.error ?? 'unknown' });
        return;
      }
      const result = res.result ?? 'success';
      const color = RESULT_COLOR[result] ?? RESULT_COLOR.invalid;
      const detail =
        res.ticket?.tier
          ? `${res.ticket.tier}${res.entry_number && res.entry_number > 1 ? ` · entry ${res.entry_number}` : ''}`
          : '';
      setBanner({ bg: color.bg, label: color.label, detail });
      setQuery('');
      setResults([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Manual check-in failed.');
    } finally {
      setSubmittingTicketId(null);
    }
  }

  // Auto-clear banner after 6s
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(t);
  }, [banner]);

  return (
    <section
      aria-label="Manual scan"
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
    >
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Manual lookup
        </h2>
        <span className="text-[11px] uppercase tracking-wider text-[var(--ink-400)]">
          Will-call · MANUAL
        </span>
      </header>

      <div className="px-5 py-3">
        <div className="relative">
          <Search
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, or ticket ID"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-[14px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] focus:border-[var(--ink-700)]"
            aria-label="Manual scan search"
          />
          {searching ? (
            <Loader2
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--ink-400)]"
            />
          ) : null}
        </div>
        {error ? (
          <p className="mt-2 text-[12px] text-[#EF4444]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {banner ? (
        <div
          role="status"
          className="flex items-center gap-2 px-5 py-3 text-white"
          style={{ background: banner.bg }}
        >
          <UserCheck size={16} />
          <span className="text-[13px] font-bold uppercase tracking-wider">
            {banner.label}
          </span>
          {banner.detail ? (
            <span className="ml-auto text-[12px] tabular-nums opacity-80">{banner.detail}</span>
          ) : null}
        </div>
      ) : null}

      {results.length > 0 ? (
        <ul className="max-h-72 divide-y divide-[var(--border)] overflow-y-auto">
          {results.map((r) => (
            <li
              key={r.ticket_id}
              className="flex items-center gap-3 px-5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">
                  {r.customer_first_name || r.customer_last_name
                    ? `${r.customer_first_name ?? ''} ${r.customer_last_name ?? ''}`.trim()
                    : r.customer_email ?? r.external_id ?? 'Unknown'}
                </p>
                <p className="truncate text-[11px] text-[var(--ink-400)]">
                  {r.tier} · {r.state}
                  {r.external_id ? ` · ${r.external_id}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleManualCheckIn(r.ticket_id)}
                disabled={submittingTicketId === r.ticket_id || r.state !== 'valid'}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{
                  background: r.state === 'valid' ? '#34C759' : 'var(--ink-300)',
                }}
              >
                {submittingTicketId === r.ticket_id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <UserCheck size={12} />
                )}
                Check in
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim() && !searching ? (
        <p className="px-5 py-4 text-center text-[13px] text-[var(--ink-400)]">
          No matches. Tip: search by full name, email, or Eventbrite ticket ID.
        </p>
      ) : null}
    </section>
  );
}
