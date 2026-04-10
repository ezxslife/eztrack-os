import { type ReactNode } from "react";

import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { useAuthStore } from "@/stores/auth-store";

interface RouteGateProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RouteGateProps) {
  const authLifecycle = useAuthStore((state) => state.authLifecycle);
  const initialized = useAuthStore((state) => state.initialized);
  const previewMode = useAuthStore((state) => state.previewMode);

  if (
    !initialized ||
    (!previewMode &&
      (authLifecycle === "initializing" || authLifecycle === "authenticating"))
  ) {
    return <LoadingScreen />;
  }

  if (!previewMode && authLifecycle !== "active") {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}

export function RequireGuest({ children }: RouteGateProps) {
  const authLifecycle = useAuthStore((state) => state.authLifecycle);
  const initialized = useAuthStore((state) => state.initialized);
  const previewMode = useAuthStore((state) => state.previewMode);

  if (!initialized || authLifecycle === "initializing") {
    return <LoadingScreen />;
  }

  if (previewMode || authLifecycle === "active") {
    return <Redirect href="/dashboard" />;
  }

  return <>{children}</>;
}
