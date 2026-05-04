'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Radio, ShieldCheck, Split } from 'lucide-react';
import { useVenueMode, type VenueMode } from '@/hooks/useVenueMode';

type Variant = 'security' | 'events';

const OPTIONS: Array<{
  mode: VenueMode;
  label: string;
  icon: typeof ShieldCheck;
}> = [
  { mode: 'security', label: 'Security', icon: ShieldCheck },
  { mode: 'both', label: 'Both', icon: Split },
  { mode: 'events', label: 'Events', icon: Radio },
];

export function VenueModeSwitch({
  orgDefault,
  variant = 'security',
  className,
}: {
  orgDefault?: VenueMode | null;
  variant?: Variant;
  className?: string;
}) {
  const router = useRouter();
  const { mode, setMode } = useVenueMode(orgDefault);
  const isEvents = variant === 'events';

  function choose(next: VenueMode) {
    setMode(next);
    if (next === 'events') {
      router.push('/live');
    } else if (next === 'security') {
      router.push('/dashboard');
    }
    router.refresh();
  }

  return (
    <div
      className={clsx(
        'inline-flex min-h-9 items-center rounded-full border p-0.5',
        isEvents
          ? 'border-[var(--border)] bg-[var(--bg)]'
          : 'border-[var(--border-default)] bg-[var(--surface-secondary)]',
        className,
      )}
      aria-label="Venue mode"
      role="group"
    >
      {OPTIONS.map(({ mode: option, label, icon: Icon }) => {
        const active = mode === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            className={clsx(
              'inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold transition-colors',
              active
                ? isEvents
                  ? 'bg-[var(--surface)] text-[var(--ink-900)] shadow-sm'
                  : 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm'
                : isEvents
                  ? 'text-[var(--ink-500)] hover:bg-[var(--hover)] hover:text-[var(--ink-900)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
            )}
            aria-pressed={active}
            title={`Switch to ${label} mode`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
