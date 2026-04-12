"use client";

import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, Check, ChevronDown, LockKeyhole, Shield } from "lucide-react";
import {
  DEMO_AUTH_PROFILES,
  getDemoAuthProfileByEmail,
  type DemoAuthProfile,
} from "@eztrack/shared";
import { AuthCard, AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/lib/auth-actions";

const DEMO_PASSWORD_ENV = process.env.NEXT_PUBLIC_DEMO_PASSWORD?.trim() ?? "";
const DEMO_ACCESS_ENABLED =
  process.env.NODE_ENV !== "production" || Boolean(DEMO_PASSWORD_ENV);

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [state, formAction, loading] = useActionState(signIn, { error: "" });
  const showReturnTarget = redirectTo !== "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEMO_PASSWORD_ENV);
  const selectedDemoProfile = getDemoAuthProfileByEmail(email) ?? null;

  const handleSelectDemoProfile = (profile: DemoAuthProfile) => {
    const sharedPassword = DEMO_PASSWORD_ENV || password.trim();

    setEmail(profile.email);
    if (sharedPassword) {
      setPassword(sharedPassword);
    }
  };

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

          {DEMO_ACCESS_ENABLED ? (
            <DemoProfileField
              passwordAutofillEnabled={Boolean(DEMO_PASSWORD_ENV)}
              selectedProfile={selectedDemoProfile}
              onSelect={handleSelectDemoProfile}
            />
          ) : null}

          <Input
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            id="email"
            inputMode="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="operator@eztrack.io"
            required
            spellCheck={false}
            type="email"
            value={email}
          />

          <Input
            autoComplete="current-password"
            id="password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
            type="password"
            value={password}
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

function DemoProfileField({
  onSelect,
  passwordAutofillEnabled,
  selectedProfile,
}: {
  onSelect: (profile: DemoAuthProfile) => void;
  passwordAutofillEnabled: boolean;
  selectedProfile: DemoAuthProfile | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold tracking-[0.01em] text-[var(--text-secondary)]">
          Test profile
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
          Demo
        </span>
      </div>

      <div ref={containerRef} className="relative">
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className={clsx(
            "flex min-h-13 w-full items-center justify-between gap-3 rounded-[var(--input-radius)] border bg-[var(--surface-primary)] px-[var(--input-padding-x)] py-3 text-left shadow-[var(--shadow-xs)] transition-all duration-150 ease-out",
            open
              ? "border-[var(--border-focused)] shadow-[var(--focus-ring)]"
              : "border-[var(--border-default)] hover:border-[var(--border-hover)]"
          )}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <div className="min-w-0 flex-1">
            <div
              className={clsx(
                "truncate text-[14px] font-medium",
                selectedProfile ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              )}
            >
              {selectedProfile ? selectedProfile.name : "Choose a test profile"}
            </div>
            <div className="mt-1 truncate text-[12px] leading-5 text-[var(--text-tertiary)]">
              {selectedProfile
                ? `${selectedProfile.email} · ${selectedProfile.roleLabel}`
                : "Select a test profile to autofill demo sign-in."}
            </div>
          </div>
          <ChevronDown
            className={clsx(
              "h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-150",
              open ? "rotate-180" : null
            )}
          />
        </button>

        {open ? (
          <div
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-80 overflow-y-auto rounded-[24px] border border-white/10 bg-[color-mix(in_srgb,var(--surface-primary)_94%,transparent)] p-2 shadow-[0_24px_72px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
            role="listbox"
          >
            {DEMO_AUTH_PROFILES.map((profile) => {
              const selected = selectedProfile?.email === profile.email;

              return (
                <button
                  aria-selected={selected}
                  className={clsx(
                    "flex w-full items-center justify-between gap-3 rounded-[18px] px-3.5 py-3 text-left transition-colors duration-150",
                    selected
                      ? "bg-[var(--action-primary-surface)] text-[var(--action-primary)]"
                      : "text-[var(--text-primary)] hover:bg-white/5"
                  )}
                  key={profile.email}
                  onClick={() => {
                    onSelect(profile);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{profile.name}</div>
                    <div className="mt-1 truncate text-[12px] leading-5 text-[var(--text-tertiary)]">
                      {profile.email}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={clsx(
                        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                        selected
                          ? "border-[var(--action-primary-border)] bg-[var(--action-primary-surface)] text-[var(--action-primary)]"
                          : "border-white/10 bg-white/5 text-[var(--text-tertiary)]"
                      )}
                    >
                      {profile.roleLabel}
                    </span>
                    <Check
                      className={clsx(
                        "h-4 w-4 transition-opacity duration-150",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <p className="mt-1.5 text-[12px] leading-5 text-[var(--text-tertiary)]">
        {passwordAutofillEnabled
          ? "Shared demo password fills automatically on this build."
          : "Anything already entered in the password field stays filled when you switch profiles."}
      </p>
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
