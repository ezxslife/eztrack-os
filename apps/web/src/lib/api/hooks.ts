/**
 * Auth hooks ported from ezxs-os/apps/web/src/lib/api/hooks.ts.
 *
 * - `useAuth()` — current Supabase user + loading state.
 * - `useRequireAuth(redirectTo?)` — guards client routes; pushes to login if unauthed.
 * - `useOrganization()` — current organization stub. Returns null until an org-fetch
 *    query is wired (this matches the upstream ezxs-os TODO).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    let cancelled = false;
    async function bootstrap() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    }
    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setToken(session?.access_token ?? null);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    logout,
  };
}

export function useRequireAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  return { isAuthenticated, loading };
}

export function useOrganization() {
  // TODO: fetch organization via existing eztrack-os queries layer once
  // org_id → organizations join is exposed. Currently mirrors the
  // ezxs-os stub: returns null while preserving the API shape.
  return {
    organization: null as { id: string; name: string; venue_mode_default?: string } | null,
    loading: false,
    hasOrganization: false,
  };
}
