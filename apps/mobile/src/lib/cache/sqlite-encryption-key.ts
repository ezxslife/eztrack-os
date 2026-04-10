import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SQLITE_CACHE_KEY_STORAGE_KEY = "eztrack-mobile-sqlite-cache-key.v1";
const SQLITE_CACHE_KEY_BYTES = 32;
const SQLITE_CACHE_KEY_PATTERN = /^[0-9a-f]{64}$/;

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const STRICT_SQLITE_CACHE_ENCRYPTION = true;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    ""
  );
}

async function readStoredKey() {
  try {
    return await SecureStore.getItemAsync(
      SQLITE_CACHE_KEY_STORAGE_KEY,
      secureStoreOptions
    );
  } catch (error) {
    console.warn("[SQLiteCache] Failed to read encryption key from SecureStore.", error);
    return null;
  }
}

async function writeStoredKey(value: string) {
  try {
    await SecureStore.setItemAsync(
      SQLITE_CACHE_KEY_STORAGE_KEY,
      value,
      secureStoreOptions
    );
    return true;
  } catch (error) {
    console.warn("[SQLiteCache] Failed to persist encryption key to SecureStore.", error);
    return false;
  }
}

async function deleteStoredKey() {
  try {
    await SecureStore.deleteItemAsync(
      SQLITE_CACHE_KEY_STORAGE_KEY,
      secureStoreOptions
    );
  } catch (error) {
    console.warn("[SQLiteCache] Failed to delete invalid encryption key.", error);
  }
}

async function generateKey() {
  const bytes = await Crypto.getRandomBytesAsync(SQLITE_CACHE_KEY_BYTES);
  return toHex(bytes).toLowerCase();
}

export async function canUseSecureStoreForSQLiteKey() {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn("[SQLiteCache] SecureStore availability probe failed.", error);
    return false;
  }
}

export async function getOrCreateSQLiteEncryptionKey() {
  if (!(await canUseSecureStoreForSQLiteKey())) {
    return null;
  }

  const storedValue = await readStoredKey();

  if (storedValue) {
    if (SQLITE_CACHE_KEY_PATTERN.test(storedValue)) {
      return storedValue.toLowerCase();
    }

    await deleteStoredKey();
  }

  const generatedValue = await generateKey();
  const didPersist = await writeStoredKey(generatedValue);

  if (!didPersist) {
    return null;
  }

  const verifiedValue = await readStoredKey();
  if (!verifiedValue || verifiedValue.toLowerCase() !== generatedValue) {
    console.warn("[SQLiteCache] SecureStore key verification failed after write.");
    return null;
  }

  return generatedValue;
}

export function getSQLiteEncryptionPragma(hexKey: string) {
  return `PRAGMA key = "x'${hexKey}'";`;
}
