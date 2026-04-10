import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface AlertRow {
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  alertType: string | null;
  createdAt: string;
  deletedAt: string | null;
  id: string;
  message: string | null;
  orgId: string;
  severity: string | null;
  title: string;
}

async function fetchAlerts(orgId: string): Promise<AlertRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    acknowledgedAt: row.acknowledged_at ?? null,
    acknowledgedBy: row.acknowledged_by ?? null,
    alertType: row.alert_type ?? null,
    createdAt: row.created_at,
    deletedAt: row.deleted_at ?? null,
    id: row.id,
    message: row.message ?? null,
    orgId: row.org_id,
    severity: row.severity ?? null,
    title: row.title,
  }));
}

async function acknowledgeAlert(alertId: string, userId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("alerts")
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq("id", alertId);

  if (error) {
    throw error;
  }
}

async function resolveAlert(alertId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("alerts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", alertId);

  if (error) {
    throw error;
  }
}

export function useAlerts() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchAlerts(orgId!),
    queryKey: ["alerts", orgId],
  });
}

export function useAcknowledgeAlertMutation() {
  const queryClient = useQueryClient();
  const { profile } = useSessionContext();

  return useMutation({
    mutationFn: (alertId: string) => acknowledgeAlert(alertId, profile!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useResolveAlertMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveAlert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
