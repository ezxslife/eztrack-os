"use client";

import { type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";

/**
 * Client-side providers wrapper.
 * Wraps the app with all providers that require client-side React context.
 *
 * Currently includes:
 * - ToastProvider (notification toasts)
 * - CommandPalette (global command palette with ⌘K/Ctrl+K)
 *
 * Future additions:
 * - RealtimeProvider (Supabase realtime subscriptions)
 * - QueryProvider (React Query / TanStack Query)
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <CommandPalette />
    </ToastProvider>
  );
}
