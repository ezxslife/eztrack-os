import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { previewWorkOrders } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import type { WorkOrderListRow } from "@/lib/queries/secondary-modules";
import { getSupabase } from "@/lib/supabase";

export interface WorkOrderDetail {
  assignedStaff: { fullName: string; id: string } | null;
  category: string;
  createdAt: string;
  creator: { fullName: string; id: string } | null;
  description: string | null;
  dueDate: string | null;
  estimatedCost: number | null;
  id: string;
  location: { id: string; name: string } | null;
  orgId: string;
  priority: string;
  propertyId: string | null;
  recordNumber: string;
  scheduledDate: string | null;
  status: string;
  title: string;
  updatedAt: string;
}

export interface CreateWorkOrderInput {
  assignedTo?: string | null;
  category: string;
  description?: string;
  dueDate?: string;
  estimatedCost?: number | null;
  locationId?: string | null;
  priority: string;
  scheduledDate?: string;
  title: string;
}

export interface UpdateWorkOrderInput extends CreateWorkOrderInput {}

function mapPreviewDetail(id: string): WorkOrderDetail {
  const match = previewWorkOrders.find((row) => row.id === id) ?? previewWorkOrders[0];

  return {
    assignedStaff: match?.assignedTo
      ? { fullName: match.assignedTo, id: "preview-assignee" }
      : null,
    category: match?.category ?? "general",
    createdAt: new Date().toISOString(),
    creator: { fullName: "Preview Operator", id: "preview-user" },
    description: null,
    dueDate: match?.dueDate ?? null,
    estimatedCost: null,
    id: match?.id ?? id,
    location: null,
    orgId: "preview-org",
    priority: match?.priority ?? "medium",
    propertyId: "preview-property",
    recordNumber: match?.woNumber ?? "WO-PREVIEW",
    scheduledDate: null,
    status: match?.status ?? "open",
    title: match?.title ?? "Preview work order",
    updatedAt: new Date().toISOString(),
  };
}

function toWorkOrderRow(detail: WorkOrderDetail): WorkOrderListRow {
  return {
    assignedTo: detail.assignedStaff?.fullName ?? null,
    category: detail.category,
    dueDate: detail.dueDate,
    id: detail.id,
    priority: detail.priority,
    status: detail.status,
    title: detail.title,
    woNumber: detail.recordNumber,
  };
}

function upsertWorkOrderRow(
  rows: WorkOrderListRow[],
  nextRow: WorkOrderListRow
) {
  const filtered = rows.filter((row) => row.id !== nextRow.id);
  return [nextRow, ...filtered];
}

async function fetchWorkOrderById(
  orgId: string,
  id: string
): Promise<WorkOrderDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      location:locations!location_id(id, name),
      assigned:profiles!assigned_to(id, full_name),
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
    assignedStaff: data.assigned
      ? { fullName: data.assigned.full_name, id: data.assigned.id }
      : null,
    category: data.category,
    createdAt: data.created_at,
    creator: data.creator
      ? { fullName: data.creator.full_name, id: data.creator.id }
      : null,
    description: data.description ?? null,
    dueDate: data.due_date ?? null,
    estimatedCost:
      data.estimated_cost === null || data.estimated_cost === undefined
        ? null
        : Number(data.estimated_cost),
    id: data.id,
    location: data.location ?? null,
    orgId: data.org_id,
    priority: data.priority,
    propertyId: data.property_id ?? null,
    recordNumber: data.record_number,
    scheduledDate: data.scheduled_date ?? null,
    status: data.status,
    title: data.title,
    updatedAt: data.updated_at,
  };
}

async function createWorkOrderRecord(
  input: CreateWorkOrderInput,
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
      p_prefix: "WO",
    }
  );

  if (recordError || !nextRecord) {
    throw recordError ?? new Error("Failed to generate work order number.");
  }

  const { data, error } = await supabase
    .from("work_orders")
    .insert({
      assigned_to: input.assignedTo || null,
      category: input.category,
      created_by: session.userId,
      description: input.description || null,
      due_date: input.dueDate || null,
      estimated_cost: input.estimatedCost ?? null,
      location_id: input.locationId || null,
      org_id: session.orgId,
      priority: input.priority,
      property_id: session.propertyId,
      record_number: nextRecord,
      scheduled_date: input.scheduledDate || null,
      status: "open",
      title: input.title,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return fetchWorkOrderById(session.orgId, data.id);
}

async function updateWorkOrderRecord(
  id: string,
  input: UpdateWorkOrderInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("work_orders")
    .update({
      assigned_to: input.assignedTo ?? null,
      category: input.category,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      estimated_cost: input.estimatedCost ?? null,
      location_id: input.locationId ?? null,
      priority: input.priority,
      scheduled_date: input.scheduledDate ?? null,
      title: input.title,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchWorkOrderById(session.orgId, id);
}

async function updateWorkOrderStatusRecord(
  id: string,
  status: string,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("work_orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchWorkOrderById(session.orgId, id);
}

async function appendWorkOrderNoteRecord(
  id: string,
  note: string,
  session: { orgId: string }
) {
  const current = await fetchWorkOrderById(session.orgId, id);
  const stampedNote = `[${new Date().toISOString()}] ${note.trim()}`;
  const description = current.description
    ? `${current.description}\n\n${stampedNote}`
    : stampedNote;

  return updateWorkOrderRecord(
    id,
    {
      assignedTo: current.assignedStaff?.id ?? null,
      category: current.category,
      description,
      dueDate: current.dueDate ?? undefined,
      estimatedCost: current.estimatedCost,
      locationId: current.location?.id ?? null,
      priority: current.priority,
      scheduledDate: current.scheduledDate ?? undefined,
      title: current.title,
    },
    session
  );
}

async function deleteWorkOrderRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("work_orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useWorkOrderDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["work-orders", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id
      ? null
      : `work-orders:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<WorkOrderDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery<WorkOrderDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(mapPreviewDetail(id))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchWorkOrderById(orgId!, id),
            ttlMs: 10 * 60 * 1000,
          }),
    queryKey,
  });
}

export function useCreateWorkOrderMutation() {
  const queryClient = useQueryClient();
  const { orgId, profile, propertyId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateWorkOrderInput) => {
      if (usePreviewData || !orgId || !profile) {
        return {
          ...mapPreviewDetail(`preview-work-order-${Date.now()}`),
          assignedStaff: null,
          category: input.category,
          description: input.description ?? null,
          dueDate: input.dueDate ?? null,
          estimatedCost: input.estimatedCost ?? null,
          priority: input.priority,
          scheduledDate: input.scheduledDate ?? null,
          status: "open",
          title: input.title,
          updatedAt: new Date().toISOString(),
        } satisfies WorkOrderDetail;
      }

      return createWorkOrderRecord(input, {
        orgId,
        propertyId,
        userId: profile.id,
      });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        [
          "work-orders",
          "detail",
          detail.id,
          usePreviewData ? "preview" : detail.orgId,
        ],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<WorkOrderListRow[]>(
          ["work-orders", "list", "preview"],
          (current) => upsertWorkOrderRow(current ?? [], toWorkOrderRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useUpdateWorkOrderMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdateWorkOrderInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          assignedStaff: input.assignedTo
            ? { fullName: "Assigned from preview", id: input.assignedTo }
            : null,
          category: input.category,
          description: input.description ?? null,
          dueDate: input.dueDate ?? null,
          estimatedCost: input.estimatedCost ?? null,
          priority: input.priority,
          scheduledDate: input.scheduledDate ?? null,
          title: input.title,
          updatedAt: new Date().toISOString(),
        } satisfies WorkOrderDetail;
      }

      return updateWorkOrderRecord(id, input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        [
          "work-orders",
          "detail",
          detail.id,
          usePreviewData ? "preview" : detail.orgId,
        ],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<WorkOrderListRow[]>(
          ["work-orders", "list", "preview"],
          (current) => upsertWorkOrderRow(current ?? [], toWorkOrderRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useUpdateWorkOrderStatusMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (status: string) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          status,
          updatedAt: new Date().toISOString(),
        } satisfies WorkOrderDetail;
      }

      return updateWorkOrderStatusRecord(id, status, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        [
          "work-orders",
          "detail",
          detail.id,
          usePreviewData ? "preview" : detail.orgId,
        ],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<WorkOrderListRow[]>(
          ["work-orders", "list", "preview"],
          (current) => upsertWorkOrderRow(current ?? [], toWorkOrderRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useAppendWorkOrderNoteMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (note: string) => {
      if (usePreviewData || !orgId) {
        const current = mapPreviewDetail(id);
        return {
          ...current,
          description: current.description
            ? `${current.description}\n\n[${new Date().toISOString()}] ${note.trim()}`
            : note.trim(),
          updatedAt: new Date().toISOString(),
        } satisfies WorkOrderDetail;
      }

      return appendWorkOrderNoteRecord(id, note, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        [
          "work-orders",
          "detail",
          detail.id,
          usePreviewData ? "preview" : detail.orgId,
        ],
        detail
      );

      if (!usePreviewData) {
        await queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      }
    },
  });
}

export function useDeleteWorkOrderMutation(id: string) {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async () => {
      if (usePreviewData) {
        return;
      }

      await deleteWorkOrderRecord(id);
    },
    onSuccess: async () => {
      if (usePreviewData) {
        queryClient.setQueryData<WorkOrderListRow[]>(
          ["work-orders", "list", "preview"],
          (current) => (current ?? []).filter((row) => row.id !== id)
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}
