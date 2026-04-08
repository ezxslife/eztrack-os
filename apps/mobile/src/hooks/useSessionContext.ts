import { useAuthStore } from "@/stores/auth-store";
import { useOrganizationStore } from "@/stores/organization-store";

export function useSessionContext() {
  const authEnabled = useAuthStore((state) => state.authEnabled);
  const authLifecycle = useAuthStore((state) => state.authLifecycle);
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const previewMode = useAuthStore((state) => state.previewMode);
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);
  const selectedOrganizationId = useOrganizationStore(
    (state) => state.selectedOrganizationId
  );
  const selectedPropertyId = useOrganizationStore(
    (state) => state.selectedPropertyId
  );

  return {
    authEnabled,
    authLifecycle,
    canAccessProtected: previewMode || authLifecycle === "active",
    initialized,
    isAuthenticated,
    orgId: selectedOrganizationId ?? profile?.org_id ?? null,
    previewMode,
    profile,
    propertyId: selectedPropertyId ?? profile?.property_id ?? null,
    status,
    usePreviewData: previewMode || !authEnabled,
  };
}
