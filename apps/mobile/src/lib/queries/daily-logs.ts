import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DailyLogSchema } from "@eztrack/shared";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";
import { previewDailyLogs } from "@/data/mock";
import { DailyLogStatus } from "@eztrack/shared";

export interface DailyLogRow {
  createdAt: string;
  createdBy: string | null;
  id: string;
  location: string;
  priority: "critical" | "high" | "medium" | "low";
  recordNumber: string;
  status: string;
  synopsis: string;
  topic: string;
}

export interface CreateDailyLogInput {
  locationId: string;
  priority: "low" | "medium" | "high";
  synopsis: string;
  topic: string;
}

async function fetchDailyLogs(orgId: string): Promise<DailyLogRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_logs")
    .select(`
      id,
      record_number,
      topic,
      priority,
      status,
      synopsis,
      created_at,
      location:locations!location_id(id, name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    createdAt: row.created_at,
    createdBy: row.creator?.full_name ?? null,
    id: row.id,
    location: row.location?.name ?? "Unknown",
    priority: row.priority,
    recordNumber: row.record_number,
    status: row.status,
    synopsis: row.synopsis ?? "",
    topic: row.topic,
  }));
}

async function createDailyLog(input: CreateDailyLogInput, profile: { id: string; orgId: string; propertyId: string | null }) {
  const parsed = DailyLogSchema.safeParse({
    location_id: input.locationId,
    priority: input.priority,
    status: DailyLogStatus.Open,
    synopsis: input.synopsis,
    topic: input.topic,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Daily log validation failed.");
  }

  const supabase = getSupabase();
  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: profile.orgId,
    p_prefix: "DL",
  });

  if (recNumError || !recNum) {
    throw new Error("Failed to generate the daily log record number.");
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      created_by: profile.id,
      location_id: input.locationId,
      org_id: profile.orgId,
      priority: input.priority,
      property_id: profile.propertyId,
      record_number: recNum,
      status: DailyLogStatus.Open,
      synopsis: input.synopsis,
      topic: input.topic,
    })
    .select("id, record_number")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function useDailyLogs() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery<DailyLogRow[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewDailyLogs.map((log) => ({ ...log })))
        : fetchDailyLogs(orgId!),
    queryKey: ["daily-logs", "list", orgId ?? "preview"],
  });
}

export function useCreateDailyLogMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateDailyLogInput) => {
      if (!profile) {
        throw new Error("A profile is required before creating a daily log.");
      }

      if (usePreviewData) {
        return {
          id: `preview-log-${Date.now()}`,
          record_number: "DL-PREVIEW",
        };
      }

      return createDailyLog(input, {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
    },
  });
}
