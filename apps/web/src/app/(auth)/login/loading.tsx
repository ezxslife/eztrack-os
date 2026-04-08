import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--surface-bg)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,420px)] lg:gap-6">
        <div className="space-y-4">
          <div className="glass p-5 sm:p-7 lg:p-8">
            <Skeleton className="h-6 w-28 rounded-full" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-14 w-14 rounded-[20px]" />
              <Skeleton className="h-10 w-72 max-w-full" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-heavy)] p-4">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <Skeleton className="mt-3 h-4 w-24" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-1 h-3 w-5/6" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="surface-card p-4 sm:p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-4 w-36" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-card p-5 shadow-lg sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-4 w-5/6 max-w-xs" />
              </div>
              <Skeleton className="h-11 w-11 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          <div className="glass-subtle p-4 sm:p-5">
            <Skeleton className="h-3 w-24" />
            <div className="mt-3 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <Skeleton className="mt-1.5 h-1.5 w-1.5 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
