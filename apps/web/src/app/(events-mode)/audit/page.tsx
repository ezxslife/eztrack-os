'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Filter, Loader2, ShieldCheck } from 'lucide-react';
import { fetchActivityLog, type ActivityLogRow } from '@/lib/queries/events';

/**
 * /audit — read-only operator view onto the org's activity_log. Surfaces every
 * recordActivity() write made by /events, /pos, /run-of-show, /templates,
 * /staff, etc. Filterable by entity_type and action; expanded rows show the
 * raw `changes` jsonb.
 *
 * RLS scopes to the operator's org; the page makes no service-role calls.
 */
export default function AuditPage() {
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await fetchActivityLog({
      entity_type: entityType === 'all' ? undefined : entityType,
      action: action === 'all' ? undefined : action,
      limit: 200,
    });
    setRows(list);
    setLoading(false);
  }, [entityType, action]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.entity_type);
    return Array.from(set).sort();
  }, [rows]);

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.action);
    return Array.from(set).sort();
  }, [rows]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
            Audit log
          </h1>
          <p className="text-[14px] text-[var(--ink-500)]">
            Org-scoped operator history. Latest 200 rows shown. Every event-mode mutation
            (cancel, hold update, day edit, member change, RoS publish/advance, POS sale,
            template rename/delete) lands here automatically.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">
          <ShieldCheck size={11} /> Read-only
        </span>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
          <Filter size={11} /> Filter
        </span>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          aria-label="Entity type"
          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] text-[var(--ink-900)]"
        >
          <option value="all">All entities</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          aria-label="Action"
          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] text-[var(--ink-900)]"
        >
          <option value="all">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--hover)]"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-[13px] text-[var(--ink-400)]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-10 text-center">
          <ShieldCheck size={22} className="mx-auto text-[var(--ink-400)]" />
          <p className="mt-3 text-[14px] font-medium text-[var(--ink-900)]">No activity yet</p>
          <p className="mt-1 text-[13px] text-[var(--ink-500)]">
            Mutations land here as operators take action elsewhere in events mode.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {rows.map((r) => {
            const isOpen = expanded === r.id;
            const actorLabel =
              r.actor?.full_name?.trim() ||
              r.actor?.email ||
              (r.actor_id ? r.actor_id.slice(0, 8) : 'system');
            return (
              <li key={r.id} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[var(--hover)]"
                >
                  {isOpen ? (
                    <ChevronDown size={14} className="flex-none text-[var(--ink-400)]" />
                  ) : (
                    <ChevronRight size={14} className="flex-none text-[var(--ink-400)]" />
                  )}
                  <span
                    className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-700)]"
                  >
                    {r.entity_type.replace(/_/g, ' ')}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background: actionColor(r.action).bg,
                      color: actionColor(r.action).fg,
                    }}
                  >
                    {r.action}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--ink-900)]">
                    <span className="font-mono text-[11px] text-[var(--ink-400)]">
                      {r.entity_id.slice(0, 8)}
                    </span>{' '}
                    by <span className="font-medium">{actorLabel}</span>
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
                    {formatRelative(r.created_at)}
                  </span>
                </button>
                {isOpen ? (
                  <div className="border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-3">
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-[12px] text-[var(--ink-700)]">
                      <dt className="text-[var(--ink-400)]">id</dt>
                      <dd className="font-mono text-[11px]">{r.id}</dd>
                      <dt className="text-[var(--ink-400)]">entity_id</dt>
                      <dd className="font-mono text-[11px]">{r.entity_id}</dd>
                      <dt className="text-[var(--ink-400)]">actor_id</dt>
                      <dd className="font-mono text-[11px]">{r.actor_id ?? '—'}</dd>
                      <dt className="text-[var(--ink-400)]">created_at</dt>
                      <dd>{new Date(r.created_at).toLocaleString()}</dd>
                    </dl>
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--surface)] p-3 text-[11px] text-[var(--ink-700)]">
                      {JSON.stringify(r.changes ?? {}, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function actionColor(action: string): { bg: string; fg: string } {
  // Verb → semantic color. Soft pastels so they read at a glance without
  // overwhelming the row.
  if (/^(deleted|removed|cancelled)$/.test(action)) {
    return { bg: 'rgba(239, 68, 68, 0.15)', fg: '#B91C1C' };
  }
  if (/^(created|invited|sold|published|advanced|accepted|reinstated)$/.test(action)) {
    return { bg: 'rgba(52, 199, 89, 0.15)', fg: '#15803D' };
  }
  if (/^(updated|renamed|hold_updated)$/.test(action)) {
    return { bg: 'rgba(59, 130, 246, 0.15)', fg: '#1D4ED8' };
  }
  return { bg: 'var(--surface-2)', fg: 'var(--ink-700)' };
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diffMs = Date.now() - t;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}
