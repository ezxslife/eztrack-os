import { z } from "zod";

export const createBriefingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  priority: z.string().min(1, "Priority is required"),
  recipients: z.string().optional().default(""),
  sourceModule: z.string().optional().default("manual"),
  linkUrl: z.string().optional().default(""),
});

export const editBriefingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  priority: z.string().min(1, "Priority is required"),
});

export type CreateBriefingValues = z.infer<typeof createBriefingSchema>;
export type EditBriefingValues = z.infer<typeof editBriefingSchema>;
