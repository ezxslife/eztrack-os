import { create } from "zustand";

import type { QueryCacheAvailability } from "@/lib/cache/sqlite-cache";
import type { StorageAvailability } from "@/lib/storage";

interface StorageHealthStore extends StorageAvailability {
  probed: boolean;
  queryCache: QueryCacheAvailability;
  sqliteAvailable: boolean;
  setAvailability: (availability: StorageAvailability) => void;
  setQueryCacheAvailability: (availability: QueryCacheAvailability) => void;
}

export const useStorageHealthStore = create<StorageHealthStore>((set) => ({
  appBackend: "memory",
  authBackend: "memory",
  mmkvAvailable: false,
  prefsBackend: "memory",
  probed: false,
  queryCache: {
    available: false,
    backend: "disabled",
    cipherVersion: null,
    encrypted: false,
    reason: null,
    strict: true,
  },
  secureStoreAvailable: false,
  setAvailability: (availability) =>
    set({
      ...availability,
      probed: true,
    }),
  setQueryCacheAvailability: (availability) =>
    set({
      queryCache: availability,
      sqliteAvailable: availability.available,
    }),
  sqliteAvailable: false,
  tier: "memory_only",
}));
