/**
 * VENUE_MODE — picks which side of ezxs-track is visible to the user.
 *
 *   'security'  — eztrack-os Security Mode only (year-round venue ops).
 *                 Hides events-domain hubs.
 *   'events'    — Events Mode only (event-day live ops).
 *                 Hides Security Mode hubs (Cases, Vehicles, Daily Log, etc.)
 *   'both'      — Everything visible. Tonight group glows when an event is live.
 *
 * Resolution order (highest priority first):
 *   1. Per-session override stored in localStorage under VENUE_MODE_KEY
 *   2. Per-org default from organizations.venue_mode_default (server-fetched)
 *   3. Env default NEXT_PUBLIC_VENUE_MODE_DEFAULT
 *   4. 'security' (eztrack-os legacy default)
 */

export type VenueMode = 'security' | 'events' | 'both';

export const VENUE_MODE_KEY = 'ezxs-track:venue-mode';

const VALID_MODES = new Set<VenueMode>(['security', 'events', 'both']);

export function isValidVenueMode(value: unknown): value is VenueMode {
  return typeof value === 'string' && VALID_MODES.has(value as VenueMode);
}

export function getDefaultVenueMode(): VenueMode {
  const fromEnv = process.env.NEXT_PUBLIC_VENUE_MODE_DEFAULT;
  if (fromEnv && isValidVenueMode(fromEnv)) return fromEnv;
  return 'security';
}

/**
 * Read the per-session override from localStorage. Returns null if unset
 * or running on the server.
 */
export function getSessionVenueMode(): VenueMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(VENUE_MODE_KEY);
    if (raw && isValidVenueMode(raw)) return raw;
  } catch {
    // localStorage may be blocked
  }
  return null;
}

/**
 * Persist a per-session override. Pass `null` to clear.
 */
export function setSessionVenueMode(mode: VenueMode | null) {
  if (typeof window === 'undefined') return;
  try {
    if (mode === null) {
      window.localStorage.removeItem(VENUE_MODE_KEY);
    } else {
      window.localStorage.setItem(VENUE_MODE_KEY, mode);
    }
    window.dispatchEvent(new CustomEvent('venue-mode-changed', { detail: mode }));
  } catch {
    // ignore
  }
}

/**
 * Resolve effective venue mode given the org default. Pass the value of
 * `organizations.venue_mode_default` from the server; client overrides are
 * applied here.
 */
export function resolveVenueMode(orgDefault: VenueMode | null | undefined): VenueMode {
  const session = getSessionVenueMode();
  if (session) return session;
  if (orgDefault && isValidVenueMode(orgDefault)) return orgDefault;
  return getDefaultVenueMode();
}

// ---------------------------------------------------------------------------
// Mode predicates — use these instead of comparing strings
// ---------------------------------------------------------------------------

export function showsSecurity(mode: VenueMode): boolean {
  return mode === 'security' || mode === 'both';
}

export function showsEvents(mode: VenueMode): boolean {
  return mode === 'events' || mode === 'both';
}
