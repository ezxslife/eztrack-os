'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, Search, ShieldOff, UserX } from 'lucide-react';
import { fetchPatrons, type PatronRow } from '@/lib/queries/events';

const FLAG_STYLE: Record<string, { bg: string; fg: string; icon: typeof Crown; label: string }> = {
  vip: { bg: '#34C759', fg: '#0B0D17', icon: Crown, label: 'VIP' },
  deny: { bg: '#EF4444', fg: '#fff', icon: ShieldOff, label: 'DENY' },
  watch: { bg: '#F59E0B', fg: '#1f2937', icon: UserX, label: 'WATCH' },
};

const DEFAULT_STYLE = { bg: 'var(--ink-300)', fg: '#fff', icon: UserX, label: '' };

export default function VipDenyPage() {
  const [patrons, setPatrons] = useState<PatronRow[]>([]);
  const [filter, setFilter] = useState('');
  const [activeFlag, setActiveFlag] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchPatrons();
      if (!cancelled) {
        setPatrons(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of patrons) counts[p.flag] = (counts[p.flag] ?? 0) + 1;
    return counts;
  }, [patrons]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return patrons.filter((p) => {
      if (activeFlag !== 'all' && p.flag !== activeFlag) return false;
      if (!q) return true;
      return [p.first_name, p.last_name, p.email, p.phone, p.notes]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q));
    });
  }, [patrons, filter, activeFlag]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <span className="text-[13px] text-[var(--ink-400)]">Loading patrons…</span>
      </div>
    );
  }

  const flags = Object.keys(flagCounts).sort();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
          VIP &amp; Deny list
        </h1>
        <p className="text-[14px] text-[var(--ink-500)]">
          Reframed Patrons module. Flagged guests show a banner on scanner / will-call results.
        </p>
      </header>

      {/* Flag filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="All"
          count={patrons.length}
          active={activeFlag === 'all'}
          onClick={() => setActiveFlag('all')}
        />
        {flags.map((f) => {
          const style = FLAG_STYLE[f] ?? { ...DEFAULT_STYLE, label: f.toUpperCase() };
          return (
            <FilterChip
              key={f}
              label={style.label || f.toUpperCase()}
              count={flagCounts[f]}
              active={activeFlag === f}
              onClick={() => setActiveFlag(f)}
              color={style.bg}
            />
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)]"
        />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, email, phone, or note"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-[14px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] focus:border-[var(--ink-700)]"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-400)]">
            {patrons.length === 0
              ? 'No patrons flagged yet. Add one from the eztrack-os Patrons module.'
              : 'No matches for the current filter.'}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.map((p) => {
              const style = FLAG_STYLE[p.flag] ?? { ...DEFAULT_STYLE, label: p.flag.toUpperCase() };
              const Icon = style.icon;
              return (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full"
                    style={{ background: style.bg }}
                  >
                    <Icon size={14} color={style.fg} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">
                      {(p.first_name ?? '') + ' ' + (p.last_name ?? '') || p.email || 'Unnamed'}
                    </p>
                    <p className="truncate text-[11px] text-[var(--ink-400)]">
                      {p.email ?? p.phone ?? '—'}
                      {p.notes ? ` · ${p.notes}` : ''}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {style.label || p.flag.toUpperCase()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-[var(--ink-400)]">
        Patrons module data is shared with eztrack-os Security Mode. Adding/removing flags here
        propagates to the encounter-history view in security mode.
      </p>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
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
      {color ? (
        <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
      ) : null}
      {label}
      <span className="tabular-nums text-[var(--ink-400)]">{count}</span>
    </button>
  );
}
