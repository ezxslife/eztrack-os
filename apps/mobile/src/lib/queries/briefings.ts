import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { previewBriefings } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import type { BriefingListRow } from "@/lib/queries/secondary-modules";
import { getSupabase } from "@/lib/supabase";

export interface BriefingDetail {
  content: string;
  createdAt: string;
  creator: { fullName: string; id: string } | null;
  id: string;
  linkUrl: string | null;
  orgId: string;
  priority: string;
  propertyId: string | null;
  recipients: unknown;
  sourceModule: string | null;
  title: string;
  updatedAt: string;
}

export interface CreateBriefingInput {
  content: string;
  linkUrl?: string;
  priority?: string;
  sourceModule?: string;
  title: string;
}

export interface UpdateBriefingInput extends CreateBriefingInput {}

function mapPreviewDetail(id: string): BriefingDetail {
  const match = previewBriefings.find((row) => row.id === id) ?? previewBriefings[0];

  return {
    content: match?.preview ?? "Preview briefing content",
    createdAt: match?.createdAt ?? new Date().toISOString(),
    creator: { fullName: match?.author ?? "Preview Operator", id: "preview-user" },
    id: match?.id ?? id,
    linkUrl: null,
    orgId: "preview-org",
    priority: match?.priority ?? "medium",
    propertyId: "preview-property",
    recipients: [],
    sourceModule: null,
    title: match?.title ?? "Preview briefing",
    updatedAt: new Date().toISOString(),
  };
}

function toBriefingRow(detail: BriefingDetail): BriefingListRow {
  return {
    author: detail.creator?.fullName ?? "Unknown",
    createdAt: detail.createdAt,
    id: detail.id,
    preview: detail.content.slice(0, 200),
    priority: detail.priority as "high" | "low" | "medium",
    title: detail.title,
  };
}

function upsertBriefingRow(
  rows: BriefingListRow[],
  nextRow: BriefingListRow
) {
  const filtered = rows.filter((row) => row.id !== nextRow.id);
  return [nextRow, ...filtered];
}

async function fetchBriefingById(
  orgId: string,
  id: string
): Promise<BriefingDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("briefings")
    .select(`
      *,
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
    content: data.content,
    createdAt: data.created_at,
    creator: data.creator
      ? { fullName: data.creator.full_name, id: data.creator.id }
      : null,
    id: data.id,
    linkUrl: data.link_url ?? null,
    orgId: data.org_id,
    priority: data.priority,
    propertyId: data.property_id ?? null,
    recipients: data.recipients ?? [],
    sourceModule: data.source_module ?? null,
    title: data.title,
    updatedAt: data.updated_at,
  };
}

async function createBriefingRecord(
  input: CreateBriefingInput,
  session: {
    orgId: string;
    propertyId: string | null;
    userId: string;
  }
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("briefings")
    .insert({
      content: input.content,
      created_by: session.userId,
      link_url: input.linkUrl || null,
      org_id: session.orgId,
      priority: input.priority || "medium",
      property_id: session.propertyId,
      source_module: input.sourceModule || null,
      title: input.title,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return fetchBriefingById(session.orgId, data.id);
}

async function updateBriefingRecord(
  id: string,
  input: UpdateBriefingInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("briefings")
    .update({
      content: input.content,
      link_url: input.linkUrl ?? null,
      priority: input.priority ?? "medium",
      source_module: input.sourceModule ?? null,
      title: input.title,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchBriefingById(session.orgId, id);
}

async function deleteBriefingRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("briefings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useBriefingDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["briefings", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `briefings:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<BriefingDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery<BriefingDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(mapPreviewDetail(id))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchBriefingById(orgId!, id),
            ttlMs: 10 * 60 * 1000,
          }),
    queryKey,
  });
}

export function useCreateBriefingMutation() {
  const queryClient = useQueryClient();
  const { orgId, profile, propertyId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateBriefingInput) => {
      if (usePreviewData || !orgId || !profile) {
        return {
          ...mapPreviewDetail(`preview-briefing-${Date.now()}`),
          content: input.content,
          creator: { fullName: profile?.full_name ?? "Preview Operator", id: "preview-user" },
          linkUrl: input.linkUrl ?? null,
          priority: input.priority ?? "medium",
          sourceModule: input.sourceModule ?? null,
          title: input.title,
          updatedAt: new Date().toISOString(),
        } satisfies BriefingDetail;
      }

      return createBriefingRecord(input, {
        orgId,
        propertyId,
        userId: profile.id,
      });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["briefings", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<BriefingListRow[]>(
          ["briefings", "list", "preview"],
          (current) => upsertBriefingRow(current ?? [], toBriefingRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["briefings"] });
    },
  });
}

export function useUpdateBriefingMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdateBriefingInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          content: input.content,
          linkUrl: input.linkUrl ?? null,
          priority: input.priority ?? "medium",
          sourceModule: input.sourceModule ?? null,
          title: input.title,
          updatedAt: new Date().toISOString(),
        } satisfies BriefingDetail;
      }

      return updateBriefingRecord(id, input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["briefings", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<BriefingListRow[]>(
          ["briefings", "list", "preview"],
          (current) => upsertBriefingRow(current ?? [], toBriefingRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["briefings"] });
    },
  });
}

export function useDeleteBriefingMutation(id: string) {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async () => {
      if (usePreviewData) {
        return;
      }

      await deleteBriefingRecord(id);
    },
    onSuccess: async () => {
      if (usePreviewData) {
        queryClient.setQueryData<BriefingListRow[]>(
          ["briefings", "list", "preview"],
          (current) => (current ?? []).filter((row) => row.id !== id)
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["briefings"] });
    },
  });
}
