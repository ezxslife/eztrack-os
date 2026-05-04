'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CalendarDays,
  Clock,
  Copy,
  DollarSign,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Ticket,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  addEventDay,
  cancelEvent,
  deleteEventDay,
  duplicateEvent,
  fetchEventBySlug,
  fetchEventDays,
  fetchEventIncidents,
  fetchEventMembers,
  fetchEventReport,
  fetchPersonnel,
  inviteEventMember,
  reinstateEvent,
  removeEventMember,
  slugify,
  sourceLabel,
  tierDefinitionsFor,
  updateEventDay,
  updateEventHoldDetails,
  updateEventLiveOpsConfig,
  updateEventMember,
  updateEventStatus,
  type EventDayRow,
  type EventMemberRow,
  type EventReport,
  type EventRow,
  type IncidentRow,
  type PersonnelLite,
  type PosTier,
} from '@/lib/queries/events';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [days, setDays] = useState<EventDayRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [report, setReport] = useState<EventReport | null>(null);
  const [members, setMembers] = useState<EventMemberRow[]>([]);
  const [orgPersonnel, setOrgPersonnel] = useState<PersonnelLite[]>([]);
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
    const [d, inc, rep, mem, allPersonnel] = await Promise.all([
      fetchEventDays(ev.id),
      fetchEventIncidents(ev.id),
      fetchEventReport(ev.id),
      fetchEventMembers(ev.id),
      fetchPersonnel(),
    ]);
    setDays(d);
    setIncidents(inc);
    setReport(rep);
    setMembers(mem);
    setOrgPersonnel(allPersonnel);
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

  async function handleCancel() {
    if (!event || busy) return;
    const reason = window.prompt('Why is this event being cancelled?', 'Promoter scheduling conflict');
    if (!reason) return;
    setBusy(true);
    try {
      const res = await cancelEvent({ event_id: event.id, reason });
      if (res.ok) {
        await refresh();
        setToast('Event cancelled. Data preserved for reinstatement.');
      } else {
        setToast(`Failed: ${res.error ?? 'unknown'}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReinstate() {
    if (!event || busy) return;
    if (!window.confirm('Reinstate this event? Status will be set to draft.')) return;
    setBusy(true);
    try {
      const res = await reinstateEvent({ event_id: event.id, next_status: 'draft' });
      if (res.ok) {
        await refresh();
        setToast('Event reinstated. Status → draft.');
      } else {
        setToast(`Failed: ${res.error ?? 'unknown'}`);
      }
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

      {/* Hold banner (status='hold') */}
      {event.status === 'hold' ? (
        <HoldDetails
          event={event}
          busy={busy}
          onSaved={async () => {
            await refresh();
            setToast('Hold details saved');
          }}
        />
      ) : null}

      {/* Cancellation banner */}
      {event.cancelled_at ? (
        <section
          role="status"
          className="rounded-2xl border-2 border-[#EF4444] p-4"
          style={{ background: 'rgba(239, 68, 68, 0.08)' }}
        >
          <div className="flex items-start gap-3">
            <Ban size={18} className="flex-none text-[#EF4444]" />
            <div className="flex-1">
              <h2 className="text-[14px] font-bold text-[#EF4444]">
                Cancelled {new Date(event.cancelled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </h2>
              {event.cancellation_reason ? (
                <p className="mt-0.5 text-[13px] text-[var(--ink-700)]">
                  Reason: {event.cancellation_reason}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-[var(--ink-400)]">
                Data is preserved. Reinstate to restore operations.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReinstate}
              disabled={busy}
              className="inline-flex min-h-[36px] flex-none items-center gap-1 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-900)] hover:bg-[var(--hover)] disabled:opacity-50"
            >
              <RotateCcw size={12} />
              Reinstate
            </button>
          </div>
        </section>
      ) : null}

      {/* Status switcher */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Status
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['draft', 'on_sale', 'live', 'sold_out', 'hold', 'past'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatus(s)}
              disabled={busy || event.status === s || !!event.cancelled_at}
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
        {!event.cancelled_at ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="mt-3 inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#EF4444]/30 bg-transparent px-3 py-1.5 text-[12px] font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 disabled:opacity-50"
          >
            <Ban size={12} />
            Cancel event…
          </button>
        ) : null}
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

      {/* Members (per-event scoped access) */}
      <MembersSection
        event={event}
        members={members}
        orgPersonnel={orgPersonnel}
        busy={busy}
        onChange={async () => {
          await refresh();
          setToast('Members updated');
        }}
      />

      {/* Duplicate event */}
      <DuplicateSection
        event={event}
        days={days}
        busy={busy}
        onDuplicated={(newSlug) => router.push(`/events/${newSlug}`)}
      />

      {/* Post-event / live report */}
      {report ? <ReportSection report={report} /> : null}

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

function HoldDetails({
  event,
  busy,
  onSaved,
}: {
  event: EventRow;
  busy: boolean;
  onSaved: () => void;
}) {
  const [rank, setRank] = useState(String(event.hold_rank ?? 1));
  const [expires, setExpires] = useState(() => {
    if (event.hold_expires_at) {
      const d = new Date(event.hold_expires_at);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    // Default: 7 days from now
    const d = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving || busy) return;
    const r = parseInt(rank, 10);
    if (Number.isNaN(r) || r < 1) return;
    setSaving(true);
    try {
      await updateEventHoldDetails({
        event_id: event.id,
        hold_rank: r,
        hold_expires_at: new Date(expires).toISOString(),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const expiresLabel = event.hold_expires_at
    ? new Date(event.hold_expires_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <section
      className="rounded-2xl border-2 p-5"
      style={{ borderColor: '#A855F7', background: 'rgba(168, 85, 247, 0.06)' }}
    >
      <div className="flex items-start gap-3">
        <Clock size={18} className="flex-none text-[#A855F7]" />
        <div className="flex-1">
          <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#A855F7]">
            On Hold {event.hold_rank ? `· #${event.hold_rank}` : ''}
            {expiresLabel ? ` · expires ${expiresLabel}` : ''}
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">
            Date held for a buyer pending confirmation. Multiple holds stack by rank
            (1 = first refusal). Auto-releases at expiry (v1.5 worker).
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr_auto]">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
            Rank
          </label>
          <input
            type="number"
            min={1}
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] tabular-nums text-[var(--ink-900)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
            Expires at
          </label>
          <input
            type="datetime-local"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || busy}
          className="mt-auto inline-flex h-10 items-center gap-1 rounded-lg bg-[#A855F7] px-3 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save hold
        </button>
      </div>
    </section>
  );
}

function MembersSection({
  event,
  members,
  orgPersonnel,
  busy,
  onChange,
}: {
  event: EventRow;
  members: EventMemberRow[];
  orgPersonnel: PersonnelLite[];
  busy: boolean;
  onChange: () => void;
}) {
  const [invitee, setInvitee] = useState('');
  const [role, setRole] = useState('producer');
  const [writePerm, setWritePerm] = useState(false);
  const [inTimeline, setInTimeline] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const candidates = orgPersonnel.filter((p) => !memberUserIds.has(p.id));

  async function handleInvite() {
    if (!invitee || submitting) return;
    setSubmitting(true);
    try {
      const res = await inviteEventMember({
        event_id: event.id,
        user_id: invitee,
        role,
        write_permission: writePerm,
        in_timeline: inTimeline,
      });
      if (res.ok) {
        setInvitee('');
        setRole('producer');
        setWritePerm(false);
        setInTimeline(false);
        onChange();
      } else {
        // surface error
        console.error(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleWrite(memberId: string, current: boolean) {
    await updateEventMember(memberId, { write_permission: !current });
    onChange();
  }

  async function handleToggleTimeline(memberId: string, current: boolean) {
    await updateEventMember(memberId, { in_timeline: !current });
    onChange();
  }

  async function handleRemove(memberId: string) {
    if (!window.confirm('Remove this member? They lose access to this event.')) return;
    await removeEventMember(memberId);
    onChange();
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Event members · {members.length}
        </h2>
        <span className="text-[11px] text-[var(--ink-400)]">
          per-event scoped access
        </span>
      </div>

      {members.length === 0 ? (
        <p className="mt-3 text-[13px] text-[var(--ink-400)]">
          No outside producers / freelancers yet. Org members already have access via
          regular RLS.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <Users size={14} className="flex-none text-[var(--ink-400)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">
                  {m.profile?.full_name ?? 'Unknown'}{' '}
                  <span className="text-[var(--ink-500)]">· {m.role}</span>
                </p>
                <p className="truncate text-[11px] text-[var(--ink-400)]">
                  {m.profile?.email ?? '—'}
                  {m.accepted_at ? ` · accepted ${new Date(m.accepted_at).toLocaleDateString()}` : ' · invited'}
                </p>
              </div>
              <Toggle
                on={m.write_permission}
                onChange={() => handleToggleWrite(m.id, m.write_permission)}
                disabled={busy}
              />
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-400)]">
                Write
              </span>
              <Toggle
                on={m.in_timeline}
                onChange={() => handleToggleTimeline(m.id, m.in_timeline)}
                disabled={busy}
              />
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-400)]">
                In RoS
              </span>
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                disabled={busy}
                className="text-[var(--ink-400)] hover:text-[#EF4444]"
                aria-label="Remove member"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Invite form */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <select
          value={invitee}
          onChange={(e) => setInvitee(e.target.value)}
          disabled={candidates.length === 0 || submitting}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
        >
          <option value="">
            {candidates.length === 0 ? 'No candidates left' : 'Pick from org…'}
          </option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} ({p.role})
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
        >
          <option value="producer">Producer</option>
          <option value="freelancer">Freelancer</option>
          <option value="guest">Guest</option>
          <option value="vendor">Vendor</option>
        </select>
        <label className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[12px] text-[var(--ink-700)]">
          <input
            type="checkbox"
            checked={writePerm}
            onChange={(e) => setWritePerm(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#34C759]"
          />
          Can write
        </label>
        <button
          type="button"
          onClick={handleInvite}
          disabled={!invitee || submitting}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--ink-700)] px-3 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
          Invite
        </button>
      </div>
    </section>
  );
}

function DuplicateSection({
  event,
  days,
  busy,
  onDuplicated,
}: {
  event: EventRow;
  days: EventDayRow[];
  busy: boolean;
  onDuplicated: (newSlug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${event.name} (copy)`);
  const [slug, setSlug] = useState(`${event.slug}-copy`);
  const [slugDirty, setSlugDirty] = useState(false);
  const defaultStart = days[0]
    ? new Date(new Date(days[0].starts_at).getTime() + 7 * 24 * 60 * 60_000)
    : new Date();
  defaultStart.setSeconds(0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const initialIso = `${defaultStart.getFullYear()}-${pad(defaultStart.getMonth() + 1)}-${pad(defaultStart.getDate())}T${pad(defaultStart.getHours())}:${pad(defaultStart.getMinutes())}`;
  const [newStart, setNewStart] = useState(initialIso);
  const [copyRos, setCopyRos] = useState(true);
  const [copyShifts, setCopyShifts] = useState(true);
  const [copyTiers, setCopyTiers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugDirty) setSlug(slugify(name));
  }, [name, slugDirty]);

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required.');
      return;
    }
    if (Number.isNaN(new Date(newStart).getTime())) {
      setError('First-day start time is invalid.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await duplicateEvent({
        source_event_id: event.id,
        new_name: name.trim(),
        new_slug: slug.trim(),
        new_first_day_starts_at: new Date(newStart).toISOString(),
        copy_running_order: copyRos,
        copy_shifts: copyShifts,
        copy_tier_definitions: copyTiers,
      });
      if (!res.ok || !res.slug) {
        setError(res.error ?? 'Could not duplicate.');
        return;
      }
      onDuplicated(res.slug);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Duplicate event
        </h2>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--surface-2)] px-3 text-[13px] font-medium text-[var(--ink-900)] hover:bg-[var(--hover)] disabled:opacity-50"
          >
            <Copy size={12} /> Duplicate…
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
              New name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
              New slug
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugDirty(true);
                setSlug(e.target.value);
              }}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 font-mono text-[13px] text-[var(--ink-900)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
              First-day doors open
            </label>
            <input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)]"
            />
            <p className="mt-1 text-[11px] text-[var(--ink-400)]">
              All other dates (multi-day, RoS, shifts) shift by the same delta.
            </p>
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
              Carry over
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <CopyCheckbox
                label="Run-of-show timeline + checklist"
                checked={copyRos}
                onChange={setCopyRos}
              />
              <CopyCheckbox
                label="Shift assignments (reset to pending)"
                checked={copyShifts}
                onChange={setCopyShifts}
              />
              <CopyCheckbox
                label="POS tier definitions"
                checked={copyTiers}
                onChange={setCopyTiers}
              />
            </div>
          </fieldset>
          {error ? (
            <p className="text-[13px] text-[#EF4444] sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || busy}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--ezxs-gradient-money)' }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
              {submitting ? 'Duplicating…' : 'Create duplicate'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-[var(--ink-500)]">
          Creates a new draft event with copied days. Choose what carries over —
          tickets / customers / scans / orders never copy across.
        </p>
      )}
    </section>
  );
}

function CopyCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none accent-[#34C759]"
      />
      <span className="text-[12px] text-[var(--ink-900)]">{label}</span>
    </label>
  );
}

function ReportSection({ report }: { report: EventReport }) {
  const t = report.totals;
  const sources = Object.entries(report.check_ins_by_source).sort((a, b) => b[1] - a[1]);
  const totalSourceCount = sources.reduce((sum, [, n]) => sum + n, 0);
  const sevOrder: Array<keyof typeof report.incidents_by_severity> = [
    'critical',
    'high',
    'medium',
    'low',
  ];
  const SEV_COLORS: Record<string, string> = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#F59E0B',
    low: '#3B82F6',
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Report
        </h2>
        <span className="text-[11px] text-[var(--ink-400)]">
          rolled up from existing tables · live data
        </span>
      </header>

      {/* Top-line stats */}
      <ul className="grid grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-4">
        <Stat icon={Ticket} label="Sold" value={t.tickets_sold.toLocaleString()} />
        <Stat icon={Users} label="Checked in" value={t.check_ins.toLocaleString()} />
        <Stat icon={DollarSign} label="POS revenue" value={`$${(t.pos_revenue_cents / 100).toFixed(2)}`} />
        <Stat
          icon={ShieldAlert}
          label="Incidents (open / total)"
          value={`${t.incidents_open} / ${t.incidents_open + t.incidents_closed}`}
        />
      </ul>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
        {/* Source breakdown */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Check-ins by source
          </h3>
          {sources.length === 0 ? (
            <p className="mt-2 text-[12px] text-[var(--ink-400)]">No check-ins yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {sources.map(([src, count]) => {
                const pct = totalSourceCount > 0 ? Math.round((count / totalSourceCount) * 100) : 0;
                return (
                  <li key={src}>
                    <div className="flex items-center justify-between text-[12px] text-[var(--ink-700)]">
                      <span className="font-mono uppercase tracking-wider">
                        {sourceLabel(src as Parameters<typeof sourceLabel>[0])}
                      </span>
                      <span className="tabular-nums text-[var(--ink-500)]">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg)]">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: 'var(--ezxs-gradient-money)' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Incidents by severity */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Incidents by severity
          </h3>
          {Object.keys(report.incidents_by_severity).length === 0 ? (
            <p className="mt-2 text-[12px] text-[var(--ink-400)]">None logged.</p>
          ) : (
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sevOrder.map((sev) => {
                const count = report.incidents_by_severity[sev as string] ?? 0;
                return (
                  <li
                    key={sev as string}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-center"
                  >
                    <span
                      className="block text-[20px] font-bold tabular-nums"
                      style={{ color: SEV_COLORS[sev as string] }}
                    >
                      {count}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--ink-400)]">
                      {sev as string}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Per-day capacity */}
        {report.by_day.length > 0 ? (
          <div className="lg:col-span-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
              By day
            </h3>
            <ul className="mt-2 space-y-1.5">
              {report.by_day.map((d) => (
                <li key={d.event_day_id}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[var(--ink-700)]">
                      Day {d.day_index} · {d.label}
                    </span>
                    <span className="tabular-nums text-[var(--ink-500)]">
                      {d.checked_in.toLocaleString()} / {d.capacity.toLocaleString()} · {d.pct}%
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg)]">
                    <div
                      className="h-full"
                      style={{
                        width: `${d.pct}%`,
                        background:
                          d.pct >= 100
                            ? '#EF4444'
                            : d.pct >= 90
                              ? '#F97316'
                              : d.pct >= 75
                                ? '#F59E0B'
                                : '#34C759',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Re-entries hint */}
        {t.re_entries > 0 ? (
          <p className="text-[11px] text-[var(--ink-400)] lg:col-span-2">
            <TrendingUp size={11} className="mr-1 inline-block" />
            {t.re_entries} re-entry scan{t.re_entries === 1 ? '' : 's'} (already_scanned + entry &gt; 1).
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ticket;
  label: string;
  value: string;
}) {
  return (
    <li className="flex flex-col gap-0.5 bg-[var(--surface)] px-4 py-3">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
        <Icon size={11} />
        {label}
      </span>
      <span className="text-[20px] font-bold tabular-nums text-[var(--ink-900)]">{value}</span>
    </li>
  );
}

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
