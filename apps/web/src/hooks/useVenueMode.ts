'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  type VenueMode,
  getSessionVenueMode,
  setSessionVenueMode,
  resolveVenueMode,
  showsSecurity,
  showsEvents,
} from '@/lib/venue-mode';

export interface UseVenueModeResult {
  mode: VenueMode;
  setMode: (next: VenueMode | null) => void; // null = revert to org default
  showsSecurity: boolean;
  showsEvents: boolean;
}

/**
 * React hook for the current effective venue mode.
 * Pass the org default (from server-side fetch of organizations.venue_mode_default).
 */
export function useVenueMode(orgDefault: VenueMode | null | undefined): UseVenueModeResult {
  const [mode, setLocalMode] = useState<VenueMode>(() => resolveVenueMode(orgDefault));

  useEffect(() => {
    // Re-resolve when org default changes
    setLocalMode(resolveVenueMode(orgDefault));
  }, [orgDefault]);

  useEffect(() => {
    function onChange() {
      setLocalMode(resolveVenueMode(orgDefault));
    }
    window.addEventListener('venue-mode-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('venue-mode-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [orgDefault]);

  const setMode = useCallback((next: VenueMode | null) => {
    setSessionVenueMode(next);
    // Optimistically reflect — the storage event also fires
    setLocalMode(resolveVenueMode(orgDefault));
  }, [orgDefault]);

  return {
    mode,
    setMode,
    showsSecurity: showsSecurity(mode),
    showsEvents: showsEvents(mode),
  };
}

// Re-export type for convenience
export type { VenueMode };

// Convenience: stand-alone predicates for non-React contexts (rare)
export { getSessionVenueMode };
