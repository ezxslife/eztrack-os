import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { previewVisitors } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import type { VisitorListRow } from "@/lib/queries/secondary-modules";
import { getSupabase } from "@/lib/supabase";

export interface VisitorDetail extends VisitorListRow {
  createdAt: string;
  email: string | null;
  hostDepartment: string | null;
  idNumber: string | null;
  idType: string | null;
  ndaRequired: boolean;
  orgId: string;
  propertyId: string | null;
  phone: string | null;
  updatedAt: string;
  vehiclePlate: string | null;
}

export interface CreateVisitorInput {
  company?: string;
  email?: string;
  expectedDate?: string;
  expectedTime?: string;
  firstName: string;
  hostDepartment?: string;
  hostName?: string;
  lastName: string;
  ndaRequired?: boolean;
  phone?: string;
  purpose: string;
}

export interface UpdateVisitorInput extends CreateVisitorInput {
  idNumber?: string;
  idType?: string;
  vehiclePlate?: string;
}

function mapPreviewDetail(id: string): VisitorDetail {
  const match = previewVisitors.find((row) => row.id === id) ?? previewVisitors[0];

  return {
    checkedInAt: match?.checkedInAt ?? null,
    checkedOutAt: match?.checkedOutAt ?? null,
    company: match?.company ?? null,
    createdAt: new Date().toISOString(),
    email: null,
    expectedDate: match?.expectedDate ?? null,
    expectedTime: match?.expectedTime ?? null,
    firstName: match?.firstName ?? "Preview",
    hostDepartment: null,
    hostName: match?.hostName ?? null,
    id: match?.id ?? id,
    idNumber: null,
    idType: null,
    lastName: match?.lastName ?? "Visitor",
    ndaRequired: false,
    orgId: "preview-org",
    propertyId: "preview-property",
    phone: null,
    purpose: match?.purpose ?? "General visit",
    status: match?.status ?? "pending",
    updatedAt: new Date().toISOString(),
    vehiclePlate: null,
  };
}

function toVisitorRow(detail: VisitorDetail): VisitorListRow {
  return {
    checkedInAt: detail.checkedInAt,
    checkedOutAt: detail.checkedOutAt,
    company: detail.company,
    expectedDate: detail.expectedDate,
    expectedTime: detail.expectedTime,
    firstName: detail.firstName,
    hostName: detail.hostName,
    id: detail.id,
    lastName: detail.lastName,
    purpose: detail.purpose,
    status: detail.status,
  };
}

function upsertVisitorRow(
  rows: VisitorListRow[],
  nextRow: VisitorListRow
): VisitorListRow[] {
  const filtered = rows.filter((row) => row.id !== nextRow.id);
  return [nextRow, ...filtered];
}

async function fetchVisitorById(
  orgId: string,
  id: string
): Promise<VisitorDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    checkedInAt: data.checked_in_at ?? null,
    checkedOutAt: data.checked_out_at ?? null,
    company: data.company ?? null,
    createdAt: data.created_at,
    email: data.email ?? null,
    expectedDate: data.expected_date ?? null,
    expectedTime: data.expected_time ?? null,
    firstName: data.first_name,
    hostDepartment: data.host_department ?? null,
    hostName: data.host_name ?? null,
    id: data.id,
    idNumber: data.id_number ?? null,
    idType: data.id_type ?? null,
    lastName: data.last_name,
    ndaRequired: Boolean(data.nda_required),
    orgId: data.org_id,
    propertyId: data.property_id ?? null,
    phone: data.phone ?? null,
    purpose: data.purpose,
    status: data.status,
    updatedAt: data.updated_at,
    vehiclePlate: data.vehicle_plate ?? null,
  };
}

async function createVisitorRecord(
  input: CreateVisitorInput,
  session: {
    orgId: string;
    propertyId: string | null;
  }
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("visitors")
    .insert({
      company: input.company || null,
      email: input.email || null,
      expected_date: input.expectedDate || null,
      expected_time: input.expectedTime || null,
      first_name: input.firstName,
      host_department: input.hostDepartment || null,
      host_name: input.hostName || null,
      last_name: input.lastName,
      nda_required: input.ndaRequired ?? false,
      org_id: session.orgId,
      phone: input.phone || null,
      property_id: session.propertyId,
      purpose: input.purpose,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return fetchVisitorById(session.orgId, data.id);
}

async function updateVisitorRecord(
  id: string,
  input: UpdateVisitorInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("visitors")
    .update({
      company: input.company ?? null,
      email: input.email ?? null,
      expected_date: input.expectedDate ?? null,
      expected_time: input.expectedTime ?? null,
      first_name: input.firstName,
      host_department: input.hostDepartment ?? null,
      host_name: input.hostName ?? null,
      id_number: input.idNumber ?? null,
      id_type: input.idType ?? null,
      last_name: input.lastName,
      nda_required: input.ndaRequired ?? false,
      phone: input.phone ?? null,
      purpose: input.purpose,
      vehicle_plate: input.vehiclePlate ?? null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchVisitorById(session.orgId, id);
}

async function updateVisitorStatusRecord(
  id: string,
  status: string,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const payload: Record<string, unknown> = { status };

  if (status === "signed_in") {
    payload.checked_in_at = new Date().toISOString();
  }

  if (status === "signed_out") {
    payload.checked_out_at = new Date().toISOString();
  }

  if (status === "cancelled") {
    payload.checked_in_at = null;
    payload.checked_out_at = null;
  }

  const { error } = await supabase
    .from("visitors")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchVisitorById(session.orgId, id);
}

async function deleteVisitorRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("visitors")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useVisitorDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["visitors", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `visitors:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<VisitorDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery<VisitorDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(mapPreviewDetail(id))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchVisitorById(orgId!, id),
            ttlMs: 10 * 60 * 1000,
          }),
    queryKey,
  });
}

export function useCreateVisitorMutation() {
  const queryClient = useQueryClient();
  const { orgId, propertyId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateVisitorInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(`preview-visitor-${Date.now()}`),
          ...input,
          createdAt: new Date().toISOString(),
          status: "pending",
          updatedAt: new Date().toISOString(),
        } satisfies VisitorDetail;
      }

      return createVisitorRecord(input, { orgId, propertyId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["visitors", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<VisitorListRow[]>(
          ["visitors", "list", "preview"],
          (current) => upsertVisitorRow(current ?? [], toVisitorRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
  });
}

export function useUpdateVisitorMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdateVisitorInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          ...input,
          id,
          updatedAt: new Date().toISOString(),
        } satisfies VisitorDetail;
      }

      return updateVisitorRecord(id, input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["visitors", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<VisitorListRow[]>(
          ["visitors", "list", "preview"],
          (current) => upsertVisitorRow(current ?? [], toVisitorRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
  });
}

export function useUpdateVisitorStatusMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (status: string) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          checkedInAt: status === "signed_in" ? new Date().toISOString() : null,
          checkedOutAt: status === "signed_out" ? new Date().toISOString() : null,
          status,
          updatedAt: new Date().toISOString(),
        } satisfies VisitorDetail;
      }

      return updateVisitorStatusRecord(id, status, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["visitors", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<VisitorListRow[]>(
          ["visitors", "list", "preview"],
          (current) => upsertVisitorRow(current ?? [], toVisitorRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
  });
}

export function useDeleteVisitorMutation(id: string) {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async () => {
      if (usePreviewData) {
        return;
      }

      await deleteVisitorRecord(id);
    },
    onSuccess: async () => {
      if (usePreviewData) {
        queryClient.setQueryData<VisitorListRow[]>(
          ["visitors", "list", "preview"],
          (current) => (current ?? []).filter((row) => row.id !== id)
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
  });
}
