import { Skeleton } from "@/components/ui/Skeleton";
import { AuthCard, AuthShell } from "@/components/layout/AuthShell";

export default function Loading() {
  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-7 flex items-start justify-between gap-3 sm:items-center">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-2xl" />
        </div>
        <div className="mb-6 space-y-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[78px] w-full rounded-2xl" />
          <Skeleton className="h-[78px] w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-4 w-48" />
      </AuthCard>
    </AuthShell>
  );
}
