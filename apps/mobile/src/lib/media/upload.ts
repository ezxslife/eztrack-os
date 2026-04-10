import { File } from "expo-file-system";

import { getSupabase } from "@/lib/supabase";

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function uploadIncidentMediaFile(input: {
  fileName: string;
  fileUri: string;
  incidentId: string;
  mimeType?: string | null;
}) {
  const supabase = getSupabase();
  const timestamp = Date.now();
  const safeName = sanitizePathSegment(input.fileName || `upload-${timestamp}`);
  const filePath = `${input.incidentId}/${timestamp}-${safeName}`;
  const file = new File(input.fileUri);

  const { error } = await supabase.storage.from("incident-media").upload(filePath, file, {
    contentType: input.mimeType ?? undefined,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return filePath;
}
