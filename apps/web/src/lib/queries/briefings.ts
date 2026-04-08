import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface BriefingRow {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  author: string;
  createdAt: string;
  preview: string;
  [key: string]: unknown;
}

export interface BriefingDetail {
  id: string;
  title: string;
  content: string;
  priority: string;
  linkUrl: string | null;
  sourceModule: string | null;
  recipients: unknown;
  creator: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  propertyId: string | null;
}

/* ─── Fetch briefings list ──────────────────────── */

export async function fetchBriefings(): Promise<BriefingRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("briefings")
    .select(`
      id,
      title,
      content,
      priority,
      created_at,
      creator:profiles!created_by(id, full_name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    priority: row.priority as "high" | "medium" | "low",
    author: row.creator?.full_name || "Unknown",
    createdAt: row.created_at,
    preview: row.content?.substring(0, 200) || "",
  }));
}

/* ─── Fetch single briefing by ID ───────────────── */

export async function fetchBriefingById(id: string): Promise<BriefingDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("briefings")
    .select(`
      *,
      creator:profiles!created_by(id, full_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    priority: data.priority,
    linkUrl: data.link_url,
    sourceModule: data.source_module,
    recipients: data.recipients,
    creator: data.creator
      ? { id: data.creator.id, fullName: data.creator.full_name }
      : null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    orgId: data.org_id,
    propertyId: data.property_id,
  };
}

/* ─── Create a briefing ─────────────────────────── */

export async function createBriefing(input: {
  orgId: string;
  propertyId: string | null;
  title: string;
  content: string;
  priority?: string;
}) {
  const supabase = getSupabaseBrowser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("briefings")
    .insert({
      org_id: input.orgId,
      property_id: input.propertyId,
      title: input.title,
      content: input.content,
      priority: input.priority || "medium",
      created_by: user.id,
    })
    .select("id, title")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update a briefing ────────────────────────── */

export async function updateBriefing(
  id: string,
  updates: {
    title?: string;
    content?: string;
    priority?: string;
    linkUrl?: string;
    sourceModule?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.linkUrl !== undefined) payload.link_url = updates.linkUrl;
  if (updates.sourceModule !== undefined) payload.source_module = updates.sourceModule;

  const { error } = await supabase
    .from("briefings")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a briefing ────────────────────── */

export async function deleteBriefing(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("briefings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
