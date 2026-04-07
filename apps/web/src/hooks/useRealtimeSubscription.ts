"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeOptions<T> {
  /** Postgres table to subscribe to */
  table: string;
  /** Optional row-level filter, e.g. "org_id=eq.abc123" */
  filter?: string;
  /** Listen for a specific event or all ("*"). Default: "*" */
  event?: ChangeEvent | "*";
  /** Callback when a row is inserted */
  onInsert?: (record: T) => void;
  /** Callback when a row is updated */
  onUpdate?: (record: T) => void;
  /** Callback when a row is deleted (receives the old record) */
  onDelete?: (record: T) => void;
  /** Set to false to pause the subscription. Default: true */
  enabled?: boolean;
}

/**
 * Generic Supabase Realtime subscription hook.
 *
 * Subscribes to `postgres_changes` on the given table and invokes
 * the appropriate callback for each change event. Cleans up the
 * channel on unmount or when options change.
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>(
  options: UseRealtimeOptions<T>,
) {
  const {
    table,
    filter,
    event = "*",
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
  } = options;

  // Keep callbacks in refs so the channel doesn't re-subscribe on every render
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onDeleteRef.current = onDelete;
  }, [onDelete]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabaseBrowser();
    const channelName = filter
      ? `realtime:${table}:${filter}`
      : `realtime:${table}`;

    const channelConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*";
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema: "public",
      table,
    };
    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", channelConfig, (payload) => {
        switch (payload.eventType) {
          case "INSERT":
            onInsertRef.current?.(payload.new as T);
            break;
          case "UPDATE":
            onUpdateRef.current?.(payload.new as T);
            break;
          case "DELETE":
            onDeleteRef.current?.(payload.old as T);
            break;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [table, filter, event, enabled]);
}
