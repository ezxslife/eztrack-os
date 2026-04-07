import { z } from "zod";

export const quickReportSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  location: z.string().optional().default(""),
  priority: z.string().min(1, "Priority is required"),
  notes: z.string().optional().default(""),
});

export const editDailyLogSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  location: z.string().optional().default(""),
  priority: z.string().min(1, "Priority is required"),
  notes: z.string().optional().default(""),
  staffInvolved: z.string().optional().default(""),
});

export type QuickReportValues = z.infer<typeof quickReportSchema>;
export type EditDailyLogValues = z.infer<typeof editDailyLogSchema>;
