/**
 * useManualRefresh — Centralized pull-to-refresh with deduplication.
 *
 * Ensures only one refresh is in-flight at a time. If the user pulls
 * again while a refresh is running, the same promise is returned
 * (no double-fetches).
 *
 * Usage:
 *   const { refreshing, runManualRefresh } = useManualRefresh();
 *   <RefreshControl refreshing={refreshing} onRefresh={() => runManualRefresh(refetch)} />
 */
import { useCallback, useRef, useState } from 'react';

export function useManualRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef<Promise<unknown> | null>(null);

  const runManualRefresh = useCallback(
    <T,>(work: () => Promise<T>): Promise<T> => {
      if (inFlightRef.current) {
        return inFlightRef.current as Promise<T>;
      }

      setRefreshing(true);

      const promise = work().finally(() => {
        inFlightRef.current = null;
        setRefreshing(false);
      });

      inFlightRef.current = promise;
      return promise;
    },
    [],
  );

  return { refreshing, runManualRefresh };
}
