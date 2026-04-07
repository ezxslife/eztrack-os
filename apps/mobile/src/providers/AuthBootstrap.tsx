import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { fetchCurrentProfile } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";

async function resolveProfile(userId: string) {
  try {
    return await fetchCurrentProfile(userId);
  } catch (error) {
    console.warn("Failed to load mobile profile", error);
    return null;
  }
}

export function AuthBootstrap() {
  const queryClient = useQueryClient();
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);

  useEffect(() => {
    let isMounted = true;

    if (!appEnv.authEnabled) {
      setSignedOut(null);
      return () => {
        isMounted = false;
      };
    }

    const supabase = getSupabase();

    const syncSession = async (session: Session | null) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        queryClient.clear();
        setSignedOut(null);
        return;
      }

      const profile = await resolveProfile(session.user.id);

      if (!isMounted) {
        return;
      }

      if (!profile) {
        queryClient.clear();
        setSignedOut("Your user exists, but the mobile app could not load the linked profile.");
        return;
      }

      setBootstrapped({
        error: null,
        profile,
        session,
        user: session.user,
      });
    };

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        if (!isMounted) {
          return;
        }

        queryClient.clear();
        setSignedOut(error.message);
        return;
      }

      await syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, setBootstrapped, setSignedOut]);

  return null;
}
