// ── Staff & Auth ──────────────────────────────────────────────
export enum StaffRole {
  SuperAdmin = "super_admin",
  OrgAdmin = "org_admin",
  Manager = "manager",
  Dispatcher = "dispatcher",
  Supervisor = "supervisor",
  Staff = "staff",
  Viewer = "viewer",
}

// ── Daily Log ─────────────────────────────────────────────────
export enum DailyLogStatus {
  Open = "open",
  Pending = "pending",
  HighPriority = "high_prio",
  Closed = "closed",
  Archived = "archived",
}

// ── Incidents ─────────────────────────────────────────────────
export enum IncidentStatus {
  Open = "open",
  Assigned = "assigned",
  InProgress = "in_progress",
  FollowUp = "follow_up",
  Investigation = "investigation",
  Completed = "completed",
  Closed = "closed",
  Archived = "archived",
}

export enum IncidentSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

// ── Dispatch ──────────────────────────────────────────────────
export enum DispatchStatus {
  Pending = "pending",
  Scheduled = "scheduled",
  InProgress = "in_progress",
  OnScene = "on_scene",
  Overdue = "overdue",
  Cleared = "cleared",
  Completed = "completed",
}

export enum DispatchPriority {
  Critical = "critical",
  High = "high",
  Medium = "medium",
  Low = "low",
}

// ── Officer / Staff Status ────────────────────────────────────
export enum OfficerStatus {
  Available = "available",
  OnBreak = "on_break",
  Dispatched = "dispatched",
  OnScene = "on_scene",
  Overdue = "overdue",
  OffDuty = "off_duty",
  BreakOverdue = "break_overdue",
}

// ── Patron ────────────────────────────────────────────────────
export enum PatronFlag {
  None = "none",
  Watch = "watch",
  Banned = "banned",
  VIP = "vip",
  Warning = "warning",
}

// ── Lost & Found ──────────────────────────────────────────────
export enum LostFoundStatus {
  Stored = "stored",
  PendingReturn = "pending_return",
  Returned = "returned",
  Disposed = "disposed",
  Overdue = "overdue",
}

// ── Cases ─────────────────────────────────────────────────────
export enum CaseStatus {
  Open = "open",
  OnHold = "on_hold",
  Closed = "closed",
  Archived = "archived",
}

// ── Work Orders ───────────────────────────────────────────────
export enum WorkOrderStatus {
  Open = "open",
  Assigned = "assigned",
  InProgress = "in_progress",
  Completed = "completed",
  Closed = "closed",
}

// ── Universal Status (for generic mapping) ────────────────────
export type UniversalStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "follow_up"
  | "investigation"
  | "completed"
  | "closed"
  | "archived"
  | "pending"
  | "scheduled";
