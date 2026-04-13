/**
 * Hook to provide tab badge counts for the main tab navigation.
 * Currently returns mock data; replace with real Supabase queries.
 */
export function useTabBadges() {
  // TODO: Replace with real Supabase queries for active/unresolved items
  return {
    incidents: 3, // Active/unresolved incidents
    dispatch: 2, // Active dispatches awaiting response
    "daily-log": 0, // Unread log entries (or 0 if all logged)
    personnel: 0, // Offline or unavailable personnel (optional)
  };
}
