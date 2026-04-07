import { AppState, Platform } from "react-native";

import "react-native-url-polyfill/auto";

import {
  createClient,
  processLock,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { appEnv } from "@/lib/env";
import { authStorage } from "@/lib/storage";

let client: SupabaseClient | null = null;
let autoRefreshRegistered = false;

function registerAutoRefresh(supabase: SupabaseClient) {
  if (Platform.OS === "web" || autoRefreshRegistered) {
    return;
  }

  autoRefreshRegistered = true;

  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
      return;
    }

    supabase.auth.stopAutoRefresh();
  });
}

export function getSupabase() {
  if (!appEnv.authEnabled) {
    throw new Error(
      "Supabase mobile client is unavailable until EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are configured."
    );
  }

  if (!client) {
    client = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: processLock,
        persistSession: true,
        storage: authStorage,
      },
      global: {
        headers: {
          "X-Client-Info": "eztrack-mobile",
        },
      },
    });

    registerAutoRefresh(client);
  }

  return client;
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!appEnv.authEnabled) {
    return null;
  }

  const supabase = getSupabase();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}
