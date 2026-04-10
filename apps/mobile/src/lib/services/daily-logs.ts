import {
  DailyLogSchema,
  DailyLogStatus,
} from "@eztrack/shared";

import type {
  QueuedCreateDailyLogInput,
  QueuedUpdateDailyLogInput,
} from "@/lib/offline/types";
import type { MutationProfile } from "@/lib/services/mutation-profile";
import { getSupabase } from "@/lib/supabase";

export async function createDailyLogRecord(
  input: QueuedCreateDailyLogInput,
  profile: MutationProfile
) {
  const parsed = DailyLogSchema.safeParse({
    location_id: input.locationId,
    priority: input.priority,
    status: DailyLogStatus.Open,
    synopsis: input.synopsis,
    topic: input.topic,
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Daily log validation failed."
    );
  }

  const supabase = getSupabase();
  const { data: recNum, error: recNumError } = await supabase.rpc(
    "next_record_number",
    {
      p_org_id: profile.orgId,
      p_prefix: "DL",
    }
  );

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

export async function updateDailyLogRecord(
  input: QueuedUpdateDailyLogInput,
  profile: MutationProfile
) {
  const parsed = DailyLogSchema.safeParse({
    location_id: input.locationId,
    priority: input.priority,
    status: input.status,
    synopsis: input.synopsis,
    topic: input.topic,
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Daily log validation failed."
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_logs")
    .update({
      location_id: input.locationId,
      priority: input.priority,
      property_id: profile.propertyId,
      status: input.status ?? DailyLogStatus.Open,
      synopsis: input.synopsis,
      topic: input.topic,
    })
    .eq("org_id", profile.orgId)
    .eq("id", input.dailyLogId)
    .select("id, record_number, status")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateDailyLogStatusRecord(
  dailyLogId: string,
  status: string
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("daily_logs")
    .update({ status })
    .eq("id", dailyLogId);

  if (error) {
    throw error;
  }
}

export async function deleteDailyLogRecord(dailyLogId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("daily_logs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", dailyLogId);

  if (error) {
    throw error;
  }
}
