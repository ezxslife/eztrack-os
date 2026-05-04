/**
 * Session-scoped API response cache.
 * Stores responses in `sessionStorage` keyed by request URL + serialized headers
 * so navigating around the app doesn't re-fetch idempotent reads inside one
 * browser session.
 *
 * Ported in minimal form from ezxs-os; expand when the API client lands in L1+.
 */

const PREFIX = 'eztrack:apiCache:';

function isAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = `${PREFIX}__probe`;
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getCached<T = unknown>(key: string): T | null {
  if (!isAvailable()) return null;
  try {
    const raw = window.sessionStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCached<T = unknown>(key: string, value: T): void {
  if (!isAvailable()) return;
  try {
    window.sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Quota exceeded — silently drop
  }
}

export function clearOne(key: string): void {
  if (!isAvailable()) return;
  try {
    window.sessionStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // ignore
  }
}

/**
 * Wipe every cache entry. Called from the auth `signOut` flow so a new
 * sign-in doesn't see the previous user's cached data.
 */
export function clearAllApiCache(): void {
  if (!isAvailable()) return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}
