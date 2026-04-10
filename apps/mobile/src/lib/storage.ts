import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { StateStorage } from "zustand/middleware";

type PersistBackend = "memory" | "mmkv" | "web";
export type StorageTier = "encrypted_degraded" | "full" | "memory_only";

export interface StorageAvailability {
  appBackend: PersistBackend;
  authBackend: PersistBackend;
  mmkvAvailable: boolean;
  prefsBackend: PersistBackend;
  secureStoreAvailable: boolean;
  tier: StorageTier;
}

type SyncKeyValueStorage = StateStorage & {
  backend: PersistBackend;
  clear: () => void;
  keys: () => string[];
};

type AsyncKeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

type MMKVLike = {
  clearAll: () => void;
  getAllKeys: () => string[];
  getString: (key: string) => string | undefined;
  remove: (key: string) => boolean;
  set: (key: string, value: string) => void;
};

const secretSecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const USER_SCOPED_STORAGE_KEYS = {
  auth: "eztrack-mobile-auth",
  coachMarks: "eztrack-mobile-coach-marks",
  drafts: "eztrack-mobile-drafts",
  filters: "eztrack-mobile-filters",
  offline: "eztrack-mobile-offline",
  organization: "eztrack-mobile-org",
  recentSearches: "eztrack-mobile-recent-searches",
} as const;

const userScopedStorageKeyList = Object.values(USER_SCOPED_STORAGE_KEYS);

function createMemoryStorage(namespace: string): SyncKeyValueStorage {
  const memory = new Map<string, string>();

  return {
    backend: "memory",
    clear() {
      memory.clear();
    },
    getItem(key) {
      return memory.get(`${namespace}:${key}`) ?? null;
    },
    keys() {
      return Array.from(memory.keys())
        .filter((key) => key.startsWith(`${namespace}:`))
        .map((key) => key.slice(namespace.length + 1));
    },
    removeItem(key) {
      memory.delete(`${namespace}:${key}`);
    },
    setItem(key, value) {
      memory.set(`${namespace}:${key}`, value);
    },
  };
}

function createWebStorage(namespace: string): SyncKeyValueStorage {
  const memoryFallback = createMemoryStorage(namespace);

  const hasWindowStorage = () =>
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";

  const toScopedKey = (key: string) => `${namespace}:${key}`;

  return {
    backend: "web",
    clear() {
      if (!hasWindowStorage()) {
        memoryFallback.clear();
        return;
      }

      for (const key of this.keys()) {
        window.localStorage.removeItem(toScopedKey(key));
      }
    },
    getItem(key) {
      if (!hasWindowStorage()) {
        return memoryFallback.getItem(key);
      }

      return window.localStorage.getItem(toScopedKey(key));
    },
    keys() {
      if (!hasWindowStorage()) {
        return memoryFallback.keys();
      }

      const keys: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith(`${namespace}:`)) {
          keys.push(key.slice(namespace.length + 1));
        }
      }
      return keys;
    },
    removeItem(key) {
      if (!hasWindowStorage()) {
        memoryFallback.removeItem(key);
        return;
      }

      window.localStorage.removeItem(toScopedKey(key));
    },
    setItem(key, value) {
      if (!hasWindowStorage()) {
        memoryFallback.setItem(key, value);
        return;
      }

      window.localStorage.setItem(toScopedKey(key), value);
    },
  };
}

function createMMKVStorage(id: string): SyncKeyValueStorage | null {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    const { createMMKV } = require("react-native-mmkv") as {
      createMMKV: (config: { id: string }) => MMKVLike;
    };
    const storage = createMMKV({ id });

    const probeKey = "__storage_probe__";
    storage.set(probeKey, "ok");
    const probeValue = storage.getString(probeKey);
    storage.remove(probeKey);

    if (probeValue !== "ok") {
      throw new Error("MMKV probe failed.");
    }

    return {
      backend: "mmkv",
      clear() {
        storage.clearAll();
      },
      getItem(key) {
        return storage.getString(key) ?? null;
      },
      keys() {
        return storage.getAllKeys();
      },
      removeItem(key) {
        storage.remove(key);
      },
      setItem(key, value) {
        storage.set(key, value);
      },
    };
  } catch (error) {
    console.warn(`[Storage] MMKV unavailable for "${id}", using memory fallback.`, error);
    return null;
  }
}

function createSecureStoreAdapter(
  options: SecureStore.SecureStoreOptions
): AsyncKeyValueStorage {
  const memoryFallback = new Map<string, string>();

  return {
    async getItem(key) {
      if (Platform.OS === "web") {
        if (typeof window === "undefined") {
          return memoryFallback.get(key) ?? null;
        }

        return window.localStorage.getItem(key);
      }

      try {
        return await SecureStore.getItemAsync(key, options);
      } catch (error) {
        console.warn("[Storage] SecureStore read failed, using memory fallback.", error);
        return memoryFallback.get(key) ?? null;
      }
    },
    async removeItem(key) {
      if (Platform.OS === "web") {
        if (typeof window === "undefined") {
          memoryFallback.delete(key);
          return;
        }

        window.localStorage.removeItem(key);
        return;
      }

      try {
        await SecureStore.deleteItemAsync(key, options);
      } catch (error) {
        console.warn("[Storage] SecureStore delete failed, using memory fallback.", error);
        memoryFallback.delete(key);
      }
    },
    async setItem(key, value) {
      if (Platform.OS === "web") {
        if (typeof window === "undefined") {
          memoryFallback.set(key, value);
          return;
        }

        window.localStorage.setItem(key, value);
        return;
      }

      try {
        await SecureStore.setItemAsync(key, value, options);
      } catch (error) {
        console.warn("[Storage] SecureStore write failed, using memory fallback.", error);
        memoryFallback.set(key, value);
      }
    },
  };
}

function createAsyncStorageAdapter(
  storage: SyncKeyValueStorage
): AsyncKeyValueStorage {
  return {
    async getItem(key) {
      return storage.getItem(key);
    },
    async removeItem(key) {
      storage.removeItem(key);
    },
    async setItem(key, value) {
      storage.setItem(key, value);
    },
  };
}

const prefsStorageNative = createMMKVStorage("mmkv-prefs");
const appStorageNative = createMMKVStorage("mmkv-app");
const authStorageNative = createMMKVStorage("auth");

export const prefsStorage =
  Platform.OS === "web"
    ? createWebStorage("mmkv-prefs")
    : prefsStorageNative ?? createMemoryStorage("mmkv-prefs");

export const appStorage =
  Platform.OS === "web"
    ? createWebStorage("mmkv-app")
    : appStorageNative ?? createMemoryStorage("mmkv-app");

const authSessionStorage =
  Platform.OS === "web"
    ? createWebStorage("mmkv-auth")
    : authStorageNative ?? createMemoryStorage("mmkv-auth");

export const authStorage = createAsyncStorageAdapter(authSessionStorage);
export const secretStorage = createSecureStoreAdapter(secretSecureStoreOptions);

export const persistStorage = appStorage;

export function clearUserScopedStorage() {
  for (const key of userScopedStorageKeyList) {
    appStorage.removeItem(key);
  }

  authSessionStorage.clear();
}

async function probeSecureStore() {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      return false;
    }

    const probeKey = "__secure_probe__";
    await SecureStore.setItemAsync(probeKey, "ok", secretSecureStoreOptions);
    const value = await SecureStore.getItemAsync(probeKey, secretSecureStoreOptions);
    await SecureStore.deleteItemAsync(probeKey, secretSecureStoreOptions);
    return value === "ok";
  } catch (error) {
    console.warn("[Storage] SecureStore probe failed.", error);
    return false;
  }
}

function resolveTier(secureStoreAvailable: boolean) {
  const mmkvAvailable =
    prefsStorage.backend === "mmkv" &&
    appStorage.backend === "mmkv" &&
    authSessionStorage.backend === "mmkv";

  if (mmkvAvailable && secureStoreAvailable) {
    return "full" as const;
  }

  if (mmkvAvailable || secureStoreAvailable || Platform.OS === "web") {
    return "encrypted_degraded" as const;
  }

  return "memory_only" as const;
}

export async function getStorageAvailability(): Promise<StorageAvailability> {
  const secureStoreAvailable = await probeSecureStore();
  const mmkvAvailable =
    prefsStorage.backend === "mmkv" &&
    appStorage.backend === "mmkv" &&
    authSessionStorage.backend === "mmkv";

  return {
    appBackend: appStorage.backend,
    authBackend: authSessionStorage.backend,
    mmkvAvailable,
    prefsBackend: prefsStorage.backend,
    secureStoreAvailable,
    tier: resolveTier(secureStoreAvailable),
  };
}
