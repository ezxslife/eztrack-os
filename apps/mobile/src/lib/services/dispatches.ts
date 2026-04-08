import { DispatchStatus } from "@eztrack/shared";

import type { QueuedUpdateDispatchStatusInput } from "@/lib/offline/types";
import { getSupabase } from "@/lib/supabase";

export async function updateDispatchStatusRecord(
  input: QueuedUpdateDispatchStatusInput
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("dispatches")
    .update({
      status: input.nextStatus,
    })
    .eq("id", input.dispatchId)
    .select("id, record_number, status")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    record_number: data.record_number,
    status: (data.status ?? input.nextStatus) as DispatchStatus,
  };
}
