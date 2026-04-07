import { z } from "zod";

export const addResourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  alias: z.string().optional().default(""),
  rate: z.string().optional().default(""),
});

export const addEvidenceSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.string().min(1, "Evidence type is required"),
  storageLocation: z.string().optional().default(""),
  custodian: z.string().optional().default(""),
});

export const addTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  assignedTo: z.string().optional().default(""),
  dueDate: z.string().optional().default(""),
  critical: z.boolean().optional().default(false),
});

export const addNarrativeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  highlight: z.string().optional().default("yellow"),
});

export const addFinancialSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  date: z.string().optional().default(""),
});

export type AddResourceValues = z.infer<typeof addResourceSchema>;
export type AddEvidenceValues = z.infer<typeof addEvidenceSchema>;
export type AddTaskValues = z.infer<typeof addTaskSchema>;
export type AddNarrativeValues = z.infer<typeof addNarrativeSchema>;
export type AddFinancialValues = z.infer<typeof addFinancialSchema>;
