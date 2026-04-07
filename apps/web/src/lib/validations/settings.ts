import { z } from "zod";

export const addLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  parentPropertyId: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  locationType: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export const addPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().optional().default(""),
  propertyType: z.string().optional().default(""),
  timezone: z.string().optional().default(""),
});

export const addDropdownValueSchema = z.object({
  value: z.string().min(1, "Value is required"),
  displayLabel: z.string().min(1, "Display label is required"),
  sortOrder: z.string().optional().default(""),
});

export const addNotificationRuleSchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  pushEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(false),
  smsEnabled: z.boolean().default(false),
  recipients: z.string().min(1, "Recipients are required"),
});

export type AddLocationValues = z.infer<typeof addLocationSchema>;
export type AddPropertyValues = z.infer<typeof addPropertySchema>;
export type AddDropdownValues = z.infer<typeof addDropdownValueSchema>;
export type AddNotificationRuleValues = z.infer<typeof addNotificationRuleSchema>;
