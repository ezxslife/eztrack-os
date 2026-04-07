import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type StorageBucket =
  | "avatars"
  | "evidence"
  | "incident-media"
  | "patron-photos"
  | "documents";

interface UploadOptions {
  bucket: StorageBucket;
  orgId: string;
  /** Sub-folder within the org folder, e.g. "incident-abc123" */
  folder?: string;
  file: File;
  /** Override the stored filename (default: timestamp + original name) */
  fileName?: string;
}

interface UploadResult {
  path: string;
  publicUrl: string | null;
  fullPath: string;
}

/**
 * Upload a file to Supabase Storage.
 * Files are stored as: {orgId}/{folder?}/{timestamp}-{filename}
 * This ensures org isolation (RLS policies check the first folder segment).
 */
export async function uploadFile({
  bucket,
  orgId,
  folder,
  file,
  fileName,
}: UploadOptions): Promise<UploadResult> {
  const supabase = getSupabaseBrowser();

  // Build the storage path: orgId/folder/timestamp-filename
  const safeName = (fileName ?? file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const segments = [orgId];
  if (folder) segments.push(folder);
  segments.push(`${timestamp}-${safeName}`);
  const path = segments.join("/");

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  // Get the public URL (works for public buckets like avatars)
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: bucket === "avatars" ? publicUrl : null,
    fullPath: `${bucket}/${path}`,
  };
}

/**
 * Get a signed URL for a private file (evidence, incident-media, etc.)
 * Valid for 1 hour by default.
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * List files in a storage folder.
 */
export async function listFiles(
  bucket: StorageBucket,
  folder: string
): Promise<{ name: string; size: number; createdAt: string | null }[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) throw error;
  return (data ?? []).map((f) => ({
    name: f.name,
    size: f.metadata?.size ?? 0,
    createdAt: f.created_at,
  }));
}
