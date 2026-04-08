import { clearCachedQueryData } from "@/lib/cache/sqlite-cache";
import { clearUserScopedStorage } from "@/lib/storage";
import { useAuthStore } from "@/stores/auth-store";
import { useDraftStore } from "@/stores/draft-store";
import { useFilterStore } from "@/stores/filter-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useOrganizationStore } from "@/stores/organization-store";

export async function clearUserScopedAppData() {
  clearUserScopedStorage();
  await clearCachedQueryData();
  useAuthStore.getState().reset();
  useDraftStore.getState().reset();
  useFilterStore.getState().reset();
  useOfflineStore.getState().reset();
  useOrganizationStore.getState().reset();
}
