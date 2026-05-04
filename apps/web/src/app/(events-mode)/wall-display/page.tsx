'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Monitor,
  RefreshCw,
  Tv,
  XCircle,
} from 'lucide-react';
import {
  createWallDisplayCode,
  fetchActiveEvent,
  fetchEvents,
  fetchWallDisplaySessions,
  revokeWallDisplaySession,
  type EventRow,
  type WallDisplaySessionRow,
} from '@/lib/queries/events';

const REFRESH_MS = 5_000;

export default function WallDisplayAdminPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<WallDisplaySessionRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [code, setCode] = useState<{
    code: string;
    expires_at: string;
    event_name: string;
  } | null>(null);
  const [deviceLabel, setDeviceLabel] = useState('Production trailer iPad');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load: events + default selection
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [list, active] = await Promise.all([fetchEvents(), fetchActiveEvent()]);
      if (cancelled) return;
      setEvents(list);
      const initial = active?.id ?? list[0]?.id ?? null;
      setEventId(initial);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSessions = useCallback(async () => {
    if (!eventId) return;
    const rows = await fetchWallDisplaySessions(eventId);
    setSessions(rows);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    void loadSessions();
    const t = setInterval(loadSessions, REFRESH_MS);
    return () => clearInterval(t);
  }, [eventId, loadSessions]);

  async function handleGenerate() {
    if (!eventId) return;
    setError(null);
    setGenerating(true);
    try {
      const res = await createWallDisplayCode({
        event_id: eventId,
        device_label: deviceLabel.trim() || undefined,
      });
      if (!res.ok || !res.pairing_code || !res.expires_at) {
        setError(res.error ?? 'Could not generate a pairing code.');
        return;
      }
      setCode({
        code: res.pairing_code,
        expires_at: res.expires_at,
        event_name: res.event?.name ?? 'event',
      });
      void loadSessions();
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(sessionId: string) {
    setError(null);
    setRevokingId(sessionId);
    try {
      const res = await revokeWallDisplaySession(sessionId);
      if (!res.ok) setError(res.error ?? 'Revoke failed.');
      void loadSessions();
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
          Wall display
        </h1>
        <p className="text-[14px] text-[var(--ink-500)]">
          Pair a kiosk to one event with a short-lived 6-digit code. The kiosk runs
          read-only; revoke any time.
        </p>
      </header>

      {/* Event selector + generate */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Generate pairing code
        </h2>
        {loading ? (
          <p className="mt-3 text-[13px] text-[var(--ink-400)]">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="mt-3 text-[13px] text-[var(--ink-400)]">
            Create an event first.
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]"
                >
                  Event
                </label>
                <select
                  id="event"
                  value={eventId ?? ''}
                  onChange={(e) => setEventId(e.target.value || null)}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} · {ev.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="device"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]"
                >
                  Device label
                </label>
                <input
                  id="device"
                  value={deviceLabel}
                  onChange={(e) => setDeviceLabel(e.target.value)}
                  placeholder="Production trailer iPad"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !eventId}
              className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--ezxs-gradient-money)' }}
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Tv size={16} />}
              {generating ? 'Generating…' : 'Generate pairing code'}
            </button>
            {error ? (
              <p className="mt-3 text-[13px] text-[#EF4444]" role="alert">
                <AlertTriangle size={13} className="mr-1.5 inline-block" />
                {error}
              </p>
            ) : null}
          </>
        )}
      </section>

      {/* Generated code display */}
      {code ? (
        <section
          className="rounded-2xl border-2 border-[#34C759] p-6 text-center"
          style={{ background: 'rgba(52, 199, 89, 0.06)' }}
          aria-live="polite"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Pairing code · {code.event_name}
          </p>
          <p
            className="mt-2 font-mono text-[64px] font-extrabold leading-none tabular-nums text-[var(--ink-900)]"
            aria-label={`Pairing code ${code.code.split('').join(' ')}`}
          >
            {code.code.slice(0, 3)} {code.code.slice(3)}
          </p>
          <CountdownTo expiresAt={code.expires_at} />
          <p className="mt-3 text-[12px] text-[var(--ink-500)]">
            Open the wall-display app on the kiosk and enter this code.
          </p>
        </section>
      ) : null}

      {/* Active sessions */}
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Active sessions
          </h2>
          <button
            type="button"
            onClick={() => void loadSessions()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </header>
        {sessions.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
            No active sessions for this event.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                onRevoke={handleRevoke}
                revoking={revokingId === s.id}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SessionRow({
  session,
  onRevoke,
  revoking,
}: {
  session: WallDisplaySessionRow;
  onRevoke: (id: string) => void;
  revoking: boolean;
}) {
  const paired = !!session.paired_at;
  const expired = new Date(session.expires_at).getTime() <= Date.now();
  const status = expired ? 'expired' : paired ? 'paired' : 'awaiting pair';
  const statusColor = expired
    ? 'var(--ink-400)'
    : paired
      ? '#34C759'
      : '#F59E0B';
  const expiresLabel = new Date(session.expires_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const pairedLabel = session.paired_at
    ? new Date(session.paired_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <Monitor size={18} className="flex-none text-[var(--ink-400)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">
          {session.paired_device_label ?? 'Unpaired display'}
          <span
            className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(0,0,0,0.04)', color: statusColor }}
          >
            {status}
          </span>
        </p>
        <p className="truncate text-[11px] text-[var(--ink-400)]">
          Code{' '}
          <span className="font-mono tabular-nums text-[var(--ink-700)]">
            {session.pairing_code}
          </span>
          {' · '}
          expires {expiresLabel}
          {pairedLabel ? ` · paired ${pairedLabel}` : ''}
        </p>
      </div>
      {!expired ? (
        <button
          type="button"
          onClick={() => onRevoke(session.id)}
          disabled={revoking}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[12px] font-medium text-[#EF4444] hover:border-[#EF4444] disabled:opacity-50"
        >
          {revoking ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <XCircle size={12} />
          )}
          Revoke
        </button>
      ) : null}
    </li>
  );
}

function CountdownTo({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const min = Math.floor(remaining / 60_000);
  const sec = Math.floor((remaining % 60_000) / 1000);
  return (
    <p className="mt-1 text-[12px] tabular-nums text-[var(--ink-500)]">
      Expires in {min}:{sec.toString().padStart(2, '0')}
    </p>
  );
}
