import {
  useEffect,
  useRef,
} from "react";

import {
  focusManager,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import {
  AppState,
  type AppStateStatus,
} from "react-native";

import { fetchCurrentProfile } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";
import { clearUserScopedAppData } from "@/lib/user-scoped-data";
import { useAuthStore } from "@/stores/auth-store";
import { useOrganizationStore } from "@/stores/organization-store";

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
  const previewMode = useAuthStore((state) => state.previewMode);
  const setActive = useAuthStore((state) => state.setActive);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);
  const setContext = useOrganizationStore((state) => state.setContext);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!appEnv.authEnabled) {
      setSignedOut(null);
      return () => {
        isMounted = false;
      };
    }

    const supabase = getSupabase();

    const syncSession = async (
      session: Session | null,
      event?: AuthChangeEvent
    ) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        const shouldClearUserData =
          activeUserIdRef.current !== null || previewMode;
        const pendingLogoutReason =
          useAuthStore.getState().pendingLogoutReason;
        const logoutReason =
          pendingLogoutReason ??
          (shouldClearUserData ? "session_ended" : null);

        activeUserIdRef.current = null;
        queryClient.clear();
        if (shouldClearUserData) {
          await clearUserScopedAppData();
        }
        setContext({
          organizationId: null,
          propertyId: null,
        });
        setSignedOut(
          null,
          event === "SIGNED_OUT" && pendingLogoutReason === null
            ? "manual_sign_out"
            : logoutReason
        );
        return;
      }

      if (
        activeUserIdRef.current !== null &&
        activeUserIdRef.current !== session.user.id
      ) {
        queryClient.clear();
        await clearUserScopedAppData();
      }

      activeUserIdRef.current = session.user.id;
      setAuthenticating();
      const profile = await resolveProfile(session.user.id);

      if (!isMounted) {
        return;
      }

      if (!profile) {
        activeUserIdRef.current = null;
        queryClient.clear();
        await clearUserScopedAppData();
        setContext({
          organizationId: null,
          propertyId: null,
        });
        setAuthError(
          "Your user exists, but the mobile app could not load the linked profile.",
          "profile_unavailable"
        );
        return;
      }

      setContext({
        organizationId: profile.org_id,
        propertyId: profile.property_id,
      });
      setActive({
        error: null,
        profile,
        session,
        user: session.user,
      });
    };

    setAuthenticating();

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        if (!isMounted) {
          return;
        }

        queryClient.clear();
        setAuthError(error.message, "auth_error");
        return;
      }

      await syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void syncSession(session, event);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [
    previewMode,
    queryClient,
    setActive,
    setAuthenticating,
    setAuthError,
    setContext,
    setSignedOut,
  ]);

  useEffect(() => {
    if (!appEnv.authEnabled) {
      return;
    }

    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        const supabase = getSupabase();

        if (state === "active") {
          focusManager.setFocused(true);
          supabase.auth.startAutoRefresh();
        } else {
          focusManager.setFocused(false);
          supabase.auth.stopAutoRefresh();
        }
      }
    );

    return () => {
      sub.remove();
    };
  }, []);

  return null;
}
