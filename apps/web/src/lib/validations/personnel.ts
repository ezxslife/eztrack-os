import { z } from "zod";

export const createPersonnelSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.string().min(1, "Role is required"),
  badgeNumber: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  shift: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  certifications: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  emergencyContact: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const editPersonnelSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type CreatePersonnelValues = z.infer<typeof createPersonnelSchema>;
export type EditPersonnelValues = z.infer<typeof editPersonnelSchema>;
