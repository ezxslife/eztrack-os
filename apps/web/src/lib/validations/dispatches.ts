import { z } from "zod";

export const createDispatchSchema = z.object({
  priority: z.string().min(1, "Priority is required"),
  dispatchCode: z.string().min(1, "Dispatch code is required"),
  location: z.string().min(1, "Location is required"),
  sublocation: z.string().optional().default(""),
  reporterName: z.string().optional().default(""),
  reporterPhone: z.string().optional().default(""),
  anonymous: z.boolean().default(false),
  callSource: z.string().optional().default(""),
  synopsis: z.string().min(1, "Synopsis is required"),
});

export const editDispatchSchema = z.object({
  priority: z.string().min(1, "Priority is required"),
  dispatchCode: z.string().min(1, "Dispatch code is required"),
  location: z.string().min(1, "Location is required"),
  sublocation: z.string().optional().default(""),
  reporterName: z.string().optional().default(""),
  reporterPhone: z.string().optional().default(""),
  anonymous: z.boolean().default(false),
  callSource: z.string().optional().default(""),
  synopsis: z.string().min(1, "Synopsis is required"),
});

export type CreateDispatchValues = z.infer<typeof createDispatchSchema>;
export type EditDispatchValues = z.infer<typeof editDispatchSchema>;
