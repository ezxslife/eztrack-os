import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import type { Database, Json } from "@/types/database";

export interface RequestContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  orgId: string;
  role: string;
}

export async function getRequestContext(): Promise<RequestContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  if (!profile?.org_id) {
    throw new Error("Organization not found");
  }

  return {
    supabase,
    userId: user.id,
    orgId: profile.org_id,
    role: profile.role,
  };
}

export function canManageSettings(role: string) {
  return role === "super_admin" || role === "org_admin";
}

export async function readOrgSettings<T extends Record<string, unknown>>(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<T> {
  const { data, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  if (error) {
    throw error;
  }

  return ((data?.settings && typeof data.settings === "object" && !Array.isArray(data.settings))
    ? data.settings
    : {}) as T;
}

export async function writeOrgSettings(
  supabase: SupabaseClient<Database>,
  orgId: string,
  settings: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("organizations")
    .update({ settings: settings as Json })
    .eq("id", orgId);

  if (error) {
    throw error;
  }
}
