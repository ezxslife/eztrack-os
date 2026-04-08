"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RouteErrorStateProps {
  error?: Error & { digest?: string };
  onRetry: () => void;
  fullScreen?: boolean;
  title?: string;
  description?: string;
}

export function RouteErrorState({
  error,
  onRetry,
  fullScreen = false,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
}: RouteErrorStateProps) {
  const message =
    error?.message && error.message !== "Failed to fetch"
      ? error.message
      : description;

  return (
    <div
      className={
        fullScreen
          ? "min-h-screen bg-[var(--surface-bg)] px-4 py-8 flex items-center justify-center"
          : "min-h-[400px] px-4 py-8 flex items-center justify-center"
      }
    >
      <div className="surface-card w-full max-w-md p-6 text-center sm:p-7">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--status-critical)]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
          {message}
        </p>
        <div className="mt-5">
          <Button onClick={onRetry} variant="outline" size="sm">
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
