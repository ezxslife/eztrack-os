"use client";

import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

interface PageLoadingShellProps {
  label?: string;
  showStats?: boolean;
  rows?: number;
}

export function PageLoadingShell({
  label = "Loading content",
  showStats = true,
  rows = 6,
}: PageLoadingShellProps) {
  return (
    <div aria-label={label} className="space-y-[var(--page-section-gap)] animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 sm:w-56" />
          <Skeleton className="h-4 w-56 sm:w-72" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-full sm:w-40" />
          <Skeleton className="h-9 w-full sm:w-28" />
        </div>
      </div>

      {showStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : null}

      <div className="surface-card overflow-hidden">
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-9 w-full sm:w-56" />
              <Skeleton className="h-9 w-full sm:w-36" />
            </div>
            <Skeleton className="h-9 w-full sm:w-32" />
          </div>
        </div>

        <div className="divide-y divide-[var(--border-default)]">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 sm:w-64" />
                <Skeleton className="h-3 w-28 sm:w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
