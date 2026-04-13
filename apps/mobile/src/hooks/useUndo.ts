/**
 * useUndo — Hook for undo flows that pairs with the UndoToast component.
 *
 * Manages the pending-undo lifecycle: shows an undo toast, calls the
 * commit callback when the timer expires, or the undo callback if the
 * user taps "Undo".
 *
 * Usage:
 *   const { showUndo, undoState } = useUndo();
 *   showUndo({ message: 'Incident archived', onUndo: restoreIncident, onCommit: deleteIncident });
 *   {undoState && <UndoToast {...undoState} />}
 */
import { useCallback, useRef, useState } from 'react';

interface UndoConfig {
  message: string;
  /** Called when user taps "Undo". */
  onUndo: () => void | Promise<void>;
  /** Called when the timer expires without undo. */
  onCommit?: () => void;
  /** Duration before auto-commit (ms). Default 5000. */
  duration?: number;
}

export interface UndoState {
  message: string;
  onUndo: () => void | Promise<void>;
  onDismiss: () => void;
  duration: number;
}

export function useUndo() {
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const commitRef = useRef<(() => void) | undefined>(undefined);

  const dismiss = useCallback(() => {
    // Timer expired — run the commit callback.
    commitRef.current?.();
    commitRef.current = undefined;
    setUndoState(null);
  }, []);

  const showUndo = useCallback(
    (config: UndoConfig) => {
      // If there's already an active undo, commit the previous one.
      commitRef.current?.();

      commitRef.current = config.onCommit;

      setUndoState({
        message: config.message,
        duration: config.duration ?? 5000,
        onUndo: async () => {
          commitRef.current = undefined;
          setUndoState(null);
          await config.onUndo();
        },
        onDismiss: dismiss,
      });
    },
    [dismiss],
  );

  const cancelUndo = useCallback(() => {
    commitRef.current = undefined;
    setUndoState(null);
  }, []);

  return { showUndo, cancelUndo, undoState };
}
