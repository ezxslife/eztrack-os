import { useAuthStore } from "@/stores/auth-store";

export function useSessionContext() {
  const authEnabled = useAuthStore((state) => state.authEnabled);
  const initialized = useAuthStore((state) => state.initialized);
  const previewMode = useAuthStore((state) => state.previewMode);
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);

  return {
    authEnabled,
    canAccessProtected: previewMode || status === "signed_in",
    initialized,
    orgId: profile?.org_id ?? null,
    previewMode,
    profile,
    propertyId: profile?.property_id ?? null,
    status,
    usePreviewData: previewMode || !authEnabled,
  };
}
