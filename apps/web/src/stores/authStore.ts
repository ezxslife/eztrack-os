import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@eztrack/shared";

interface AuthState {
  user: Profile | null;
  session: unknown | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: Profile | null) => void;
  setSession: (session: unknown | null) => void;
  signOut: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: user !== null }),

      setSession: (session) =>
        set({ session }),

      signOut: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
        }),

      setLoading: (isLoading) =>
        set({ isLoading }),
    }),
    {
      name: "eztrack-auth",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
