"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Placeholder sign-in — bypass to dashboard
    await new Promise((r) => setTimeout(r, 400));
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm px-6 animate-fade-in">
      {/* Logo / Title */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--eztrack-primary-500)]">
          <Shield size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          EZTrack
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
          Operations Platform
        </p>
      </div>

      {/* Form card */}
      <div className="surface-card p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-[var(--red-50,#fef2f2)] dark:bg-[var(--red-900,#7f1d1d)]/20 px-3 py-2.5 text-[13px] text-[var(--red-600,#dc2626)] dark:text-[var(--red-400,#f87171)] border border-[var(--red-200,#fecaca)] dark:border-[var(--red-800,#991b1b)]/30">
              {error}
            </div>
          )}

          <Input
            label="Email"
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@eztrack.io"
          />

          <Input
            label="Password"
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            isLoading={loading}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        {/* Forgot password */}
        <div className="mt-4 text-center">
          <a
            href="#"
            className="text-[12px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--interactive)]"
          >
            Forgot password?
          </a>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-[11px] text-[var(--text-disabled)]">
        Secure operations management
      </p>
    </div>
  );
}
