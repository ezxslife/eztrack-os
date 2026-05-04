"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, User } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { completeProfile, getUser } from "@/lib/supabase/auth";

/**
 * After phone OTP / OAuth, new users land here to set name + (optionally) avatar.
 * Avatar upload UI is deferred — operators can add their photo from the
 * Settings page later.
 */
function ProfileCompletionContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/welcome");
        return;
      }
      setUserId(user.id);
      // Pre-fill from OAuth metadata if present
      const meta = user.user_metadata ?? {};
      setFirstName((meta.first_name as string) ?? (meta.given_name as string) ?? "");
      setLastName((meta.last_name as string) ?? (meta.family_name as string) ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!userId) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    setSubmitting(true);
    try {
      await completeProfile({
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.push("/auth/otp/callback?next=/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile. Please try again.");
      setSubmitting(false);
    }
  };

  if (!userId) {
    return null; // brief loading flash; redirect happens in effect
  }

  return (
    <AuthShell>
      <AuthCard data-auth-card className="animate-fade-in">
        <div className="mb-6">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--action-primary)]">
            <User className="h-4.5 w-4.5" />
          </div>
          <h1 className="text-[clamp(1.7rem,4.5vw,2.1rem)] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Tell us your name
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            Used on incidents, dispatch logs, and post-event reports.
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              autoComplete="given-name"
              autoFocus
              id="firstName"
              label="First name"
              name="firstName"
              onChange={(e) => setFirstName(e.target.value)}
              required
              type="text"
              value={firstName}
            />
            <Input
              autoComplete="family-name"
              id="lastName"
              label="Last name"
              name="lastName"
              onChange={(e) => setLastName(e.target.value)}
              required
              type="text"
              value={lastName}
            />
          </div>

          <Button type="submit" variant="default" size="lg" isLoading={submitting} className="mt-2 w-full">
            <span>{submitting ? "Saving" : "Continue"}</span>
            {!submitting ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

export default function ProfileCompletionPage() {
  return (
    <Suspense>
      <ProfileCompletionContent />
    </Suspense>
  );
}
