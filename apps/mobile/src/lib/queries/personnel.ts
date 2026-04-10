import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface PersonnelRow {
  id: string;
  lastActive: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

export interface PersonnelDetail {
  avatarUrl: string | null;
  createdAt: string;
  email: string | null;
  fullName: string;
  id: string;
  orgId: string;
  phone: string | null;
  role: string;
  status: string;
  updatedAt: string;
}

async function fetchPersonnel(orgId: string): Promise<PersonnelRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, phone, updated_at")
    .eq("org_id", orgId)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    lastActive: row.updated_at,
    name: row.full_name || "Unknown",
    phone: row.phone || "",
    role: row.role || "staff",
    status: row.status || "available",
  }));
}

async function fetchPersonnelById(id: string): Promise<PersonnelDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return {
    avatarUrl: data.avatar_url ?? null,
    createdAt: data.created_at,
    email: data.email ?? null,
    fullName: data.full_name || "Unknown",
    id: data.id,
    orgId: data.org_id,
    phone: data.phone ?? null,
    role: data.role || "staff",
    status: data.status || "available",
    updatedAt: data.updated_at,
  };
}

export function usePersonnel() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchPersonnel(orgId!),
    queryKey: ["personnel", orgId],
  });
}

export function usePersonnelDetail(id: string) {
  const { canAccessProtected } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id),
    queryFn: () => fetchPersonnelById(id),
    queryKey: ["personnel", "detail", id],
  });
}
