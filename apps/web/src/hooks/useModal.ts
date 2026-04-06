"use client";

import { useState, useCallback } from "react";

/**
 * Simple open/close state management for modals.
 * Returns { isOpen, open, close, toggle } plus an optional
 * `data` slot for passing context to the modal on open.
 *
 * Usage:
 *   const modal = useModal<Incident>();
 *   <Button onClick={() => modal.open(incident)}>Edit</Button>
 *   {modal.isOpen && <EditModal data={modal.data} onClose={modal.close} />}
 */
export function useModal<T = undefined>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((payload?: T) => {
    setData(payload);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Clear data after animation completes
    setTimeout(() => setData(undefined), 200);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, data, open, close, toggle } as const;
}
