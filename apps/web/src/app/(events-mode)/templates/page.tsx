'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteTemplate,
  fetchTemplates,
  renameTemplate,
  type TemplateRow,
  type TemplateType,
} from '@/lib/queries/events';

const TYPE_PILL: Record<TemplateType, { bg: string; fg: string; label: string }> = {
  running_order: { bg: '#34C759', fg: '#fff', label: 'RUN-OF-SHOW' },
  event:         { bg: '#3B82F6', fg: '#fff', label: 'EVENT (v1.5)' },
  timeline:      { bg: '#A855F7', fg: '#fff', label: 'TIMELINE (v1.5)' },
  board:         { bg: '#94A3B8', fg: '#fff', label: 'BOARD (v2)' },
  checklist:     { bg: '#F59E0B', fg: '#1f2937', label: 'CHECKLIST (v1.5)' },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [filter, setFilter] = useState<'all' | TemplateType>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await fetchTemplates();
    setTemplates(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: templates.length };
    for (const t of templates) c[t.template_type] = (c[t.template_type] ?? 0) + 1;
    return c;
  }, [templates]);

  const visible = filter === 'all' ? templates : templates.filter((t) => t.template_type === filter);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this template? Soft-delete; can be restored via SQL.')) return;
    setBusy(id);
    try {
      await deleteTemplate(id);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleRename(id: string, current: string) {
    const next = window.prompt('Rename template', current);
    if (!next || next.trim() === current) return;
    setBusy(id);
    try {
      await renameTemplate(id, { name: next.trim() });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
          Templates
        </h1>
        <p className="text-[14px] text-[var(--ink-500)]">
          Polymorphic templates. Save run-of-shows for reuse; future types (event,
          timeline, board, checklist) slot in without a fork.
        </p>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="All" count={counts.all ?? 0} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip
          label="Run-of-show"
          count={counts.running_order ?? 0}
          active={filter === 'running_order'}
          onClick={() => setFilter('running_order')}
        />
      </div>

      {loading ? (
        <p className="text-[13px] text-[var(--ink-400)]">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-10 text-center">
          <FileText size={22} className="mx-auto text-[var(--ink-400)]" />
          <p className="mt-3 text-[14px] font-medium text-[var(--ink-900)]">No templates yet</p>
          <p className="mt-1 text-[13px] text-[var(--ink-500)]">
            Save a run-of-show timeline as a template from <code className="font-mono">/run-of-show</code>{' '}
            using the &quot;Save as template&quot; button.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {visible.map((t) => {
            const pill = TYPE_PILL[t.template_type] ?? TYPE_PILL.running_order;
            const isOpen = expanded === t.id;
            const slotsCount = (t.payload as { slots?: unknown[] }).slots?.length ?? 0;
            const checklistCount = (t.payload as { checklist?: unknown[] }).checklist?.length ?? 0;
            return (
              <li key={t.id} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[var(--hover)]"
                >
                  {isOpen ? (
                    <ChevronDown size={14} className="flex-none text-[var(--ink-400)]" />
                  ) : (
                    <ChevronRight size={14} className="flex-none text-[var(--ink-400)]" />
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: pill.bg, color: pill.fg }}
                  >
                    {pill.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--ink-900)]">
                    {t.name}
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--ink-400)]">
                    {slotsCount} slot{slotsCount === 1 ? '' : 's'}
                    {checklistCount > 0 ? ` · ${checklistCount} check` : ''}
                    {' · saved '}
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </button>
                {isOpen ? (
                  <div className="grid grid-cols-1 gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-3 sm:grid-cols-[1fr_auto]">
                    <div className="text-[12px] text-[var(--ink-500)]">
                      {t.description ? <p>{t.description}</p> : null}
                      {t.template_type === 'running_order' ? (
                        <PayloadPreview payload={t.payload as Record<string, unknown>} />
                      ) : (
                        <p className="text-[var(--ink-400)]">
                          Payload preview only available for running_order today.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRename(t.id, t.name)}
                        disabled={busy === t.id}
                        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[var(--ink-700)] hover:bg-[var(--hover)]"
                      >
                        <Pencil size={11} /> Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        disabled={busy === t.id}
                        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10"
                      >
                        {busy === t.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Trash2 size={11} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-[var(--ink-400)]">
        Apply a template to a specific event_day from <code className="font-mono">/run-of-show</code> when its
        timeline is empty.
      </p>
    </div>
  );
}

function PayloadPreview({ payload }: { payload: Record<string, unknown> }) {
  type SlotPreview = { label: string; minutes_offset: number; duration_minutes: number };
  type ChecklistPreview = { label: string };
  const slots = Array.isArray(payload.slots) ? (payload.slots as SlotPreview[]) : [];
  const checklist = Array.isArray(payload.checklist)
    ? (payload.checklist as ChecklistPreview[])
    : [];
  return (
    <div className="space-y-3">
      {slots.length > 0 ? (
        <div>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
            Slots
          </h3>
          <ul className="space-y-0.5">
            {slots.slice(0, 8).map((s, i) => (
              <li key={i} className="text-[12px] text-[var(--ink-700)]">
                <span className="inline-block w-16 tabular-nums text-[var(--ink-400)]">
                  +{s.minutes_offset}m
                </span>
                {s.label}{' '}
                <span className="text-[var(--ink-400)]">({s.duration_minutes} min)</span>
              </li>
            ))}
            {slots.length > 8 ? (
              <li className="text-[11px] text-[var(--ink-400)]">+ {slots.length - 8} more…</li>
            ) : null}
          </ul>
        </div>
      ) : null}
      {checklist.length > 0 ? (
        <div>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
            Checklist
          </h3>
          <ul className="space-y-0.5">
            {checklist.map((c, i) => (
              <li key={i} className="text-[12px] text-[var(--ink-700)]">
                · {c.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
        active
          ? 'border-[var(--ink-700)] bg-[var(--surface-2)] text-[var(--ink-900)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-500)] hover:bg-[var(--hover)]'
      }`}
    >
      {label}
      <span className="tabular-nums text-[var(--ink-400)]">{count}</span>
    </button>
  );
}
