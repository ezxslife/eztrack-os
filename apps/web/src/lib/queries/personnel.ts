import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface PersonnelRow {
  id: string;
  name: string;
  role: string;
  status: string;
  phone: string;
  lastActive: string;
  [key: string]: unknown;
}

/* ─── Fetch personnel (profiles) list ───────────── */

export async function fetchPersonnel(): Promise<PersonnelRow[]> {
  const supabase = getSupabaseBrowser();

  // Get current user's org_id
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, phone, updated_at")
    .eq("org_id", profile.org_id)
    .order("full_name", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.full_name || "Unknown",
    role: row.role || "Staff",
    status: row.status || "available",
    phone: row.phone || "",
    lastActive: row.updated_at,
  }));
}
