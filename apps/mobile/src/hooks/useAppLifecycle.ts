/**
 * useAppLifecycle — Track app background/foreground transitions.
 *
 * Useful for triggering sync on app resume, pausing timers when
 * backgrounded, and gating React Query refetch-on-focus.
 *
 * Usage:
 *   const { appState, returnedFromBackground } = useAppLifecycle();
 *   useEffect(() => {
 *     if (returnedFromBackground) syncQueue.flush();
 *   }, [returnedFromBackground]);
 */
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** True only for a genuine background → active transition (not inactive → active). */
export function isTrueBackgroundResume(
  previous: AppStateStatus,
  next: AppStateStatus,
): boolean {
  return previous === 'background' && next === 'active';
}

export function useAppLifecycle() {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const [returnedFromBackground, setReturnedFromBackground] = useState(false);
  const previousRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = previousRef.current;
      setAppState(next);
      setReturnedFromBackground(isTrueBackgroundResume(prev, next));
      previousRef.current = next;
    });
    return () => sub.remove();
  }, []);

  return {
    appState,
    /** False when app is fully backgrounded — use for React Query focusManager. */
    isFocusedForQueries: appState !== 'background',
    /** True for one render after a real background → active resume. */
    returnedFromBackground,
  };
}
