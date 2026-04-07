import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { useAuthStore } from "@/stores/auth-store";

export default function IndexScreen() {
  const initialized = useAuthStore((state) => state.initialized);
  const previewMode = useAuthStore((state) => state.previewMode);
  const status = useAuthStore((state) => state.status);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return <Redirect href={previewMode || status === "signed_in" ? "/dashboard" : "/login"} />;
}
