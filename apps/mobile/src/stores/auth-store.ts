import type { Profile } from "@eztrack/shared";
import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { appEnv } from "@/lib/env";
import { previewProfile } from "@/data/mock";

export type AuthStatus = "booting" | "signed_out" | "signed_in";

interface AuthStore {
  _hasHydrated: boolean;
  authEnabled: boolean;
  error: string | null;
  initialized: boolean;
  previewMode: boolean;
  profile: Profile | null;
  session: Session | null;
  status: AuthStatus;
  user: User | null;
  enterPreviewMode: () => void;
  setBootstrapped: (input: {
    error?: string | null;
    profile: Profile | null;
    session: Session | null;
    user: User | null;
  }) => void;
  setSignedOut: (error?: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  _hasHydrated: true,
  authEnabled: appEnv.authEnabled,
  error: null,
  initialized: false,
  previewMode: false,
  profile: null,
  session: null,
  status: "booting",
  user: null,
  enterPreviewMode: () =>
    set({
      error: null,
      initialized: true,
      previewMode: true,
      profile: previewProfile,
      session: null,
      status: "signed_out",
      user: null,
    }),
  setBootstrapped: ({ error = null, profile, session, user }) =>
    set({
      error,
      initialized: true,
      previewMode: false,
      profile,
      session,
      status: session && profile ? "signed_in" : "signed_out",
      user,
    }),
  setSignedOut: (error = null) =>
    set({
      error,
      initialized: true,
      previewMode: false,
      profile: null,
      session: null,
      status: "signed_out",
      user: null,
    }),
}));
