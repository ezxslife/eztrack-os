import { z } from "zod";

export const createPatronSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  dob: z.string().optional().default(""),
  ticketType: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
  idType: z.string().optional().default(""),
  idNumber: z.string().optional().default(""),
});

export const editPatronSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  dob: z.string().optional().default(""),
  ticketType: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
  idType: z.string().optional().default(""),
  idNumber: z.string().optional().default(""),
});

export type CreatePatronValues = z.infer<typeof createPatronSchema>;
export type EditPatronValues = z.infer<typeof editPatronSchema>;
