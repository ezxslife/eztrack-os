"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendPrimaryOTP } from "@/lib/supabase/auth";

/**
 * Phone OTP entry. The user types an E.164 phone; we send them an SMS code
 * via Supabase + Twilio. Then redirects to /welcome/phone-verify.
 *
 * v1 keeps the country picker simple — the user types `+1xxxxxxxxxx`.
 * v1.5 (mobile) ships a CountryPhoneInput; web can adopt later.
 */
function PhoneSignInContent() {
  const router = useRouter();
  const [phone, setPhone] = useState("+1");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmed = phone.trim();
    if (!isPlausibleE164(trimmed)) {
      setError("Phone must start with + and your country code (e.g. +14155550100).");
      return;
    }

    setSubmitting(true);
    try {
      await sendPrimaryOTP("phone", trimmed);
      router.push(`/welcome/phone-verify?phone=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard data-auth-card className="animate-fade-in">
        <button
          type="button"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/10"
          onClick={() => router.push("/welcome")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="mb-6">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--action-primary)]">
            <Phone className="h-4.5 w-4.5" />
          </div>
          <h1 className="text-[clamp(1.7rem,4.5vw,2.1rem)] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Your phone
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            We&apos;ll send you a 6-digit code by text. Standard SMS rates apply.
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

          <Input
            autoComplete="tel"
            autoFocus
            id="phone"
            inputMode="tel"
            label="Phone (with country code)"
            name="phone"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+14155550100"
            required
            spellCheck={false}
            type="tel"
            value={phone}
          />

          <Button type="submit" variant="default" size="lg" isLoading={submitting} className="mt-2 w-full">
            <span>{submitting ? "Sending code" : "Send code"}</span>
            {!submitting ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
          </Button>
        </form>

        <p className="mt-4 text-[12px] leading-5 text-[var(--text-tertiary)]">
          Message frequency: 1 per attempt. Reply STOP to unsubscribe.
        </p>
      </AuthCard>
    </AuthShell>
  );
}

function isPlausibleE164(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

export default function PhoneSignInPage() {
  return (
    <Suspense>
      <PhoneSignInContent />
    </Suspense>
  );
}
