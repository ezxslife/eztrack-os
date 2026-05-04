'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Megaphone, Radio, ShieldAlert, UserCheck, Users } from 'lucide-react';
import {
  acceptShiftAssignment,
  approveShiftAssignment,
  fetchActiveEvent,
  fetchCurrentEventDay,
  fetchOpenDispatches,
  fetchPersonnel,
  fetchShiftAssignments,
  type DispatchLite,
  type EventDayRow,
  type EventRow,
  type PersonnelLite,
  type ShiftAssignmentRow,
} from '@/lib/queries/events';

const STATUS_COLOR: Record<ShiftAssignmentRow['status'], string> = {
  scheduled: 'var(--ink-400)',
  en_route: '#F59E0B',
  on_shift: '#34C759',
  break: '#F97316',
  off_shift: 'var(--ink-300)',
  no_show: '#EF4444',
};

// Crescat-style 3-state approval lifecycle (separate from runtime status).
const APPROVAL_COLOR: Record<NonNullable<ShiftAssignmentRow['approval_status']>, { bg: string; fg: string; label: string }> = {
  pending:  { bg: 'rgba(245, 158, 11, 0.18)', fg: '#F59E0B', label: 'PENDING' },
  approved: { bg: 'rgba(59, 130, 246, 0.18)', fg: '#3B82F6', label: 'APPROVED' },
  accepted: { bg: 'rgba(52, 199, 89, 0.18)',  fg: '#34C759', label: 'ACCEPTED' },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3B82F6',
};

export default function StaffPage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [day, setDay] = useState<EventDayRow | null>(null);
  const [personnel, setPersonnel] = useState<PersonnelLite[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignmentRow[]>([]);
  const [dispatches, setDispatches] = useState<DispatchLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyShiftId, setBusyShiftId] = useState<string | null>(null);

  const refreshShifts = useCallback(async (eventDayId: string) => {
    const sa = await fetchShiftAssignments(eventDayId);
    setAssignments(sa);
  }, []);

  async function handleApprove(shiftId: string) {
    if (!day) return;
    setBusyShiftId(shiftId);
    try {
      await approveShiftAssignment(shiftId);
      await refreshShifts(day.id);
    } finally {
      setBusyShiftId(null);
    }
  }

  async function handleAccept(shiftId: string) {
    if (!day) return;
    setBusyShiftId(shiftId);
    try {
      await acceptShiftAssignment(shiftId);
      await refreshShifts(day.id);
    } finally {
      setBusyShiftId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ev = await fetchActiveEvent();
      if (cancelled) return;
      setEvent(ev);
      const [staff, openDispatches, currentDay] = await Promise.all([
        fetchPersonnel(),
        fetchOpenDispatches(),
        ev ? fetchCurrentEventDay(ev.id) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setPersonnel(staff);
      setDispatches(openDispatches);
      setDay(currentDay);
      if (currentDay) {
        const sa = await fetchShiftAssignments(currentDay.id);
        if (!cancelled) setAssignments(sa);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading staff console…</span>
      </div>
    );
  }

  const personnelById = new Map(personnel.map((p) => [p.id, p]));
  const onShift = assignments.filter((a) => a.status === 'on_shift' || a.status === 'en_route');
  const upcoming = assignments.filter((a) => a.status === 'scheduled');
  const pendingApproval = assignments.filter((a) => (a.approval_status ?? 'pending') !== 'accepted');
  const dispatchOpen = dispatches.filter((d) => d.status !== 'closed' && d.status !== 'completed');

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            Staff Console
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            {event?.name ?? 'No event'} · {day?.label ?? 'No day'} · Personnel + Dispatch unified
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90"
          style={{ background: 'var(--ezxs-gradient-money)' }}
        >
          <Megaphone size={14} />
          Broadcast
        </button>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* On shift */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              On shift now
            </h2>
            <span className="text-[12px] tabular-nums text-[var(--ink-400)]">
              {onShift.length}
            </span>
          </header>
          {onShift.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
              No staff on shift. Schedule shifts via the eztrack-os Personnel module.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {onShift.map((a) => {
                const p = personnelById.get(a.personnel_id);
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span
                      className="h-2.5 w-2.5 flex-none rounded-full"
                      style={{ background: STATUS_COLOR[a.status] }}
                      aria-label={a.status}
                    />
                    <Users size={14} className="flex-none text-[var(--ink-400)]" />
                    <span className="flex-1 truncate text-[13px] text-[var(--ink-900)]">
                      {p?.full_name ?? 'Unknown'}{' '}
                      <span className="text-[var(--ink-500)]">· {a.role}</span>
                    </span>
                    <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
                      {new Date(a.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      –
                      {new Date(a.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Open dispatches */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Open dispatches
            </h2>
            <span className="text-[12px] tabular-nums text-[var(--ink-400)]">
              {dispatchOpen.length}
            </span>
          </header>
          {dispatchOpen.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
              No open dispatches.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {dispatchOpen.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Radio size={14} className="flex-none text-[var(--ink-400)]" />
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                    style={{ background: PRIORITY_COLOR[d.priority] ?? 'var(--ink-300)' }}
                  >
                    {d.priority}
                  </span>
                  <span className="flex-1 truncate text-[13px] text-[var(--ink-900)]">
                    {d.description ?? d.status}
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
                    {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Approval queue (Crescat 3-state) */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:col-span-2">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Approval queue
            </h2>
            <span className="text-[12px] tabular-nums text-[var(--ink-400)]">
              {pendingApproval.length}
            </span>
          </header>
          {pendingApproval.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
              All shifts approved + accepted.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {pendingApproval.map((a) => {
                const p = personnelById.get(a.personnel_id);
                const apv = a.approval_status ?? 'pending';
                const c = APPROVAL_COLOR[apv];
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: c.bg, color: c.fg }}
                    >
                      {c.label}
                    </span>
                    <span className="flex-1 truncate text-[13px] text-[var(--ink-900)]">
                      {p?.full_name ?? 'Unknown'}{' '}
                      <span className="text-[var(--ink-500)]">· {a.role}</span>
                    </span>
                    {apv === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleApprove(a.id)}
                        disabled={busyShiftId === a.id}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-[#3B82F6] px-3 py-1 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {busyShiftId === a.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Check size={11} />
                        )}
                        Approve
                      </button>
                    ) : null}
                    {apv === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => handleAccept(a.id)}
                        disabled={busyShiftId === a.id}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-[#34C759] px-3 py-1 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {busyShiftId === a.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Check size={11} />
                        )}
                        Mark accepted
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Upcoming shifts */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:col-span-2">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Upcoming shifts (today)
            </h2>
            <span className="text-[12px] tabular-nums text-[var(--ink-400)]">{upcoming.length}</span>
          </header>
          {upcoming.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
              {day
                ? 'Nothing scheduled. Use eztrack-os Personnel + Dispatch to roster shifts.'
                : 'No active event day.'}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {upcoming.map((a) => {
                const p = personnelById.get(a.personnel_id);
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                    <UserCheck size={14} className="flex-none text-[var(--ink-400)]" />
                    <span className="flex-1 truncate text-[13px] text-[var(--ink-900)]">
                      {p?.full_name ?? 'Unknown'}{' '}
                      <span className="text-[var(--ink-500)]">· {a.role}</span>
                    </span>
                    <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
                      starts{' '}
                      {new Date(a.starts_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Roster (org) */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:col-span-2">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              Workspace roster
            </h2>
            <span className="text-[12px] tabular-nums text-[var(--ink-400)]">
              {personnel.length}
            </span>
          </header>
          {personnel.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
              No personnel in this workspace.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-2 md:grid-cols-3">
              {personnel.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                >
                  <ShieldAlert size={14} className="flex-none text-[var(--ink-400)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">
                      {p.full_name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--ink-400)]">
                      {p.role} · {p.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
