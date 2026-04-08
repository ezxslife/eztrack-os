import { useEffect } from "react";

import { probeQueryCacheAvailability } from "@/lib/cache/sqlite-cache";
import { getStorageAvailability } from "@/lib/storage";
import { useStorageHealthStore } from "@/stores/storage-health-store";

export function StorageHealthBootstrap() {
  const setQueryCacheAvailability = useStorageHealthStore(
    (state) => state.setQueryCacheAvailability
  );
  const setAvailability = useStorageHealthStore((state) => state.setAvailability);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      getStorageAvailability(),
      probeQueryCacheAvailability(),
    ]).then(([availability, queryCache]) => {
      if (!isMounted) {
        return;
      }

      setAvailability(availability);
      setQueryCacheAvailability(queryCache);

      if (availability.tier !== "full" || !queryCache.available) {
        console.warn(
          `[Storage] Running in ${availability.tier} mode (prefs=${availability.prefsBackend}, app=${availability.appBackend}, auth=${availability.authBackend}, secure=${availability.secureStoreAvailable}, queryCache=${queryCache.backend}, encrypted=${queryCache.encrypted}, cipher=${queryCache.cipherVersion ?? "none"}${queryCache.reason ? `, reason=${queryCache.reason}` : ""}).`
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setAvailability, setQueryCacheAvailability]);

  return null;
}
