import type { Profile } from "@eztrack/shared";
import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import { previewProfile } from "@/data/mock";
import { appEnv } from "@/lib/env";
import {
  USER_SCOPED_STORAGE_KEYS,
  appStorage,
} from "@/lib/storage";

export type AuthStatus = "booting" | "signed_out" | "signed_in";
export type AuthLifecycle =
  | "initializing"
  | "authenticating"
  | "active"
  | "signed_out"
  | "error";
export type LogoutReason =
  | "auth_error"
  | "manual_sign_out"
  | "preview_exit"
  | "profile_unavailable"
  | "session_ended";

const ALLOWED_TRANSITIONS: Record<AuthLifecycle, AuthLifecycle[]> = {
  active: ["signed_out", "error"],
  authenticating: ["active", "signed_out", "error"],
  error: ["initializing", "authenticating", "signed_out"],
  initializing: ["authenticating", "active", "signed_out", "error"],
  signed_out: ["authenticating", "active", "error"],
};

interface AuthStore {
  _hasHydrated: boolean;
  authEnabled: boolean;
  authLifecycle: AuthLifecycle;
  error: string | null;
  initialized: boolean;
  isAuthenticated: boolean;
  lastLogoutReason: LogoutReason | null;
  pendingLogoutReason: LogoutReason | null;
  previewMode: boolean;
  profile: Profile | null;
  session: Session | null;
  status: AuthStatus;
  user: User | null;
  clearLogoutIntent: () => void;
  enterPreviewMode: () => void;
  reset: () => void;
  setActive: (input: {
    error?: string | null;
    profile: Profile | null;
    session: Session | null;
    user: User | null;
  }) => void;
  setAuthenticating: () => void;
  setAuthError: (error: string, logoutReason?: LogoutReason | null) => void;
  setLogoutIntent: (reason: LogoutReason | null) => void;
  setSignedOut: (error?: string | null, logoutReason?: LogoutReason | null) => void;
  transitionLifecycle: (next: AuthLifecycle) => boolean;
}

const authBaseState = {
  _hasHydrated: false,
  authEnabled: appEnv.authEnabled,
  authLifecycle: "initializing" as AuthLifecycle,
  error: null,
  initialized: false,
  isAuthenticated: false,
  lastLogoutReason: null,
  pendingLogoutReason: null,
  previewMode: false,
  profile: null,
  session: null,
  status: "booting" as AuthStatus,
  user: null,
};

function getStatusFromLifecycle(lifecycle: AuthLifecycle): AuthStatus {
  if (lifecycle === "active") {
    return "signed_in";
  }

  if (lifecycle === "initializing" || lifecycle === "authenticating") {
    return "booting";
  }

  return "signed_out";
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...authBaseState,
      clearLogoutIntent: () => set({ pendingLogoutReason: null }),
      enterPreviewMode: () =>
        set({
          authLifecycle: "signed_out",
          error: null,
          initialized: true,
          isAuthenticated: false,
          lastLogoutReason: null,
          pendingLogoutReason: null,
          previewMode: true,
          profile: previewProfile,
          session: null,
          status: "signed_out",
          user: null,
        }),
      reset: () =>
        set({
          ...authBaseState,
          _hasHydrated: true,
          lastLogoutReason: get().lastLogoutReason,
        }),
      setActive: ({ error = null, profile, session, user }) => {
        const lifecycleChanged = get().transitionLifecycle("active");

        if (!lifecycleChanged && get().authLifecycle !== "active") {
          return;
        }

        set({
          error,
          initialized: true,
          isAuthenticated: Boolean(session && profile),
          lastLogoutReason: null,
          pendingLogoutReason: null,
          previewMode: false,
          profile,
          session,
          status: "signed_in",
          user,
        });
      },
      setAuthenticating: () => {
        const lifecycleChanged = get().transitionLifecycle("authenticating");

        if (!lifecycleChanged && get().authLifecycle !== "authenticating") {
          return;
        }

        set((state) => ({
          error: null,
          initialized: state.initialized,
          isAuthenticated: false,
          pendingLogoutReason: null,
          previewMode: false,
          status: "booting",
        }));
      },
      setAuthError: (error, logoutReason = null) => {
        const lifecycleChanged = get().transitionLifecycle("error");

        if (!lifecycleChanged && get().authLifecycle !== "error") {
          return;
        }

        set({
          error,
          initialized: true,
          isAuthenticated: false,
          lastLogoutReason: logoutReason,
          pendingLogoutReason: null,
          previewMode: false,
          profile: null,
          session: null,
          status: "signed_out",
          user: null,
        });
      },
      setLogoutIntent: (pendingLogoutReason) =>
        set({
          pendingLogoutReason,
        }),
      setSignedOut: (error = null, logoutReason = null) => {
        const lifecycleChanged = get().transitionLifecycle("signed_out");

        if (!lifecycleChanged && get().authLifecycle !== "signed_out") {
          return;
        }

        set({
          error,
          initialized: true,
          isAuthenticated: false,
          lastLogoutReason: logoutReason,
          pendingLogoutReason: null,
          previewMode: false,
          profile: null,
          session: null,
          status: "signed_out",
          user: null,
        });
      },
      transitionLifecycle: (next) => {
        const current = get().authLifecycle;

        if (current === next) {
          set({
            authLifecycle: next,
            status: getStatusFromLifecycle(next),
          });
          return true;
        }

        const allowed = ALLOWED_TRANSITIONS[current];
        if (!allowed?.includes(next)) {
          console.warn(`[AuthFSM] Invalid transition: ${current} -> ${next}`);
          return false;
        }

        set({
          authLifecycle: next,
          status: getStatusFromLifecycle(next),
        });
        return true;
      },
    }),
    {
      name: USER_SCOPED_STORAGE_KEYS.auth,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        lastLogoutReason: state.lastLogoutReason,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[AuthStore] Hydration error, using defaults", error);
        }

        queueMicrotask(() => {
          useAuthStore.setState({ _hasHydrated: true });
        });
      },
    }
  )
);
