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

export interface PersonnelDetail {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Fetch single staff member by ID ──────────── */

export async function fetchPersonnelById(id: string): Promise<PersonnelDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    fullName: data.full_name || "Unknown",
    email: data.email,
    phone: data.phone,
    role: data.role || "staff",
    status: data.status || "available",
    avatarUrl: data.avatar_url,
    orgId: data.org_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
