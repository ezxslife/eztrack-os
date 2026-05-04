/**
 * Server Supabase client — ezxs-os-style API.
 * Wraps the existing `supabase-server.ts` `createClient()`.
 */

import { createClient as legacyCreate } from '../supabase-server';

export const createClient = legacyCreate;
