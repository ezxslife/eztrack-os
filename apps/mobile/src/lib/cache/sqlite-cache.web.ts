import { useEffect } from "react";

import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

import { appStorage } from "@/lib/storage";
import { useNetworkStore } from "@/stores/network-store";

const CACHE_KEY_PREFIX = "query-cache:";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ROWS = 1500;
const MAX_ENTRY_BYTES = 512 * 1024;

interface CacheRow {
  created_at: number;
  expires_at: number;
  last_accessed_at: number;
  payload: string;
  size_bytes: number;
}

export interface CachedValue<T> {
  data: T;
  expiresAt: number;
  fetchedAt: number;
  isExpired: boolean;
}

export interface QueryCacheAvailability {
  available: boolean;
  backend: "disabled" | "sqlite_encrypted" | "web_storage";
  cipherVersion: string | null;
  encrypted: boolean;
  reason: string | null;
  strict: boolean;
}

function getByteLength(value: string) {
  try {
    return new TextEncoder().encode(value).length;
  } catch {
    return value.length;
  }
}

function toFallbackKey(key: string) {
  return `${CACHE_KEY_PREFIX}${key}`;
}

function readStorageValue(key: string) {
  const value = appStorage.getItem(key);
  return typeof value === "string" ? value : null;
}

function parseRow(raw: string | null): CacheRow | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CacheRow;
  } catch (error) {
    console.warn("[WebCache] Failed to parse cached payload.", error);
    return null;
  }
}

function getRows() {
  return appStorage
    .keys()
    .filter((key) => key.startsWith(CACHE_KEY_PREFIX))
    .map((key) => ({
      key,
      row: parseRow(readStorageValue(key)),
    }))
    .filter(
      (entry): entry is { key: string; row: CacheRow } => entry.row !== null
    );
}

function trimCache() {
  const now = Date.now();
  const rows = getRows()
    .filter((entry) => {
      if (entry.row.expires_at <= now) {
        appStorage.removeItem(entry.key);
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        left.row.expires_at - right.row.expires_at ||
        left.row.last_accessed_at - right.row.last_accessed_at
    );

  while (rows.length > MAX_CACHE_ROWS) {
    const entry = rows.shift();
    if (entry) {
      appStorage.removeItem(entry.key);
    }
  }
}

export async function probeQueryCacheAvailability() {
  return {
    available: true,
    backend: "web_storage",
    cipherVersion: null,
    encrypted: false,
    reason: null,
    strict: false,
  } satisfies QueryCacheAvailability;
}

export async function clearCachedQueryData() {
  for (const key of appStorage.keys()) {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      appStorage.removeItem(key);
    }
  }
}

export async function getCachedValue<T>(
  key: string,
  options?: { allowExpired?: boolean }
): Promise<CachedValue<T> | null> {
  const now = Date.now();
  const fallbackKey = toFallbackKey(key);
  const row = parseRow(readStorageValue(fallbackKey));

  if (!row) {
    return null;
  }

  if (row.expires_at <= now && !options?.allowExpired) {
    appStorage.removeItem(fallbackKey);
    return null;
  }

  try {
    const data = JSON.parse(row.payload) as T;
    appStorage.setItem(
      fallbackKey,
      JSON.stringify({
        ...row,
        last_accessed_at: Date.now(),
      })
    );

    return {
      data,
      expiresAt: row.expires_at,
      fetchedAt: row.created_at,
      isExpired: row.expires_at <= now,
    };
  } catch (error) {
    console.warn("[WebCache] Failed to parse cached data.", error);
    appStorage.removeItem(fallbackKey);
    return null;
  }
}

export async function setCachedValue<T>(
  key: string,
  data: T,
  options?: { ttlMs?: number }
) {
  const payload = JSON.stringify(data);
  const sizeBytes = getByteLength(payload);

  if (sizeBytes > MAX_ENTRY_BYTES) {
    console.warn(
      `[WebCache] Skipping cache write for "${key}" because the payload exceeds ${MAX_ENTRY_BYTES} bytes.`
    );
    return;
  }

  const now = Date.now();
  appStorage.setItem(
    toFallbackKey(key),
    JSON.stringify({
      created_at: now,
      expires_at: now + (options?.ttlMs ?? DEFAULT_TTL_MS),
      last_accessed_at: now,
      payload,
      size_bytes: sizeBytes,
    } satisfies CacheRow)
  );
  trimCache();
}

export async function readThroughCachedQuery<T>(options: {
  cacheKey: string;
  fetcher: () => Promise<T>;
  ttlMs?: number;
}) {
  const cached = await getCachedValue<T>(options.cacheKey, {
    allowExpired: true,
  });
  const isOnline = useNetworkStore.getState().isOnline;

  if (!isOnline && cached) {
    return cached.data;
  }

  try {
    const data = await options.fetcher();
    await setCachedValue(options.cacheKey, data, {
      ttlMs: options.ttlMs,
    });
    return data;
  } catch (error) {
    if (cached) {
      return cached.data;
    }

    throw error;
  }
}

export function useHydrateQueryFromCache<T>(
  queryKey: QueryKey,
  cacheKey: string | null,
  enabled: boolean
) {
  const queryClient = useQueryClient();
  const queryHash = JSON.stringify(queryKey);

  useEffect(() => {
    if (!enabled || !cacheKey) {
      return;
    }

    if (queryClient.getQueryData(queryKey) !== undefined) {
      return;
    }

    let isMounted = true;

    void getCachedValue<T>(cacheKey, {
      allowExpired: true,
    }).then((cached) => {
      if (!isMounted || !cached) {
        return;
      }

      if (queryClient.getQueryData(queryKey) === undefined) {
        queryClient.setQueryData(queryKey, cached.data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cacheKey, enabled, queryClient, queryHash, queryKey]);
}
