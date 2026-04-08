"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
  Radio,
  Shield,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/auth-actions";

const HERO_POINTS = [
  {
    icon: Radio,
    title: "Live signal",
    body: "Alerts, dispatch, and incident surfaces stay synchronized with the same session model used by the app.",
  },
  {
    icon: Workflow,
    title: "Operational density",
    body: "The shell stays compact so officers and coordinators can move from sign-in to action without UI drag.",
  },
  {
    icon: ShieldCheck,
    title: "Scoped access",
    body: "Every session stays organization-bound across lists, detail pages, uploads, and workflow modals.",
  },
] as const;

const ACCESS_NOTES = [
  "Use the same Supabase credentials as the EZTrack mobile app.",
  "Password recovery is still handled by an operations admin.",
  "After authentication you return directly to the requested module.",
] as const;

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [state, formAction, loading] = useActionState(signIn, { error: "" });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--surface-bg)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: [
            "radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--action-primary) 18%, transparent), transparent 34%)",
            "radial-gradient(circle at 82% 10%, color-mix(in srgb, var(--status-info) 14%, transparent), transparent 26%)",
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-secondary) 78%, transparent), transparent 45%)",
          ].join(", "),
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,420px)] lg:gap-6">
          <section className="space-y-4">
            <div className="glass p-5 sm:p-7 lg:p-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-heavy)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                <Shield className="h-3.5 w-3.5" />
                EZTrack Web
              </div>

              <div className="mt-6 max-w-2xl">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/20 bg-[var(--action-primary)] shadow-[var(--shadow-md)]">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h1 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
                  Command surfaces, not bloated dashboards.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
                  Sign in to the same live session model used across web and mobile. The shell
                  stays fast, dense, and readable so operators land directly in the flow that
                  matters.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {HERO_POINTS.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-heavy)] p-4"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-primary)] text-[var(--action-primary)] shadow-[var(--shadow-xs)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {title}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-card p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Session model
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Live session
                </p>
                <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">
                  Browser access follows the same authenticated route boundaries as the app, with
                  organization-scoped reads and writes.
                </p>
              </div>

              <div className="surface-card p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Operational fit
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Built for responsive ops
                </p>
                <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">
                  Dispatch, incidents, briefings, and reports share one compact component language
                  so the auth surface does not feel disconnected from the rest of the product.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 animate-fade-in">
            <div className="surface-card p-5 shadow-lg sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Live session
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    Sign in
                  </h2>
                  <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
                    Use the same credentials as the mobile app. Successful sign-in returns you to
                    the route that requested authentication.
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--action-primary)]">
                  <LockKeyhole className="h-5 w-5" />
                </div>
              </div>

              <form action={formAction} className="space-y-4">
                <input type="hidden" name="redirectTo" value={redirectTo} />

                {state.error ? (
                  <div
                    aria-live="polite"
                    className="rounded-xl border border-[var(--red-200,#fecaca)] bg-[var(--red-50,#fef2f2)] px-3 py-3 text-[13px] leading-5 text-[var(--red-600,#dc2626)] dark:border-[var(--red-800,#991b1b)]/30 dark:bg-[var(--red-900,#7f1d1d)]/20 dark:text-[var(--red-400,#f87171)]"
                  >
                    {state.error}
                  </div>
                ) : null}

                <Input
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                  helperText="Use your EZTrack operator email."
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
                  helperText="Passwords are currently managed by your operations admin."
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
                  className="w-full"
                >
                  <span>Sign In to EZTrack</span>
                  {!loading ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
                </Button>
              </form>
            </div>

            <div className="glass-subtle p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Access notes
              </p>
              <div className="mt-3 space-y-2">
                {ACCESS_NOTES.map((note) => (
                  <div key={note} className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--action-primary)]" />
                    <p className="text-[13px] leading-5 text-[var(--text-secondary)]">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
