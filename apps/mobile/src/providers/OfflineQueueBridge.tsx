import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { processPendingActions } from "@/lib/offline/queue";
import { useAuthStore } from "@/stores/auth-store";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";

export function OfflineQueueBridge() {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const offlineHydrated = useOfflineStore((state) => state._hasHydrated);
  const pendingCount = useOfflineStore(
    (state) =>
      state.pendingActions.filter((action) => action.syncState === "pending")
        .length
  );
  const processing = useOfflineStore((state) => state.processing);
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (
      !offlineHydrated ||
      !isOnline ||
      processing ||
      pendingCount === 0 ||
      status !== "signed_in" ||
      !profile
    ) {
      return;
    }

    let isMounted = true;

    void processPendingActions({
      id: profile.id,
      orgId: profile.org_id,
      propertyId: profile.property_id,
    }).then((result) => {
      if (!isMounted || result.processedCount === 0) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["dispatches"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["incidents"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["daily-logs"],
      });
    });

    return () => {
      isMounted = false;
    };
  }, [
    isOnline,
    offlineHydrated,
    pendingCount,
    processing,
    profile,
    queryClient,
    status,
  ]);

  return null;
}
