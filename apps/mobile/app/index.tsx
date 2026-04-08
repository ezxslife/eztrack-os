import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { useAuthStore } from "@/stores/auth-store";

export default function IndexScreen() {
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

  return (
    <Redirect
      href={previewMode || authLifecycle === "active" ? "/dashboard" : "/login"}
    />
  );
}
