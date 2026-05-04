"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail, Phone, Shield } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { signInWithGoogle, signInWithApple } from "@/lib/supabase/auth";

/**
 * Multi-method sign-in entry point. Ports the ezxs-os "welcome" screen.
 *
 * Routes:
 *   /welcome              → this page (entry)
 *   /welcome/phone-signin → phone OTP flow
 *   /welcome/phone-verify → OTP entry
 *   /login                → existing email+password fallback (legacy)
 */
function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(
    searchParams.get("error") ? decodeURIComponent(searchParams.get("reason") ?? "Sign-in failed. Please try again.") : null,
  );

  const handleGoogle = async () => {
    setOauthError(null);
    setOauthLoading("google");
    try {
      await signInWithGoogle();
      // Supabase redirects; if it returns we never reach here.
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "Google sign-in failed");
      setOauthLoading(null);
    }
  };

  const handleApple = async () => {
    setOauthError(null);
    setOauthLoading("apple");
    try {
      await signInWithApple();
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "Apple sign-in failed");
      setOauthLoading(null);
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
        </div>

        <div className="mb-6">
          <h1 className="text-[clamp(1.9rem,5vw,2.35rem)] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
            Welcome
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            Sign in to your venue ops + event-day workspace.
          </p>
        </div>

        {oauthError ? (
          <div
            aria-live="polite"
            role="alert"
            className="mb-4 rounded-2xl border border-[var(--status-critical-border)] bg-[var(--status-critical-surface)] px-4 py-3 text-[13px] leading-6 text-[var(--status-critical)]"
          >
            {oauthError}
          </div>
        ) : null}

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={oauthLoading !== null}
            isLoading={oauthLoading === "google"}
            onClick={handleGoogle}
          >
            <GoogleIcon className="h-4 w-4 shrink-0" />
            <span>{oauthLoading === "google" ? "Continuing with Google" : "Continue with Google"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={oauthLoading !== null}
            isLoading={oauthLoading === "apple"}
            onClick={handleApple}
          >
            <AppleIcon className="h-4 w-4 shrink-0" />
            <span>{oauthLoading === "apple" ? "Continuing with Apple" : "Continue with Apple"}</span>
          </Button>

          <div className="relative my-4 flex items-center" aria-hidden="true">
            <div className="h-px flex-1 bg-[var(--border-default)]" />
            <span className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">or</span>
            <div className="h-px flex-1 bg-[var(--border-default)]" />
          </div>

          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full"
            disabled={oauthLoading !== null}
            onClick={() => router.push("/welcome/phone-signin")}
          >
            <Phone className="h-4 w-4 shrink-0" />
            <span>Continue with phone</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            disabled={oauthLoading !== null}
            onClick={() => router.push("/login")}
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span>Use email + password</span>
          </Button>
        </div>

        <p className="mt-6 text-center text-[12px] leading-5 text-[var(--text-tertiary)]">
          By continuing you agree to our{" "}
          <Link href="/legal/terms" className="text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--text-primary)]">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--text-primary)]">
            Privacy Policy
          </Link>
          .
        </p>
      </AuthCard>
    </AuthShell>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.85 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.67-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.67 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.3 1.196-3.04.762-.91 2.06-1.59 3.107-1.62.03.13.04.24.04.43zm4.565 16.07c-.45 1.04-.65 1.5-1.23 2.4-.81 1.27-1.96 2.85-3.38 2.86-1.26.01-1.59-.82-3.3-.81-1.71.01-2.07.83-3.34.81-1.42-.02-2.5-1.43-3.31-2.7-2.27-3.55-2.51-7.71-1.11-9.93.99-1.58 2.55-2.5 4.02-2.5 1.5 0 2.45.82 3.69.82 1.21 0 1.94-.82 3.68-.82 1.31 0 2.7.71 3.69 1.94-3.24 1.78-2.71 6.42 1.59 7.93z"/>
    </svg>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeContent />
    </Suspense>
  );
}
