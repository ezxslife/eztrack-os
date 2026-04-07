import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  IncidentSchema,
  IncidentStatus,
  type IncidentSeverity,
} from "@eztrack/shared";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";
import {
  previewIncidentFinancials,
  previewIncidentNarratives,
  previewIncidentParticipants,
  previewIncidents,
} from "@/data/mock";

export interface IncidentRow {
  assignedTo: string | null;
  createdAt: string;
  id: string;
  location: string;
  recordNumber: string;
  reportedBy: string | null;
  severity: string;
  status: string;
  synopsis: string;
  type: string;
}

export interface IncidentDetail {
  createdAt: string;
  creatorName: string | null;
  description: string | null;
  disposition: string | null;
  id: string;
  location: string;
  orgId: string;
  propertyId: string | null;
  recordNumber: string;
  reportedBy: string | null;
  severity: string;
  status: string;
  synopsis: string;
  type: string;
  updatedAt: string;
}

export interface IncidentNarrative {
  authorName: string | null;
  content: string;
  createdAt: string;
  id: string;
  title: string;
}

export interface IncidentParticipant {
  description: string | null;
  firstName: string;
  id: string;
  lastName: string;
  personType: string;
  primaryRole: string;
}

export interface IncidentFinancial {
  amount: number;
  createdAt: string;
  createdBy: string | null;
  description: string | null;
  entryType: string;
  id: string;
}

export interface CreateIncidentInput {
  incidentType: string;
  locationId: string;
  reportedBy?: string;
  severity: IncidentSeverity;
  synopsis: string;
}

async function fetchIncidents(orgId: string): Promise<IncidentRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      id,
      record_number,
      incident_type,
      severity,
      status,
      synopsis,
      reported_by,
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
    assignedTo: row.creator?.full_name ?? null,
    createdAt: row.created_at,
    id: row.id,
    location: row.location?.name ?? "Unknown",
    recordNumber: row.record_number,
    reportedBy: row.reported_by,
    severity: row.severity,
    status: row.status,
    synopsis: row.synopsis ?? "",
    type: row.incident_type,
  }));
}

async function fetchIncidentDetail(orgId: string, id: string): Promise<IncidentDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      *,
      location:locations!location_id(id, name),
      creator:profiles!created_by(id, full_name)
    `)
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    createdAt: data.created_at,
    creatorName: data.creator?.full_name ?? null,
    description: data.description,
    disposition: data.disposition,
    id: data.id,
    location: data.location?.name ?? "Unknown",
    orgId: data.org_id,
    propertyId: data.property_id,
    recordNumber: data.record_number,
    reportedBy: data.reported_by,
    severity: data.severity,
    status: data.status,
    synopsis: data.synopsis ?? "",
    type: data.incident_type,
    updatedAt: data.updated_at,
  };
}

async function fetchIncidentNarratives(id: string): Promise<IncidentNarrative[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_narratives")
    .select(`
      id,
      title,
      content,
      created_at,
      author:profiles!author_id(full_name)
    `)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    authorName: row.author?.full_name ?? null,
    content: row.content,
    createdAt: row.created_at,
    id: row.id,
    title: row.title || "Narrative",
  }));
}

async function fetchIncidentParticipants(id: string): Promise<IncidentParticipant[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_participants")
    .select("id, person_type, first_name, last_name, primary_role, description")
    .eq("incident_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    description: row.description,
    firstName: row.first_name,
    id: row.id,
    lastName: row.last_name,
    personType: row.person_type,
    primaryRole: row.primary_role,
  }));
}

async function fetchIncidentFinancials(id: string): Promise<IncidentFinancial[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_financials")
    .select(`
      id,
      entry_type,
      amount,
      description,
      created_at,
      creator:profiles!created_by(full_name)
    `)
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    amount: Number(row.amount ?? 0),
    createdAt: row.created_at,
    createdBy: row.creator?.full_name ?? null,
    description: row.description,
    entryType: row.entry_type,
    id: row.id,
  }));
}

async function createIncident(input: CreateIncidentInput, profile: { id: string; orgId: string; propertyId: string | null }) {
  const parsed = IncidentSchema.safeParse({
    incident_type: input.incidentType,
    location_id: input.locationId,
    reported_by: input.reportedBy,
    severity: input.severity,
    status: IncidentStatus.Open,
    synopsis: input.synopsis,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Incident validation failed.");
  }

  const supabase = getSupabase();
  const { data: recNum, error: recNumError } = await supabase.rpc("next_record_number", {
    p_org_id: profile.orgId,
    p_prefix: "INC",
  });

  if (recNumError || !recNum) {
    throw new Error("Failed to generate the incident record number.");
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      created_by: profile.id,
      description: input.synopsis,
      incident_type: input.incidentType,
      location_id: input.locationId,
      org_id: profile.orgId,
      property_id: profile.propertyId,
      record_number: recNum,
      reported_by: input.reportedBy ?? null,
      severity: input.severity,
      status: IncidentStatus.Open,
      synopsis: input.synopsis,
    })
    .select("id, record_number")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function useIncidents() {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery<IncidentRow[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidents.map((incident) => ({ ...incident })))
        : fetchIncidents(orgId!),
    queryKey: ["incidents", "list", orgId ?? "preview"],
  });
}

export function useIncidentDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: async () => {
      if (usePreviewData) {
        const match = previewIncidents.find((incident) => incident.id === id) ?? previewIncidents[0];
        return {
          createdAt: match.createdAt,
          creatorName: match.assignedTo,
          description: match.synopsis,
          disposition: null,
          id: match.id,
          location: match.location,
          orgId: "preview-org",
          propertyId: "preview-property",
          recordNumber: match.recordNumber,
          reportedBy: match.reportedBy,
          severity: match.severity,
          status: match.status,
          synopsis: match.synopsis,
          type: match.type,
          updatedAt: match.createdAt,
        } satisfies IncidentDetail;
      }

      return fetchIncidentDetail(orgId!, id);
    },
    queryKey: ["incidents", "detail", id, orgId ?? "preview"],
  });
}

export function useIncidentNarratives(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidentNarratives[id] ?? [])
        : fetchIncidentNarratives(id),
    queryKey: ["incidents", "narratives", id, orgId ?? "preview"],
  });
}

export function useIncidentParticipants(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidentParticipants[id] ?? [])
        : fetchIncidentParticipants(id),
    queryKey: ["incidents", "participants", id, orgId ?? "preview"],
  });
}

export function useIncidentFinancials(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewIncidentFinancials[id] ?? [])
        : fetchIncidentFinancials(id),
    queryKey: ["incidents", "financials", id, orgId ?? "preview"],
  });
}

export function useCreateIncidentMutation() {
  const queryClient = useQueryClient();
  const { profile, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateIncidentInput) => {
      if (!profile) {
        throw new Error("A profile is required before creating an incident.");
      }

      if (usePreviewData) {
        return {
          id: `preview-incident-${Date.now()}`,
          record_number: "INC-PREVIEW",
        };
      }

      return createIncident(input, {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
