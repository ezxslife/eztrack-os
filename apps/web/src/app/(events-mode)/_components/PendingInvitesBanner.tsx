'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Mail, X } from 'lucide-react';
import {
  acceptEventMembership,
  fetchEventsByIds,
  fetchMyPendingMemberships,
  removeEventMember,
  type EventMemberRow,
} from '@/lib/queries/events';

interface InviteRow {
  member: EventMemberRow;
  event_name: string;
  event_slug: string;
}

/**
 * Inline banner that surfaces pending event-membership invites for the
 * signed-in operator. Accept stamps event_members.accepted_at = now().
 * Decline removes the membership row.
 *
 * Mounted on the (events-mode) layout so it appears across all events-mode
 * pages until every invite is resolved.
 */
export function PendingInvitesBanner() {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const memberships = await fetchMyPendingMemberships();
    if (memberships.length === 0) {
      setInvites([]);
      setLoading(false);
      return;
    }
    const events = await fetchEventsByIds(memberships.map((m) => m.event_id));
    const byId = new Map(events.map((e) => [e.id, e]));
    setInvites(
      memberships
        .map((m) => {
          const e = byId.get(m.event_id);
          if (!e) return null;
          return { member: m, event_name: e.name, event_slug: e.slug };
        })
        .filter((x): x is InviteRow => x !== null),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAccept(row: InviteRow) {
    setBusyId(row.member.id);
    try {
      await acceptEventMembership(row.member.event_id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(row: InviteRow) {
    if (!window.confirm(`Decline invite to ${row.event_name}?`)) return;
    setBusyId(row.member.id);
    try {
      await removeEventMember(row.member.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading || invites.length === 0) return null;

  return (
    <div className="mx-4 mt-3 flex flex-col gap-2 rounded-2xl border-2 border-[#3B82F6] p-3 sm:mx-6 lg:mx-8" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
      {invites.map((row) => (
        <div key={row.member.id} className="flex items-center gap-3">
          <Mail size={16} className="flex-none text-[#3B82F6]" />
          <p className="flex-1 text-[13px] text-[var(--ink-900)]">
            <span className="font-semibold">You&apos;re invited to {row.event_name}</span>{' '}
            <Link href={`/events/${row.event_slug}`} className="text-[var(--ink-500)] underline">
              view
            </Link>
            <span className="ml-1 text-[var(--ink-500)]">
              · {row.member.role}
              {row.member.write_permission ? ' · can write' : ' · read-only'}
            </span>
          </p>
          <button
            type="button"
            onClick={() => handleDecline(row)}
            disabled={busyId === row.member.id}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[#EF4444]"
          >
            <X size={12} /> Decline
          </button>
          <button
            type="button"
            onClick={() => handleAccept(row)}
            disabled={busyId === row.member.id}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#3B82F6] px-3 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busyId === row.member.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Accept
          </button>
        </div>
      ))}
    </div>
  );
}
