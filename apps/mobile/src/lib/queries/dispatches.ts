import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";
import {
  previewDispatches,
  previewOfficers,
} from "@/data/mock";

export interface DispatchCard {
  callSource: string | null;
  createdAt: string;
  description: string;
  dispatchCode: string;
  id: string;
  location: string;
  officerId: string | null;
  officerName: string | null;
  priority: "critical" | "high" | "medium" | "low";
  recordNumber: string;
  reporterName: string | null;
  status: string;
  sublocation: string | null;
}

export interface OfficerOnDuty {
  avatarUrl: string | null;
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

async function fetchDispatches(orgId: string): Promise<DispatchCard[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dispatches")
    .select(`
      id,
      record_number,
      dispatch_code,
      description,
      priority,
      status,
      sublocation,
      reporter_name,
      call_source,
      created_at,
      assigned_staff_id,
      location:locations!location_id(id, name),
      officer:profiles!assigned_staff_id(id, full_name)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    callSource: row.call_source,
    createdAt: row.created_at,
    description: row.description ?? "No description",
    dispatchCode: row.dispatch_code,
    id: row.id,
    location: row.location?.name ?? "Unknown",
    officerId: row.assigned_staff_id,
    officerName: row.officer?.full_name ?? null,
    priority: row.priority,
    recordNumber: row.record_number,
    reporterName: row.reporter_name,
    status: row.status,
    sublocation: row.sublocation,
  }));
}

async function fetchOnDutyOfficers(): Promise<OfficerOnDuty[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("staff_status_records")
    .select(`
      id,
      status,
      updated_at,
      profile:profiles!staff_id(id, full_name, avatar_url)
    `)
    .neq("status", "off_duty")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    avatarUrl: row.profile?.avatar_url ?? null,
    id: row.profile?.id ?? row.id,
    name: row.profile?.full_name ?? "Unknown",
    status: row.status,
    updatedAt: row.updated_at,
  }));
}

export function useDispatches() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery<DispatchCard[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewDispatches.map((dispatch) => ({ ...dispatch })))
        : fetchDispatches(orgId!),
    queryKey: ["dispatches", "list", orgId ?? "preview"],
  });
}

export function useOnDutyOfficers() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery<OfficerOnDuty[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewOfficers.map((officer) => ({ ...officer })))
        : fetchOnDutyOfficers(),
    queryKey: ["dispatches", "officers", orgId ?? "preview"],
  });
}
