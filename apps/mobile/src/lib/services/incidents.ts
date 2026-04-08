import {
  IncidentSchema,
  IncidentStatus,
} from "@eztrack/shared";

import type {
  QueuedCreateIncidentInput,
  QueuedCreateIncidentNarrativeInput,
  QueuedUpdateIncidentInput,
} from "@/lib/offline/types";
import type { MutationProfile } from "@/lib/services/mutation-profile";
import { getSupabase } from "@/lib/supabase";

export async function createIncidentRecord(
  input: QueuedCreateIncidentInput,
  profile: MutationProfile
) {
  const parsed = IncidentSchema.safeParse({
    incident_type: input.incidentType,
    location_id: input.locationId,
    reported_by: input.reportedBy,
    severity: input.severity,
    status: IncidentStatus.Open,
    synopsis: input.synopsis,
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Incident validation failed."
    );
  }

  const supabase = getSupabase();
  const { data: recNum, error: recNumError } = await supabase.rpc(
    "next_record_number",
    {
      p_org_id: profile.orgId,
      p_prefix: "INC",
    }
  );

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

export async function updateIncidentRecord(
  input: QueuedUpdateIncidentInput,
  profile: MutationProfile
) {
  const parsed = IncidentSchema.safeParse({
    incident_type: input.incidentType,
    location_id: input.locationId,
    reported_by: input.reportedBy,
    severity: input.severity,
    status: input.status,
    synopsis: input.synopsis,
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Incident validation failed."
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incidents")
    .update({
      description: input.synopsis,
      incident_type: input.incidentType,
      location_id: input.locationId,
      property_id: profile.propertyId,
      reported_by: input.reportedBy ?? null,
      severity: input.severity,
      status: input.status ?? IncidentStatus.Open,
      synopsis: input.synopsis,
    })
    .eq("org_id", profile.orgId)
    .eq("id", input.incidentId)
    .select("id, record_number, status")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createIncidentNarrativeRecord(
  input: QueuedCreateIncidentNarrativeInput,
  profile: MutationProfile
) {
  const content = input.content.trim();
  const title = input.title?.trim() || "Narrative";

  if (!content) {
    throw new Error("Narrative content is required.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("incident_narratives")
    .insert({
      author_id: profile.id,
      content,
      incident_id: input.incidentId,
      title,
    })
    .select("id, title, content, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
