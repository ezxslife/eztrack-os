import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { previewFoundItems } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import type { FoundItemListRow } from "@/lib/queries/secondary-modules";
import { getSupabase } from "@/lib/supabase";

export interface FoundItemDetail {
  category: string;
  createdAt: string;
  description: string;
  foundAt: string;
  foundBy: string | null;
  foundLocation: { id: string; name: string } | null;
  id: string;
  notes: string | null;
  orgId: string;
  photoUrl: string | null;
  propertyId: string | null;
  recordNumber: string;
  returnedAt: string | null;
  returnedTo: string | null;
  status: string;
  storageLocation: string | null;
  updatedAt: string;
}

export interface CreateFoundItemInput {
  category: string;
  description: string;
  foundBy?: string;
  foundLocationId?: string | null;
  notes?: string;
  storageLocation?: string;
}

export interface UpdateFoundItemInput extends CreateFoundItemInput {}

function mapPreviewDetail(id: string): FoundItemDetail {
  const match = previewFoundItems.find((row) => row.id === id) ?? previewFoundItems[0];

  return {
    category: match?.category ?? "property",
    createdAt: new Date().toISOString(),
    description: match?.description ?? "Preview found item",
    foundAt: match?.foundDate ?? new Date().toISOString(),
    foundBy: match?.foundBy ?? null,
    foundLocation: match ? { id: "preview-location", name: match.locationFound } : null,
    id: match?.id ?? id,
    notes: null,
    orgId: "preview-org",
    photoUrl: match?.photoUrl ?? null,
    propertyId: "preview-property",
    recordNumber: match?.itemNumber ?? "FND-PREVIEW",
    returnedAt: null,
    returnedTo: null,
    status: match?.status ?? "stored",
    storageLocation: match?.storageLocation ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function toFoundItemRow(detail: FoundItemDetail): FoundItemListRow {
  return {
    category: detail.category,
    description: detail.description,
    foundBy: detail.foundBy,
    foundDate: detail.foundAt,
    id: detail.id,
    itemNumber: detail.recordNumber,
    locationFound: detail.foundLocation?.name ?? "Unknown",
    photoUrl: detail.photoUrl,
    status: detail.status,
    storageLocation: detail.storageLocation,
  };
}

function upsertFoundItemRow(
  rows: FoundItemListRow[],
  nextRow: FoundItemListRow
) {
  const filtered = rows.filter((row) => row.id !== nextRow.id);
  return [nextRow, ...filtered];
}

async function fetchFoundItemById(
  orgId: string,
  id: string
): Promise<FoundItemDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("found_items")
    .select(`
      *,
      location:locations!found_location_id(id, name)
    `)
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    category: data.category,
    createdAt: data.created_at,
    description: data.description,
    foundAt: data.found_at,
    foundBy: data.found_by ?? null,
    foundLocation: data.location ?? null,
    id: data.id,
    notes: data.notes ?? null,
    orgId: data.org_id,
    photoUrl: data.photo_url ?? null,
    propertyId: data.property_id ?? null,
    recordNumber: data.record_number,
    returnedAt: data.returned_at ?? null,
    returnedTo: data.returned_to ?? null,
    status: data.status,
    storageLocation: data.storage_location ?? null,
    updatedAt: data.updated_at,
  };
}

async function createFoundItemRecord(
  input: CreateFoundItemInput,
  session: {
    orgId: string;
    propertyId: string | null;
    userId: string;
  }
) {
  const supabase = getSupabase();
  const { data: nextRecord, error: recordError } = await supabase.rpc(
    "next_record_number",
    {
      p_org_id: session.orgId,
      p_prefix: "FND",
    }
  );

  if (recordError || !nextRecord) {
    throw recordError ?? new Error("Failed to generate found item number.");
  }

  const { data, error } = await supabase
    .from("found_items")
    .insert({
      category: input.category,
      created_by: session.userId,
      description: input.description,
      found_at: new Date().toISOString(),
      found_by: input.foundBy || null,
      found_location_id: input.foundLocationId || null,
      notes: input.notes || null,
      org_id: session.orgId,
      photo_url: null,
      property_id: session.propertyId,
      record_number: nextRecord,
      status: "stored",
      storage_location: input.storageLocation || null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return fetchFoundItemById(session.orgId, data.id);
}

async function updateFoundItemRecord(
  id: string,
  input: UpdateFoundItemInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("found_items")
    .update({
      category: input.category,
      description: input.description,
      found_by: input.foundBy ?? null,
      found_location_id: input.foundLocationId ?? null,
      notes: input.notes ?? null,
      storage_location: input.storageLocation ?? null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchFoundItemById(session.orgId, id);
}

async function updateFoundItemStatusRecord(
  id: string,
  status: string,
  session: { orgId: string },
  extras?: { returnedTo?: string }
) {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = { status };

  if (extras?.returnedTo) {
    payload.returned_to = extras.returnedTo;
  }

  if (status === "returned") {
    payload.returned_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("found_items")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchFoundItemById(session.orgId, id);
}

async function deleteFoundItemRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("found_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useFoundItemDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["found-items", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id
      ? null
      : `found-items:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<FoundItemDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery<FoundItemDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(mapPreviewDetail(id))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchFoundItemById(orgId!, id),
            ttlMs: 10 * 60 * 1000,
          }),
    queryKey,
  });
}

export function useCreateFoundItemMutation() {
  const queryClient = useQueryClient();
  const { orgId, profile, propertyId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateFoundItemInput) => {
      if (usePreviewData || !orgId || !profile) {
        return {
          ...mapPreviewDetail(`preview-found-item-${Date.now()}`),
          category: input.category,
          description: input.description,
          foundBy: input.foundBy ?? null,
          notes: input.notes ?? null,
          storageLocation: input.storageLocation ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies FoundItemDetail;
      }

      return createFoundItemRecord(input, {
        orgId,
        propertyId,
        userId: profile.id,
      });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        [
          "found-items",
          "detail",
          detail.id,
          usePreviewData ? "preview" : detail.orgId,
        ],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<FoundItemListRow[]>(
          ["found-items", "list", "preview"],
          (current) => upsertFoundItemRow(current ?? [], toFoundItemRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["found-items"] });
    },
  });
}

export function useUpdateFoundItemMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdateFoundItemInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          category: input.category,
          description: input.description,
          foundBy: input.foundBy ?? null,
          notes: input.notes ?? null,
          storageLocation: input.storageLocation ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies FoundItemDetail;
      }

      return updateFoundItemRecord(id, input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        [
          "found-items",
          "detail",
          detail.id,
          usePreviewData ? "preview" : detail.orgId,
        ],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<FoundItemListRow[]>(
          ["found-items", "list", "preview"],
          (current) => upsertFoundItemRow(current ?? [], toFoundItemRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["found-items"] });
    },
  });
}

export function useUpdateFoundItemStatusMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async ({
      returnedTo,
      status,
    }: {
      returnedTo?: string;
      status: string;
    }) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          returnedAt: status === "returned" ? new Date().toISOString() : null,
          returnedTo: returnedTo ?? null,
          status,
          updatedAt: new Date().toISOString(),
        } satisfies FoundItemDetail;
      }

      return updateFoundItemStatusRecord(id, status, { orgId }, { returnedTo });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        [
          "found-items",
          "detail",
          detail.id,
          usePreviewData ? "preview" : detail.orgId,
        ],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<FoundItemListRow[]>(
          ["found-items", "list", "preview"],
          (current) => upsertFoundItemRow(current ?? [], toFoundItemRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["found-items"] });
    },
  });
}

export function useDeleteFoundItemMutation(id: string) {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async () => {
      if (usePreviewData) {
        return;
      }

      await deleteFoundItemRecord(id);
    },
    onSuccess: async () => {
      if (usePreviewData) {
        queryClient.setQueryData<FoundItemListRow[]>(
          ["found-items", "list", "preview"],
          (current) => (current ?? []).filter((row) => row.id !== id)
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["found-items"] });
    },
  });
}
