import { z } from "zod";

// ── Daily Log ─────────────────────────────────────────────────
export const DailyLogSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200),
  synopsis: z.string().min(1, "Synopsis is required").max(5000),
  location_id: z.string().uuid("Select a location"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "pending", "high_prio", "closed", "archived"]),
});

export type DailyLogInput = z.infer<typeof DailyLogSchema>;

// ── Incident ──────────────────────────────────────────────────
export const IncidentSchema = z.object({
  incident_type: z.string().min(1, "Incident type is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum([
    "open",
    "assigned",
    "in_progress",
    "follow_up",
    "investigation",
    "completed",
    "closed",
    "archived",
  ]),
  location_id: z.string().uuid("Select a location"),
  synopsis: z.string().min(1, "Description is required").max(10000),
  reported_by: z.string().optional(),
});

export type IncidentInput = z.infer<typeof IncidentSchema>;

// ── Dispatch ──────────────────────────────────────────────────
export const DispatchSchema = z.object({
  dispatch_code: z.string().min(1, "Dispatch code is required"),
  priority: z.enum(["critical", "high", "medium", "low"]),
  location_id: z.string().uuid("Select a location"),
  description: z.string().min(1, "Description is required").max(2000),
  assigned_staff_id: z.string().uuid().nullable().optional(),
});

export type DispatchInput = z.infer<typeof DispatchSchema>;

// ── Patron ────────────────────────────────────────────────────
export const PatronSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  flag: z.enum(["none", "watch", "banned", "vip", "warning"]).default("none"),
  notes: z.string().max(5000).optional(),
});

export type PatronInput = z.infer<typeof PatronSchema>;

// ── Briefing ──────────────────────────────────────────────────
export const BriefingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(10000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export type BriefingInput = z.infer<typeof BriefingSchema>;

// ── Work Order ────────────────────────────────────────────────
export const WorkOrderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assigned_to: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid("Select a location"),
});

export type WorkOrderInput = z.infer<typeof WorkOrderSchema>;
