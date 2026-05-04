"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendPrimaryOTP, verifyPrimaryOTP } from "@/lib/supabase/auth";

/**
 * 6-digit OTP entry for phone sign-in. After verify:
 *   - new user → /welcome/profile-completion
 *   - returning user → /auth/otp/callback?next=/dashboard (server hop validates session)
 */
function PhoneVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  if (!phone) {
    // No phone in query — bounce back to entry.
    if (typeof window !== "undefined") router.replace("/welcome/phone-signin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your text message.");
      return;
    }

    setVerifying(true);
    try {
      const result = await verifyPrimaryOTP("phone", phone, code);
      if (result.isNewUser) {
        router.push("/welcome/profile-completion");
      } else {
        router.push("/auth/otp/callback?next=/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendNotice(null);
    setResending(true);
    try {
      await sendPrimaryOTP("phone", phone);
      setResendNotice("New code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard data-auth-card className="animate-fade-in">
        <button
          type="button"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/10"
          onClick={() => router.push("/welcome/phone-signin")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="mb-6">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--action-primary)]">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <h1 className="text-[clamp(1.7rem,4.5vw,2.1rem)] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Enter your code
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            We sent a 6-digit code to <span className="font-medium text-[var(--text-primary)]">{maskPhone(phone)}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div
              aria-live="polite"
              role="alert"
              className="rounded-2xl border border-[var(--status-critical-border)] bg-[var(--status-critical-surface)] px-4 py-3 text-[13px] leading-6 text-[var(--status-critical)]"
            >
              {error}
            </div>
          ) : null}

          {resendNotice ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] leading-6 text-[var(--text-secondary)]"
            >
              {resendNotice}
            </div>
          ) : null}

          <Input
            autoComplete="one-time-code"
            autoFocus
            id="code"
            inputMode="numeric"
            label="6-digit code"
            maxLength={6}
            name="code"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            pattern="\d{6}"
            placeholder="123456"
            required
            spellCheck={false}
            type="text"
            value={code}
          />

          <Button type="submit" variant="default" size="lg" isLoading={verifying} className="mt-2 w-full">
            <span>{verifying ? "Verifying" : "Verify"}</span>
            {!verifying ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[12px] leading-5 text-[var(--text-tertiary)]">Didn&apos;t get a code?</span>
          <button
            type="button"
            disabled={resending || verifying}
            onClick={handleResend}
            className="text-[13px] font-medium text-[var(--action-primary)] underline-offset-4 hover:underline disabled:opacity-60"
          >
            {resending ? "Resending…" : "Resend"}
          </button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 4)} ••• ${phone.slice(-4)}`;
}

export default function PhoneVerifyPage() {
  return (
    <Suspense>
      <PhoneVerifyContent />
    </Suspense>
  );
}
