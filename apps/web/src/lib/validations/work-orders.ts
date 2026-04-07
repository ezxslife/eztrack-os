import { z } from "zod";

export const createWorkOrderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  scheduledDate: z.string().optional().default(""),
  dueDate: z.string().optional().default(""),
  estimatedCost: z.string().optional().default(""),
  assignTo: z.string().optional().default(""),
});

export const addWorkOrderNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

export type CreateWorkOrderValues = z.infer<typeof createWorkOrderSchema>;
export type AddWorkOrderNoteValues = z.infer<typeof addWorkOrderNoteSchema>;
