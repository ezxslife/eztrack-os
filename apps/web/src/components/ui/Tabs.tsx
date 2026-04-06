"use client";

import { useRef, useState, useEffect, useCallback, useId, type KeyboardEvent } from "react";
import clsx from "clsx";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  /** Accessible label for the tab list */
  ariaLabel?: string;
}

export function Tabs({ tabs, activeTab, onChange, className, ariaLabel = "Tabs" }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const instanceId = useId();

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeTab}"]`
    );
    if (activeEl) {
      setIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  /** Arrow key navigation per WAI-ARIA Tabs pattern */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const currentIdx = tabs.findIndex((t) => t.id === activeTab);
      let nextIdx: number | null = null;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (currentIdx + 1) % tabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = tabs.length - 1;
      }

      if (nextIdx !== null) {
        onChange(tabs[nextIdx].id);
        // Focus the new tab button
        const container = containerRef.current;
        if (container) {
          const btn = container.querySelector<HTMLButtonElement>(
            `[data-tab-id="${tabs[nextIdx].id}"]`
          );
          btn?.focus();
        }
      }
    },
    [tabs, activeTab, onChange]
  );

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={clsx(
        "relative flex border-b border-[var(--border-default)] overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`${instanceId}-tab-${tab.id}`}
            data-tab-id={tab.id}
            aria-selected={isActive}
            aria-controls={`${instanceId}-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative px-3 py-2 text-[13px] font-medium whitespace-nowrap",
              "transition-colors duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-inset rounded-t-md",
              isActive
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "ml-1.5 text-[11px] tabular-nums",
                  isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Sliding active indicator */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 h-0.5 bg-[var(--action-primary)] rounded-full transition-all duration-200 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
}

/** Wrapper for tab panel content — pairs with Tabs via matching IDs */
export function TabsContent({
  tabId,
  activeTab,
  children,
  className,
}: {
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (tabId !== activeTab) return null;
  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
