import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface BriefingAcknowledgment {
  userId: string;
  userName: string;
  acknowledgedAt: string;
}

export interface BriefingReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface BriefingRecipientsMeta {
  targetValue: string;
  targets: string[];
  acknowledgments: BriefingAcknowledgment[];
  replies: BriefingReply[];
}

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
  recipients: BriefingRecipientsMeta;
  creator: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  propertyId: string | null;
}

function normalizeBriefingRecipients(raw: unknown): BriefingRecipientsMeta {
  if (typeof raw === "string") {
    return {
      targetValue: raw,
      targets: raw ? [raw] : [],
      acknowledgments: [],
      replies: [],
    };
  }

  if (Array.isArray(raw)) {
    const targets = raw.filter((value): value is string => typeof value === "string");
    return {
      targetValue: targets[0] ?? "",
      targets,
      acknowledgments: [],
      replies: [],
    };
  }

  if (raw && typeof raw === "object") {
    const payload = raw as Record<string, unknown>;
    const targetValue =
      typeof payload.targetValue === "string"
        ? payload.targetValue
        : typeof payload.target === "string"
          ? payload.target
          : "";
    const targets = Array.isArray(payload.targets)
      ? payload.targets.filter((value): value is string => typeof value === "string")
      : targetValue
        ? [targetValue]
        : [];

    const acknowledgments = Array.isArray(payload.acknowledgments)
      ? payload.acknowledgments
          .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
          .map((entry) => ({
            userId: typeof entry.userId === "string" ? entry.userId : "",
            userName: typeof entry.userName === "string" ? entry.userName : "Unknown",
            acknowledgedAt:
              typeof entry.acknowledgedAt === "string"
                ? entry.acknowledgedAt
                : new Date().toISOString(),
          }))
          .filter((entry) => entry.userId)
      : [];

    const replies = Array.isArray(payload.replies)
      ? payload.replies
          .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
          .map((entry) => ({
            id:
              typeof entry.id === "string"
                ? entry.id
                : `reply_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            userId: typeof entry.userId === "string" ? entry.userId : "",
            userName: typeof entry.userName === "string" ? entry.userName : "Unknown",
            content: typeof entry.content === "string" ? entry.content : "",
            createdAt:
              typeof entry.createdAt === "string"
                ? entry.createdAt
                : new Date().toISOString(),
          }))
          .filter((entry) => entry.userId && entry.content)
      : [];

    return { targetValue, targets, acknowledgments, replies };
  }

  return {
    targetValue: "",
    targets: [],
    acknowledgments: [],
    replies: [],
  };
}

function serializeBriefingRecipients(
  targetValue: string,
  current?: BriefingRecipientsMeta,
) {
  const targets = current?.targets?.length
    ? current.targets
    : targetValue
      ? [targetValue]
      : [];

  return {
    targetValue,
    targets,
    acknowledgments: current?.acknowledgments ?? [],
    replies: current?.replies ?? [],
  };
}

export interface BriefingAcknowledgement {
  userId: string;
  userName: string;
  acknowledgedAt: string;
}

export interface BriefingReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface BriefingActivityState {
  acknowledgements: BriefingAcknowledgement[];
  replies: BriefingReply[];
}

const EMPTY_ACTIVITY_STATE: BriefingActivityState = {
  acknowledgements: [],
  replies: [],
};
const BRIEFING_ACTIVITY_SETTINGS_KEY = "briefing_activity";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeActivityState(value: unknown): BriefingActivityState {
  if (!isRecord(value)) return { ...EMPTY_ACTIVITY_STATE };

  const acknowledgements = Array.isArray(value.acknowledgements)
    ? value.acknowledgements
        .map((entry) => {
          if (!isRecord(entry)) return null;
          return {
            userId: String(entry.userId ?? ""),
            userName: String(entry.userName ?? "Unknown"),
            acknowledgedAt: String(entry.acknowledgedAt ?? new Date().toISOString()),
          };
        })
        .filter((entry): entry is BriefingAcknowledgement => !!entry && !!entry.userId)
    : [];

  const replies = Array.isArray(value.replies)
    ? value.replies
        .map((entry) => {
          if (!isRecord(entry)) return null;
          return {
            id: String(entry.id ?? crypto.randomUUID()),
            userId: String(entry.userId ?? ""),
            userName: String(entry.userName ?? "Unknown"),
            content: String(entry.content ?? ""),
            createdAt: String(entry.createdAt ?? new Date().toISOString()),
          };
        })
        .filter((entry): entry is BriefingReply => !!entry && !!entry.userId && !!entry.content.trim())
    : [];

  return { acknowledgements, replies };
}

async function fetchOrganizationSettings(orgId: string): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  if (error) throw error;
  return isRecord(data?.settings) ? { ...data.settings } : {};
}

async function saveOrganizationSettings(orgId: string, settings: Record<string, unknown>) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("organizations")
    .update({ settings: settings as any })
    .eq("id", orgId);

  if (error) throw error;
}

function getActivityBucket(settings: Record<string, unknown>) {
  const bucket = settings[BRIEFING_ACTIVITY_SETTINGS_KEY];
  return isRecord(bucket) ? bucket : {};
}

export async function fetchBriefingActivity(
  orgId: string,
  briefingId: string,
): Promise<BriefingActivityState> {
  const settings = await fetchOrganizationSettings(orgId);
  return normalizeActivityState(getActivityBucket(settings)[briefingId]);
}

export async function recordBriefingAcknowledgement(input: {
  orgId: string;
  briefingId: string;
  userId: string;
  userName: string;
}): Promise<BriefingActivityState> {
  const settings = await fetchOrganizationSettings(input.orgId);
  const activityBucket = { ...getActivityBucket(settings) };
  const current = normalizeActivityState(activityBucket[input.briefingId]);
  const updated: BriefingActivityState = {
    acknowledgements: [
      ...current.acknowledgements.filter((entry) => entry.userId !== input.userId),
      {
        userId: input.userId,
        userName: input.userName,
        acknowledgedAt: new Date().toISOString(),
      },
    ],
    replies: current.replies,
  };

  activityBucket[input.briefingId] = updated;
  settings[BRIEFING_ACTIVITY_SETTINGS_KEY] = activityBucket;
  await saveOrganizationSettings(input.orgId, settings);
  return updated;
}

export async function recordBriefingReply(input: {
  orgId: string;
  briefingId: string;
  userId: string;
  userName: string;
  content: string;
}): Promise<BriefingActivityState> {
  const content = input.content.trim();
  if (!content) throw new Error("Reply cannot be empty");

  const settings = await fetchOrganizationSettings(input.orgId);
  const activityBucket = { ...getActivityBucket(settings) };
  const current = normalizeActivityState(activityBucket[input.briefingId]);
  const updated: BriefingActivityState = {
    acknowledgements: current.acknowledgements,
    replies: [
      ...current.replies,
      {
        id: crypto.randomUUID(),
        userId: input.userId,
        userName: input.userName,
        content,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  activityBucket[input.briefingId] = updated;
  settings[BRIEFING_ACTIVITY_SETTINGS_KEY] = activityBucket;
  await saveOrganizationSettings(input.orgId, settings);
  return updated;
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
    recipients: normalizeBriefingRecipients(data.recipients),
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
  recipients?: string;
  sourceModule?: string;
  linkUrl?: string;
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
      recipients: serializeBriefingRecipients(input.recipients ?? "") as any,
      source_module: input.sourceModule ?? null,
      link_url: input.linkUrl ?? null,
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
    recipients?: string;
    linkUrl?: string;
    sourceModule?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.recipients !== undefined) {
    const { data: current } = await supabase
      .from("briefings")
      .select("recipients")
      .eq("id", id)
      .single();
    payload.recipients = serializeBriefingRecipients(
      updates.recipients,
      normalizeBriefingRecipients(current?.recipients),
    ) as any;
  }
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

export async function acknowledgeBriefing(id: string, userId: string, userName: string) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("briefings")
    .select("recipients")
    .eq("id", id)
    .single();

  if (error) throw error;

  const current = normalizeBriefingRecipients(data?.recipients);
  const alreadyAcknowledged = current.acknowledgments.some((entry) => entry.userId === userId);
  if (alreadyAcknowledged) return current;

  const next: BriefingRecipientsMeta = {
    ...current,
    acknowledgments: [
      ...current.acknowledgments,
      {
        userId,
        userName,
        acknowledgedAt: new Date().toISOString(),
      },
    ],
  };

  const { error: updateError } = await supabase
    .from("briefings")
    .update({ recipients: next as any })
    .eq("id", id);

  if (updateError) throw updateError;
  return next;
}

export async function addBriefingReply(
  id: string,
  input: { userId: string; userName: string; content: string },
) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("briefings")
    .select("recipients")
    .eq("id", id)
    .single();

  if (error) throw error;

  const current = normalizeBriefingRecipients(data?.recipients);
  const next: BriefingRecipientsMeta = {
    ...current,
    replies: [
      ...current.replies,
      {
        id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: input.userId,
        userName: input.userName,
        content: input.content.trim(),
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const { error: updateError } = await supabase
    .from("briefings")
    .update({ recipients: next as any })
    .eq("id", id);

  if (updateError) throw updateError;
  return next;
}
