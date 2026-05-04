'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, Save, Trash2 } from 'lucide-react';
import {
  EVENTS_MODE_NOTIFICATION_TYPES,
  deleteNotificationRule,
  fetchActiveEvent,
  fetchNotificationRules,
  upsertNotificationRule,
  type EventRow,
  type NotificationRuleRow,
  type NotificationRecipientChoice,
} from '@/lib/queries/events';

interface DraftRule {
  event_type: string;
  description: string | null;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  recipients: NotificationRecipientChoice;
  emails: string;
  existingId?: string;
  isDirty: boolean;
}

/**
 * /notifications — operator-managed routing for events-mode events. Each
 * event_type (capacity_threshold, ros_publish, incident_critical, ...) gets a
 * card with toggles for push / email / sms and a recipient picker (all_staff,
 * managers_only, or a comma-separated email list). Saves upsert into
 * notification_rules and writes an activity_log entry.
 */
export default function NotificationsPage() {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rules, setRules] = useState<NotificationRuleRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftRule>>({});
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [ev, list] = await Promise.all([
      fetchActiveEvent(),
      fetchNotificationRules(),
    ]);
    setEvent(ev);
    setRules(list);

    // Hydrate drafts from existing rules + sensible defaults for unconfigured types
    const draftMap: Record<string, DraftRule> = {};
    for (const t of EVENTS_MODE_NOTIFICATION_TYPES) {
      const existing = list.find((r) => r.event_type === t.event_type);
      if (existing) {
        const recipientsJson = existing.recipients;
        const baseChoice: NotificationRecipientChoice =
          typeof recipientsJson === 'string'
            ? (recipientsJson as NotificationRecipientChoice)
            : recipientsJson && typeof recipientsJson === 'object'
              ? 'specific_emails'
              : 'all_staff';
        const emails =
          typeof recipientsJson === 'object' && 'emails' in (recipientsJson as object)
            ? ((recipientsJson as { emails: string[] }).emails ?? []).join(', ')
            : '';
        draftMap[t.event_type] = {
          event_type: t.event_type,
          description: existing.description ?? t.description,
          push_enabled: existing.push_enabled,
          email_enabled: existing.email_enabled,
          sms_enabled: existing.sms_enabled,
          recipients: baseChoice,
          emails,
          existingId: existing.id,
          isDirty: false,
        };
      } else {
        draftMap[t.event_type] = {
          event_type: t.event_type,
          description: t.description,
          push_enabled: true,
          email_enabled: false,
          sms_enabled: false,
          recipients: 'all_staff',
          emails: '',
          isDirty: false,
        };
      }
    }
    setDrafts(draftMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function patchDraft(et: string, patch: Partial<DraftRule>) {
    setDrafts((prev) => ({
      ...prev,
      [et]: { ...prev[et], ...patch, isDirty: true },
    }));
  }

  async function handleSave(et: string) {
    if (!event) return;
    const draft = drafts[et];
    if (!draft) return;
    setSavingType(et);
    setToast(null);
    try {
      const recipientsPayload: NotificationRecipientChoice | { emails: string[] } =
        draft.recipients === 'specific_emails'
          ? { emails: parseEmailList(draft.emails) }
          : draft.recipients;
      const res = await upsertNotificationRule({
        org_id: event.org_id,
        event_type: et,
        description: draft.description,
        push_enabled: draft.push_enabled,
        email_enabled: draft.email_enabled,
        sms_enabled: draft.sms_enabled,
        recipients: recipientsPayload,
      });
      if (!res.ok) {
        setToast(`Save failed: ${res.error ?? 'unknown'}`);
        return;
      }
      await refresh();
      setToast(`${labelFor(et)} saved`);
    } finally {
      setSavingType(null);
    }
  }

  async function handleDisable(et: string) {
    const draft = drafts[et];
    if (!draft?.existingId) return;
    if (!window.confirm(`Remove the ${labelFor(et)} rule? Defaults will resume.`)) return;
    setSavingType(et);
    try {
      await deleteNotificationRule(draft.existingId);
      await refresh();
      setToast(`${labelFor(et)} reset to default`);
    } finally {
      setSavingType(null);
    }
  }

  const configuredCount = useMemo(
    () => Object.values(drafts).filter((d) => d.existingId).length,
    [drafts],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading notification rules…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            Notifications
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            Channel routing for events-mode signals. Push lands in-app; email rides the
            email_outbox worker; SMS goes through Twilio (configured at the org level).
            Unconfigured event types fall back to push-to-all_staff.
          </p>
        </div>
        <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
          {configuredCount}/{EVENTS_MODE_NOTIFICATION_TYPES.length} configured
        </span>
      </header>

      {toast ? (
        <div
          role="status"
          className="rounded-xl border border-[#34C759]/40 bg-[rgba(52,199,89,0.08)] px-4 py-2 text-[13px] text-[var(--ink-900)]"
        >
          {toast}
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {EVENTS_MODE_NOTIFICATION_TYPES.map((t) => {
          const d = drafts[t.event_type];
          if (!d) return null;
          const saving = savingType === t.event_type;
          return (
            <li
              key={t.event_type}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ink-900)]">
                    <Bell size={13} className="text-[var(--ink-500)]" />
                    {t.label}
                    {d.existingId ? (
                      <span className="rounded-full bg-[#34C759]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#15803D]">
                        configured
                      </span>
                    ) : null}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-500)]">{t.description}</p>
                  <p className="mt-1 font-mono text-[10px] text-[var(--ink-400)]">{t.event_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {d.existingId ? (
                    <button
                      type="button"
                      onClick={() => void handleDisable(t.event_type)}
                      disabled={saving}
                      className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10"
                    >
                      <Trash2 size={11} /> Reset
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleSave(t.event_type)}
                    disabled={saving || !d.isDirty}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-3 text-[12px] font-semibold text-[var(--surface)] hover:opacity-90 disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    Save
                  </button>
                </div>
              </div>

              {/* Channel toggles */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <ChannelToggle
                  label="Push"
                  on={d.push_enabled}
                  onChange={(v) => patchDraft(t.event_type, { push_enabled: v })}
                />
                <ChannelToggle
                  label="Email"
                  on={d.email_enabled}
                  onChange={(v) => patchDraft(t.event_type, { email_enabled: v })}
                />
                <ChannelToggle
                  label="SMS"
                  on={d.sms_enabled}
                  onChange={(v) => patchDraft(t.event_type, { sms_enabled: v })}
                />
              </div>

              {/* Recipients */}
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
                  Recipients
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['all_staff', 'managers_only', 'specific_emails'] as const).map((r) => {
                    const active = d.recipients === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => patchDraft(t.event_type, { recipients: r })}
                        aria-pressed={active}
                        className={`inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-medium transition-colors ${
                          active
                            ? 'border-[var(--ink-700)] bg-[var(--surface-2)] text-[var(--ink-900)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-500)] hover:bg-[var(--hover)]'
                        }`}
                      >
                        {r.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
                {d.recipients === 'specific_emails' ? (
                  <input
                    type="text"
                    value={d.emails}
                    onChange={(e) => patchDraft(t.event_type, { emails: e.target.value })}
                    placeholder="ops@venue.com, security@venue.com"
                    className="mt-2 h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] focus:border-[var(--ink-700)]"
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-[var(--ink-400)]">
        {rules.length} active rule{rules.length === 1 ? '' : 's'} on file. Changes write through to{' '}
        <code className="font-mono">notification_rules</code> and append to{' '}
        <code className="font-mono">/audit</code>.
      </p>
    </div>
  );
}

function labelFor(et: string): string {
  return EVENTS_MODE_NOTIFICATION_TYPES.find((t) => t.event_type === et)?.label ?? et;
}

function parseEmailList(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.includes('@'));
}

function ChannelToggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`flex h-10 items-center justify-between rounded-lg border px-3 text-[13px] font-medium transition-colors ${
        on
          ? 'border-[var(--ink-700)] bg-[var(--surface-2)] text-[var(--ink-900)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-500)] hover:bg-[var(--hover)]'
      }`}
    >
      {label}
      <span
        className={`ml-2 inline-flex h-4 w-7 rounded-full px-0.5 ${
          on ? 'bg-[#34C759] justify-end' : 'bg-[var(--border-strong)] justify-start'
        }`}
      >
        <span className="h-3 w-3 rounded-full bg-white" />
      </span>
    </button>
  );
}
