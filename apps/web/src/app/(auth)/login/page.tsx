"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, Shield } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/auth-actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [state, formAction, loading] = useActionState(signIn, { error: "" });
  const showReturnTarget = redirectTo !== "/dashboard";

  return (
    <AuthShell>
      <AuthCard data-auth-card className="animate-fade-in">
        <div className="mb-7 flex min-w-0 items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">EZTrack</span>
            </div>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--action-primary)]">
            <LockKeyhole className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-[clamp(1.9rem,5vw,2.35rem)] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
            Sign in
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            Use your work account to continue.
          </p>
          {showReturnTarget ? (
            <div className="mt-4 inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-[var(--text-secondary)]">
              <span className="truncate">
                Returning to <span className="font-medium text-[var(--text-primary)]">{redirectTo}</span>
              </span>
            </div>
          ) : null}
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {state.error ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-[var(--status-critical-border)] bg-[var(--status-critical-surface)] px-4 py-3 text-[13px] leading-6 text-[var(--status-critical)]"
            >
              {state.error}
            </div>
          ) : null}

          <Input
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            id="email"
            inputMode="email"
            label="Email"
            name="email"
            placeholder="operator@eztrack.io"
            required
            spellCheck={false}
            type="email"
          />

          <Input
            autoComplete="current-password"
            id="password"
            label="Password"
            name="password"
            placeholder="Enter password"
            required
            type="password"
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            isLoading={loading}
            className="mt-2 w-full"
          >
            <span>{loading ? "Signing in" : "Sign in"}</span>
            {!loading ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
          </Button>
        </form>

        <p className="mt-4 text-[12px] leading-5 text-[var(--text-tertiary)]">
          Need help? Contact your operations admin.
        </p>
      </AuthCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
