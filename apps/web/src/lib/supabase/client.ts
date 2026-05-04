/**
 * Browser Supabase client — ezxs-os-style API.
 *
 * Drop-in replacement for the existing `supabase-browser.ts` getter pattern.
 * Existing code keeps working via `supabase-browser.ts`; new code imports here.
 */

import { getSupabaseBrowser } from '../supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Returns the singleton browser client. Equivalent to ezxs-os's `createClient()`.
 */
export function createClient(): SupabaseClient<Database> {
  return getSupabaseBrowser();
}
