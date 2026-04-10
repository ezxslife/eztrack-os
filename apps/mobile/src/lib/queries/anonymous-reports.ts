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

function normalizeAnonymousReport(row: any): AnonymousReportRow {
  return {
    adminNotes: row.admin_notes ?? null,
    category: row.category,
    id: row.id,
    reportText: row.report_text,
    status: row.status,
    submittedAt: row.submitted_at,
  };
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

  return (data ?? []).map((row: any) => normalizeAnonymousReport(row));
}

async function fetchAnonymousReportByTrackingCode(code: string) {
  const normalized = code.trim().toLowerCase().replace(/^anon-/, "");
  if (normalized.length < 6) {
    throw new Error("Enter a valid tracking code.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("anonymous_reports")
    .select("*")
    .ilike("id", `${normalized}%`)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No anonymous report matched that tracking code.");
  }

  return normalizeAnonymousReport(data);
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

async function updateAnonymousReportStatus(input: {
  adminNotes?: string;
  id: string;
  status: string;
}) {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = {
    status: input.status,
  };

  if (input.adminNotes !== undefined) {
    payload.admin_notes = input.adminNotes;
  }

  const { error } = await supabase
    .from("anonymous_reports")
    .update(payload)
    .eq("id", input.id);

  if (error) {
    throw error;
  }
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

export function useAnonymousReportLookup(code: string) {
  const {
    authLifecycle,
    canAccessProtected,
    usePreviewData,
  } = useSessionContext();

  return useQuery({
    enabled:
      canAccessProtected &&
      authLifecycle === "active" &&
      !usePreviewData &&
      code.trim().length >= 6,
    queryFn: () => fetchAnonymousReportByTrackingCode(code),
    queryKey: ["anonymous-reports", "lookup", code.trim().toLowerCase()],
    retry: false,
  });
}

export function useUpdateAnonymousReportStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAnonymousReportStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["anonymous-reports"] });
      await queryClient.invalidateQueries({
        queryKey: ["anonymous-reports", "lookup"],
      });
    },
  });
}
