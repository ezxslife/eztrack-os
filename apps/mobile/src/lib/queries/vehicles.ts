import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { previewVehicles } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import type { VehicleListRow } from "@/lib/queries/secondary-modules";
import { getSupabase } from "@/lib/supabase";

export interface VehicleDetail {
  color: string | null;
  createdAt: string;
  id: string;
  licensePlate: string | null;
  licenseState: string | null;
  make: string;
  model: string;
  notes: string | null;
  orgId: string;
  ownerId: string | null;
  ownerType: string | null;
  updatedAt: string;
  vehicleType: string;
  vin: string | null;
  year: number | null;
}

export interface CreateVehicleInput {
  color?: string;
  licensePlate?: string;
  licenseState?: string;
  make: string;
  model: string;
  ownerId?: string;
  ownerType?: string;
  vehicleType: string;
  vin?: string;
  year?: number | null;
}

export interface UpdateVehicleInput extends CreateVehicleInput {
  notes?: string;
}

function mapPreviewDetail(id: string): VehicleDetail {
  const match = previewVehicles.find((row) => row.id === id) ?? previewVehicles[0];

  return {
    color: match?.color ?? null,
    createdAt: new Date().toISOString(),
    id: match?.id ?? id,
    licensePlate: match?.plate ?? null,
    licenseState: null,
    make: match?.make ?? "Preview",
    model: match?.model ?? "Vehicle",
    notes: null,
    orgId: "preview-org",
    ownerId: match?.ownerId ?? null,
    ownerType: match?.ownerType ?? null,
    updatedAt: new Date().toISOString(),
    vehicleType: match?.type ?? "car",
    vin: null,
    year: match?.year ?? null,
  };
}

function toVehicleRow(detail: VehicleDetail): VehicleListRow {
  return {
    color: detail.color,
    id: detail.id,
    make: detail.make,
    model: detail.model,
    ownerId: detail.ownerId,
    ownerType: detail.ownerType,
    plate: detail.licensePlate,
    type: detail.vehicleType,
    year: detail.year,
  };
}

function upsertVehicleRow(rows: VehicleListRow[], nextRow: VehicleListRow) {
  const filtered = rows.filter((row) => row.id !== nextRow.id);
  return [nextRow, ...filtered];
}

async function fetchVehicleById(
  orgId: string,
  id: string
): Promise<VehicleDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    color: data.color ?? null,
    createdAt: data.created_at,
    id: data.id,
    licensePlate: data.license_plate ?? null,
    licenseState: data.license_state ?? null,
    make: data.make,
    model: data.model,
    notes: data.notes ?? null,
    orgId: data.org_id,
    ownerId: data.owner_id ?? null,
    ownerType: data.owner_type ?? null,
    updatedAt: data.updated_at,
    vehicleType: data.vehicle_type,
    vin: data.vin ?? null,
    year: data.year ?? null,
  };
}

async function createVehicleRecord(
  input: CreateVehicleInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      color: input.color || null,
      license_plate: input.licensePlate || null,
      license_state: input.licenseState || null,
      make: input.make,
      model: input.model,
      org_id: session.orgId,
      owner_id: input.ownerId || null,
      owner_type: input.ownerType || null,
      vehicle_type: input.vehicleType,
      vin: input.vin || null,
      year: input.year ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return fetchVehicleById(session.orgId, data.id);
}

async function updateVehicleRecord(
  id: string,
  input: UpdateVehicleInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("vehicles")
    .update({
      color: input.color ?? null,
      license_plate: input.licensePlate ?? null,
      license_state: input.licenseState ?? null,
      make: input.make,
      model: input.model,
      notes: input.notes ?? null,
      owner_id: input.ownerId ?? null,
      owner_type: input.ownerType ?? null,
      vehicle_type: input.vehicleType,
      vin: input.vin ?? null,
      year: input.year ?? null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchVehicleById(session.orgId, id);
}

async function deleteVehicleRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useVehicleDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["vehicles", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `vehicles:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<VehicleDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery<VehicleDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(mapPreviewDetail(id))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchVehicleById(orgId!, id),
            ttlMs: 10 * 60 * 1000,
          }),
    queryKey,
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateVehicleInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(`preview-vehicle-${Date.now()}`),
          color: input.color ?? null,
          licensePlate: input.licensePlate ?? null,
          licenseState: input.licenseState ?? null,
          make: input.make,
          model: input.model,
          ownerId: input.ownerId ?? null,
          ownerType: input.ownerType ?? null,
          vehicleType: input.vehicleType,
          vin: input.vin ?? null,
          year: input.year ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies VehicleDetail;
      }

      return createVehicleRecord(input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["vehicles", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<VehicleListRow[]>(
          ["vehicles", "list", "preview"],
          (current) => upsertVehicleRow(current ?? [], toVehicleRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateVehicleMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdateVehicleInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          color: input.color ?? null,
          licensePlate: input.licensePlate ?? null,
          licenseState: input.licenseState ?? null,
          make: input.make,
          model: input.model,
          notes: input.notes ?? null,
          ownerId: input.ownerId ?? null,
          ownerType: input.ownerType ?? null,
          vehicleType: input.vehicleType,
          vin: input.vin ?? null,
          year: input.year ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies VehicleDetail;
      }

      return updateVehicleRecord(id, input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["vehicles", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<VehicleListRow[]>(
          ["vehicles", "list", "preview"],
          (current) => upsertVehicleRow(current ?? [], toVehicleRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useDeleteVehicleMutation(id: string) {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async () => {
      if (usePreviewData) {
        return;
      }

      await deleteVehicleRecord(id);
    },
    onSuccess: async () => {
      if (usePreviewData) {
        queryClient.setQueryData<VehicleListRow[]>(
          ["vehicles", "list", "preview"],
          (current) => (current ?? []).filter((row) => row.id !== id)
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
