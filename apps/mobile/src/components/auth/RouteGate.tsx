import { type ReactNode } from "react";

import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { useAuthStore } from "@/stores/auth-store";

interface RouteGateProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RouteGateProps) {
  const initialized = useAuthStore((state) => state.initialized);
  const previewMode = useAuthStore((state) => state.previewMode);
  const status = useAuthStore((state) => state.status);

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (!previewMode && status !== "signed_in") {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}

export function RequireGuest({ children }: RouteGateProps) {
  const initialized = useAuthStore((state) => state.initialized);
  const previewMode = useAuthStore((state) => state.previewMode);
  const status = useAuthStore((state) => state.status);

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (previewMode || status === "signed_in") {
    return <Redirect href="/dashboard" />;
  }

  return <>{children}</>;
}
