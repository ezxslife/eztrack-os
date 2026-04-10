import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";

export interface AnonymousReportRow {
  adminNotes: string | null;
  category: string;
  id: string;
  reportText: string;
  status: string;
  submittedAt: string;
}

interface SubmitAnonymousReportInput {
  category: string;
  orgId: string;
  propertyId?: null | string;
  reportText: string;
}

async function fetchAnonymousReports(): Promise<AnonymousReportRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("anonymous_reports")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    adminNotes: row.admin_notes ?? null,
    category: row.category,
    id: row.id,
    reportText: row.report_text,
    status: row.status,
    submittedAt: row.submitted_at,
  }));
}

async function submitAnonymousReport(input: SubmitAnonymousReportInput) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("anonymous_reports")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId ?? null,
      category: input.category,
      report_text: input.reportText,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function useAnonymousReports() {
  const {
    authLifecycle,
    canAccessProtected,
    usePreviewData,
  } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && authLifecycle === "active" && !usePreviewData,
    queryFn: fetchAnonymousReports,
    queryKey: ["anonymous-reports"],
  });
}

export function useSubmitAnonymousReportMutation() {
  const queryClient = useQueryClient();
  const { orgId, propertyId } = useSessionContext();

  return useMutation({
    mutationFn: (input: {
      category: string;
      reportText: string;
    }) =>
      submitAnonymousReport({
        ...input,
        orgId: orgId!,
        propertyId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["anonymous-reports"] });
    },
  });
}
