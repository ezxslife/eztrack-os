import { z } from "zod";

export const createVehicleSchema = z.object({
  make: z.string().optional().default(""),
  model: z.string().optional().default(""),
  year: z.string().optional().default(""),
  color: z.string().optional().default(""),
  licensePlate: z.string().min(1, "License plate is required"),
  licenseState: z.string().optional().default(""),
  vin: z.string().optional().default(""),
  vehicleType: z.string().optional().default(""),
  ownerType: z.string().optional().default(""),
  ownerId: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type CreateVehicleValues = z.infer<typeof createVehicleSchema>;
