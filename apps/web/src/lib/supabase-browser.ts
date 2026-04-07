import { createBrowserClient } from "@eztrack/api";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase client for browser/client components.
 * Safe to call multiple times — returns the same instance.
 * Typed with the auto-generated Database schema for type-safe queries.
 */
let client: SupabaseClient<Database> | null = null;

export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (!client) {
    client = createBrowserClient() as SupabaseClient<Database>;
  }
  return client;
}
