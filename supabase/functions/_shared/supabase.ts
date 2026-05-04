// _shared/supabase.ts
// Service-role Supabase client for Edge Functions. Bypasses RLS.
// NEVER import this from any client-bundled code.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export function getServiceRoleClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as Edge Function secrets',
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
