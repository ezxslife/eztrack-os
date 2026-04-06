"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">
        Something went wrong
      </h2>
      <p className="text-[13px] text-[var(--text-tertiary)] mb-4 text-center max-w-sm">
        An error occurred loading this page. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
