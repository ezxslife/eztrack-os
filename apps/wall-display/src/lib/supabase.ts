import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appEnv } from "@/lib/env";

export function createWallDisplayClient(accessToken: string): SupabaseClient {
  if (!appEnv.configured) {
    throw new Error("Supabase wall-display client is not configured.");
  }

  const client = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        authorization: `Bearer ${accessToken}`,
        "X-Client-Info": "ezxs-track-wall-display",
      },
    },
  });

  client.realtime.setAuth(accessToken);
  return client;
}
