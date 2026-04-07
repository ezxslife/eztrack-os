import { z } from "zod";

export const createVisitSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  purpose: z.string().min(1, "Purpose is required"),
  hostName: z.string().optional().default(""),
  hostDepartment: z.string().optional().default(""),
  company: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  expectedDate: z.string().optional().default(""),
  expectedTime: z.string().optional().default(""),
  ndaRequired: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
});

export const addVisitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  organization: z.string().optional().default(""),
  idType: z.string().optional().default(""),
  idNumber: z.string().optional().default(""),
});

export type CreateVisitValues = z.infer<typeof createVisitSchema>;
export type AddVisitorValues = z.infer<typeof addVisitorSchema>;
