import { z } from "zod";

export const createFoundItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  foundLocation: z.string().optional().default(""),
  foundBy: z.string().optional().default(""),
  storageLocation: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const editFoundItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  foundLocation: z.string().optional().default(""),
  foundBy: z.string().optional().default(""),
  storageLocation: z.string().optional().default(""),
  condition: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const createLostReportSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  lastSeenLocation: z.string().optional().default(""),
  reportedByName: z.string().optional().default(""),
  reportedByPhone: z.string().optional().default(""),
  reportedByEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional().default(""),
});

export type CreateFoundItemValues = z.infer<typeof createFoundItemSchema>;
export type EditFoundItemValues = z.infer<typeof editFoundItemSchema>;
export type CreateLostReportValues = z.infer<typeof createLostReportSchema>;
