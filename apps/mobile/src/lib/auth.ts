import type { Profile } from "@eztrack/shared";

import { appEnv } from "@/lib/env";
import { deactivateDeviceRegistration } from "@/lib/push-registration";
import { getSupabase } from "@/lib/supabase";
import { clearUserScopedAppData } from "@/lib/user-scoped-data";
import { useAuthStore } from "@/stores/auth-store";

export async function fetchCurrentProfile(userId: string): Promise<Profile> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, org_id, email, full_name, avatar_url, role, property_id, phone, created_at")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    email: data.email,
    full_name: data.full_name,
    id: data.id,
    org_id: data.org_id,
    phone: data.phone,
    property_id: data.property_id,
    role: data.role,
  };
}

export async function signInWithPassword(email: string, password: string) {
  if (!appEnv.authEnabled) {
    throw new Error("Live auth is not enabled for this mobile build.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutCurrentUser() {
  if (!appEnv.authEnabled) {
    await clearUserScopedAppData();
    useAuthStore.getState().setSignedOut(null, "manual_sign_out");
    return;
  }

  useAuthStore.getState().setLogoutIntent("manual_sign_out");

  const supabase = getSupabase();
  try {
    await deactivateDeviceRegistration();
  } catch (error) {
    console.warn("[Push] Failed to deactivate device registration during sign-out.", error);
  }
  const { error } = await supabase.auth.signOut();

  if (error) {
    useAuthStore.getState().clearLogoutIntent();
    throw error;
  }
}
