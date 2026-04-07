import { z } from "zod";

export const addNarrativeSchema = z.object({
  title: z.string().optional().default(""),
  content: z.string().min(1, "Narrative content is required"),
});

export const editNarrativeSchema = z.object({
  title: z.string().optional().default(""),
  content: z.string().min(1, "Narrative content is required"),
});

export const addFinancialEntrySchema = z.object({
  kind: z.string().min(1, "Entry type is required"),
  type: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional().default(""),
});

export type AddNarrativeValues = z.infer<typeof addNarrativeSchema>;
export type EditNarrativeValues = z.infer<typeof editNarrativeSchema>;
export type AddFinancialEntryValues = z.infer<typeof addFinancialEntrySchema>;
