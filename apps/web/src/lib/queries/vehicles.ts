import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Types ─────────────────────────────────────── */

export interface VehicleRow {
  id: string;
  plate: string | null;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  type: string;
  ownerType: string | null;
  ownerId: string | null;
  [key: string]: unknown;
}

export interface VehicleDetail {
  id: string;
  licensePlate: string | null;
  licenseState: string | null;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  vehicleType: string;
  vin: string | null;
  ownerType: string | null;
  ownerId: string | null;
  notes: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Fetch vehicles list ───────────────────────── */

export async function fetchVehicles(): Promise<VehicleRow[]> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    plate: row.license_plate,
    make: row.make,
    model: row.model,
    year: row.year,
    color: row.color,
    type: row.vehicle_type,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
  }));
}

/* ─── Fetch single vehicle by ID ────────────────── */

export async function fetchVehicleById(id: string): Promise<VehicleDetail> {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    licensePlate: data.license_plate,
    licenseState: data.license_state,
    make: data.make,
    model: data.model,
    year: data.year,
    color: data.color,
    vehicleType: data.vehicle_type,
    vin: data.vin,
    ownerType: data.owner_type,
    ownerId: data.owner_id,
    notes: data.notes,
    orgId: data.org_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/* ─── Create a vehicle ──────────────────────────── */

export async function createVehicle(input: {
  orgId: string;
  make: string;
  model: string;
  vehicleType: string;
  licensePlate?: string;
  licenseState?: string;
  year?: number;
  color?: string;
  vin?: string;
  ownerType?: string;
  ownerId?: string;
}) {
  const supabase = getSupabaseBrowser();

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      org_id: input.orgId,
      make: input.make,
      model: input.model,
      vehicle_type: input.vehicleType,
      license_plate: input.licensePlate || null,
      license_state: input.licenseState || null,
      year: input.year ?? null,
      color: input.color || null,
      vin: input.vin || null,
      owner_type: input.ownerType || null,
      owner_id: input.ownerId || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

/* ─── Update a vehicle ─────────────────────────── */

export async function updateVehicle(
  id: string,
  updates: {
    make?: string;
    model?: string;
    vehicleType?: string;
    licensePlate?: string;
    licenseState?: string;
    year?: number;
    color?: string;
    vin?: string;
    ownerType?: string;
    ownerId?: string;
    notes?: string;
  }
) {
  const supabase = getSupabaseBrowser();

  const payload: Record<string, unknown> = {};
  if (updates.make !== undefined) payload.make = updates.make;
  if (updates.model !== undefined) payload.model = updates.model;
  if (updates.vehicleType !== undefined) payload.vehicle_type = updates.vehicleType;
  if (updates.licensePlate !== undefined) payload.license_plate = updates.licensePlate;
  if (updates.licenseState !== undefined) payload.license_state = updates.licenseState;
  if (updates.year !== undefined) payload.year = updates.year;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.vin !== undefined) payload.vin = updates.vin;
  if (updates.ownerType !== undefined) payload.owner_type = updates.ownerType;
  if (updates.ownerId !== undefined) payload.owner_id = updates.ownerId;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { error } = await supabase
    .from("vehicles")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

/* ─── Soft-delete a vehicle ─────────────────────── */

export async function deleteVehicle(id: string) {
  const supabase = getSupabaseBrowser();

  const { error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
