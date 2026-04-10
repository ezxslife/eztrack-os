import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Database, Json } from "@/types/database";

export interface RequestContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  orgId: string;
  role: string;
}

function getBearerToken(request?: Request) {
  const header = request?.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  return token.length ? token : null;
}

function createBearerSupabaseClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase browser credentials are not configured.");
  }

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function getRequestContext(request?: Request): Promise<RequestContext> {
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken
    ? createBearerSupabaseClient(bearerToken)
    : await createClient();

  const userResult = bearerToken
    ? await createSupabaseAdminClient().auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  if (userResult.error) {
    throw userResult.error;
  }
  const user = userResult.data.user;

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
