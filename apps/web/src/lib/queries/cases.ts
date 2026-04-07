import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Enums } from "@/types";

/* ─── Types ─────────────────────────────────────── */

export interface CaseRow {
  id: string;
  caseNumber: string;
  caseType: string;
  status: string;
  synopsis: string | null;
  leadInvestigator: string | null;
  created: string;
  priority: string | null;
  [key: string]: unknown;
}

export interface CaseDetail {
  id: string;
  recordNumber: string;
  caseType: string;
  status: string;
  synopsis: string | null;
  escalationLevel: string | null;
  leadInvestigator: { id: string; fullName: string } | null;
  creator: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  propertyId: string | null;
}

/* ─── Fetch cases list ───────────────────────────── */

export async function fetchCases(): Promise<CaseRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("cases")
    .select(`
      id,
      record_number,
      case_type,
      status,
      synopsis,
      escalation_level,
      created_at,
      investigator:profiles!lead_investigator(id, full_name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    caseNumber: row.record_number,
    caseType: row.case_type,
    status: row.status,
    synopsis: row.synopsis,
    leadInvestigator: row.investigator?.full_name || null,
    created: row.created_at,
    priority: row.escalation_level,
  }));
}

/* ─── Fetch single case by ID ────────────────────── */

export async function fetchCaseById(id: string): Promise<CaseDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("cases")
    .select(`
      *,
      investigator:profiles!lead_investigator(id, full_name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    recordNumber: data.record_number,
    caseType: data.case_type,
    status: data.status,
    synopsis: data.synopsis,
    escalationLevel: data.escalation_level,
    leadInvestigator: data.investigator
      ? { id: data.investigator.id, fullName: data.investigator.full_name }
      : null,
    creator: data.creator
      ? { id: data.creator.id, fullName: data.creator.full_name }
      : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    orgId: data.org_id,
    propertyId: data.property_id,
  };
}

/* ─── Create a new case ──────────────────────────── */

export async function createCase(input: {
  orgId: string;
  propertyId: string | null;
  caseType: string;
  synopsis?: string;
  escalationLevel?: string;
}) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: input.orgId,
    p_prefix: "CSE",
  });
  if (recNumError || !recNum) throw new Error("Failed to generate case record number");

  const { data, error } = await supabase
    .from("cases")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      record_number: recNum,
      case_type: input.caseType,
      synopsis: input.synopsis || null,
      escalation_level: input.escalationLevel || null,
      status: "open" as Enums<"case_status">,
      created_by: user.id,
    })
    .select("id, record_number")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update case status ─────────────────────────── */

export async function updateCaseStatus(id: string, status: Enums<"case_status">) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("cases")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a case ─────────────────────────── */

export async function deleteCase(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("cases")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/* ─── Fetch case audit trail from activity_log ───── */

export async function fetchCaseAudit(caseId: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      id, action, changes, created_at,
      actor:profiles!actor_id(full_name)
    `)
    .eq("entity_type", "case")
    .eq("entity_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    action: row.action,
    details: row.changes ? JSON.stringify(row.changes) : null,
    actorName: row.actor?.full_name || null,
    createdAt: row.created_at,
  }));
}
