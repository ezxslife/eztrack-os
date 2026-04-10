import { useEffect } from "react";

import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

import {
  getOrCreateSQLiteEncryptionKey,
  getSQLiteEncryptionPragma,
  STRICT_SQLITE_CACHE_ENCRYPTION,
} from "@/lib/cache/sqlite-encryption-key";
import { appStorage } from "@/lib/storage";
import { useNetworkStore } from "@/stores/network-store";

const CACHE_DB_NAME = "eztrack-mobile-cache.db";
const CACHE_KEY_PREFIX = "query-cache:";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ROWS = 1500;
const MAX_ENTRY_BYTES = 512 * 1024;

interface CacheRow {
  cache_key: string;
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

type SQLiteDatabase = import("expo-sqlite").SQLiteDatabase;

let sqlitePromise: Promise<SQLiteDatabase | null> | null = null;
let queryCacheAvailability: QueryCacheAvailability | null = null;
let hasLoggedDisabledCache = false;

function getByteLength(value: string) {
  try {
    return new TextEncoder().encode(value).length;
  } catch {
    return value.length;
  }
}

function clearLegacyFallbackCache() {
  for (const key of appStorage.keys()) {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      appStorage.removeItem(key);
    }
  }
}

function getDisabledAvailability(reason: string | null): QueryCacheAvailability {
  return {
    available: false,
    backend: "disabled",
    cipherVersion: null,
    encrypted: false,
    reason,
    strict: STRICT_SQLITE_CACHE_ENCRYPTION,
  };
}

function getEncryptedAvailability(cipherVersion: string): QueryCacheAvailability {
  return {
    available: true,
    backend: "sqlite_encrypted",
    cipherVersion,
    encrypted: true,
    reason: null,
    strict: STRICT_SQLITE_CACHE_ENCRYPTION,
  };
}

function setQueryCacheAvailability(availability: QueryCacheAvailability) {
  queryCacheAvailability = availability;
  return availability;
}

async function detectCipherVersion(database: SQLiteDatabase) {
  try {
    const row = await database.getFirstAsync<{ cipher_version?: string }>(
      "PRAGMA cipher_version"
    );
    return row?.cipher_version?.trim() || null;
  } catch {
    return null;
  }
}

async function initializeEncryptedDatabase(
  database: SQLiteDatabase,
  encryptionKey: string
) {
  const cipherVersion = await detectCipherVersion(database);

  if (!cipherVersion) {
    throw new Error(
      "SQLCipher support is unavailable. Enable the expo-sqlite config plugin with useSQLCipher and rebuild the native app."
    );
  }

  await database.execAsync(getSQLiteEncryptionPragma(encryptionKey));

  try {
    await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master"
    );
  } catch (error) {
    throw new Error(
      `[SQLiteCache] Failed to unlock encrypted cache database. ${error instanceof Error ? error.message : "Unknown error."}`
    );
  }

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS api_cache (
      cache_key TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_accessed_at INTEGER NOT NULL,
      size_bytes INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_api_cache_expiry
      ON api_cache (expires_at);
    CREATE INDEX IF NOT EXISTS idx_api_cache_access
      ON api_cache (last_accessed_at);
  `);

  clearLegacyFallbackCache();
  return getEncryptedAvailability(cipherVersion);
}

async function openSQLiteDatabase() {
  if (Platform.OS === "web") {
    return null;
  }

  const encryptionKey = await getOrCreateSQLiteEncryptionKey();

  if (!encryptionKey) {
    setQueryCacheAvailability(
      getDisabledAvailability(
        "SecureStore-backed SQLCipher key is unavailable, so the native query cache is disabled."
      )
    );
    return null;
  }

  const SQLite = await import("expo-sqlite");
  let database = await SQLite.openDatabaseAsync(CACHE_DB_NAME);

  try {
    const availability = await initializeEncryptedDatabase(database, encryptionKey);
    setQueryCacheAvailability(availability);
    return database;
  } catch {
    await database.closeAsync().catch(() => undefined);
    await SQLite.deleteDatabaseAsync(CACHE_DB_NAME).catch(() => undefined);

    database = await SQLite.openDatabaseAsync(CACHE_DB_NAME, {
      useNewConnection: true,
    });

    const availability = await initializeEncryptedDatabase(database, encryptionKey);
    setQueryCacheAvailability(availability);
    return database;
  }
}

async function getSQLiteDatabase() {
  if (!sqlitePromise) {
    sqlitePromise = openSQLiteDatabase().catch((error) => {
      const reason =
        error instanceof Error
          ? error.message
          : "Encrypted native query cache is unavailable.";

      setQueryCacheAvailability(getDisabledAvailability(reason));

      if (!hasLoggedDisabledCache) {
        hasLoggedDisabledCache = true;
        console.warn("[SQLiteCache] Native cache disabled.", error);
      }

      return null;
    });
  }

  return sqlitePromise;
}

async function trimSQLiteCache(database: SQLiteDatabase) {
  await database.runAsync(
    "DELETE FROM api_cache WHERE expires_at <= ?",
    Date.now()
  );

  const countRow = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM api_cache"
  );
  const overflow = Math.max(0, (countRow?.count ?? 0) - MAX_CACHE_ROWS);

  if (overflow > 0) {
    await database.runAsync(
      `
        DELETE FROM api_cache
        WHERE cache_key IN (
          SELECT cache_key
          FROM api_cache
          ORDER BY expires_at ASC, last_accessed_at ASC
          LIMIT ?
        )
      `,
      overflow
    );
  }
}

async function readSQLiteRow(key: string) {
  const database = await getSQLiteDatabase();

  if (!database) {
    return null;
  }

  return database.getFirstAsync<CacheRow>(
    `
      SELECT cache_key, payload, created_at, expires_at, last_accessed_at, size_bytes
      FROM api_cache
      WHERE cache_key = ?
    `,
    key
  );
}

async function writeSQLiteRow(key: string, row: CacheRow) {
  const database = await getSQLiteDatabase();

  if (!database) {
    return;
  }

  await database.runAsync(
    `
      INSERT OR REPLACE INTO api_cache (
        cache_key,
        payload,
        created_at,
        expires_at,
        last_accessed_at,
        size_bytes
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    key,
    row.payload,
    row.created_at,
    row.expires_at,
    row.last_accessed_at,
    row.size_bytes
  );
  await trimSQLiteCache(database);
}

async function touchSQLiteRow(key: string) {
  const database = await getSQLiteDatabase();

  if (!database) {
    return;
  }

  await database.runAsync(
    "UPDATE api_cache SET last_accessed_at = ? WHERE cache_key = ?",
    Date.now(),
    key
  );
}

export async function probeQueryCacheAvailability() {
  if (Platform.OS === "web") {
    return getDisabledAvailability("Use the web cache module on web.");
  }

  if (queryCacheAvailability) {
    return queryCacheAvailability;
  }

  const database = await getSQLiteDatabase();
  if (database && queryCacheAvailability) {
    return queryCacheAvailability;
  }

  return queryCacheAvailability ?? getDisabledAvailability("Native query cache is disabled.");
}

export async function clearCachedQueryData() {
  const database = await getSQLiteDatabase();

  if (database) {
    await database.runAsync("DELETE FROM api_cache");
  } else if (Platform.OS !== "web") {
    const SQLite = await import("expo-sqlite");
    await SQLite.deleteDatabaseAsync(CACHE_DB_NAME).catch(() => undefined);
    sqlitePromise = null;
  }

  clearLegacyFallbackCache();
}

export async function getCachedValue<T>(
  key: string,
  options?: { allowExpired?: boolean }
): Promise<CachedValue<T> | null> {
  const now = Date.now();
  const sqliteRow = await readSQLiteRow(key);

  if (!sqliteRow) {
    return null;
  }

  if (sqliteRow.expires_at <= now && !options?.allowExpired) {
    const database = await getSQLiteDatabase();
    await database?.runAsync("DELETE FROM api_cache WHERE cache_key = ?", key);
    return null;
  }

  try {
    const data = JSON.parse(sqliteRow.payload) as T;
    void touchSQLiteRow(key);

    return {
      data,
      expiresAt: sqliteRow.expires_at,
      fetchedAt: sqliteRow.created_at,
      isExpired: sqliteRow.expires_at <= now,
    };
  } catch (error) {
    console.warn("[SQLiteCache] Failed to parse cached payload.", error);

    const database = await getSQLiteDatabase();
    await database?.runAsync("DELETE FROM api_cache WHERE cache_key = ?", key);

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
      `[SQLiteCache] Skipping cache write for "${key}" because the payload exceeds ${MAX_ENTRY_BYTES} bytes.`
    );
    return;
  }

  const now = Date.now();
  await writeSQLiteRow(key, {
    cache_key: key,
    created_at: now,
    expires_at: now + (options?.ttlMs ?? DEFAULT_TTL_MS),
    last_accessed_at: now,
    payload,
    size_bytes: sizeBytes,
  });
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
