import type {
  StaffRole,
  DailyLogStatus,
  IncidentStatus,
  IncidentSeverity,
  DispatchStatus,
  DispatchPriority,
  OfficerStatus,
  PatronFlag,
  CaseStatus,
  WorkOrderStatus,
  LostFoundStatus,
} from "./enums";

// ── Core Domain Types ─────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Property {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  created_at: string;
}

export interface Location {
  id: string;
  property_id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  children?: Location[];
}

export interface Profile {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: StaffRole;
  property_id: string | null;
  phone: string | null;
  created_at: string;
}

export interface StaffStatusRecord {
  id: string;
  staff_id: string;
  status: OfficerStatus;
  updated_at: string;
  profile?: Profile;
}

// ── Module Types ──────────────────────────────────────────────

export interface DailyLog {
  id: string;
  record_number: string;
  topic: string;
  location_id: string;
  synopsis: string;
  priority: "low" | "medium" | "high";
  status: DailyLogStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  location?: Location;
  creator?: Profile;
}

export interface Incident {
  id: string;
  record_number: string;
  incident_type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location_id: string;
  synopsis: string;
  reported_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  location?: Location;
  creator?: Profile;
}

export interface Dispatch {
  id: string;
  record_number: string;
  dispatch_code: string;
  priority: DispatchPriority;
  status: DispatchStatus;
  location_id: string;
  description: string;
  assigned_staff_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  location?: Location;
  assigned_staff?: Profile;
  creator?: Profile;
}

export interface Patron {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  flag: PatronFlag;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Briefing {
  id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  created_by: string;
  created_at: string;
  creator?: Profile;
}

export interface FoundItem {
  id: string;
  description: string;
  location_id: string;
  status: LostFoundStatus;
  photo_url: string | null;
  found_by: string;
  found_at: string;
  returned_to: string | null;
  returned_at: string | null;
}

export interface Case {
  id: string;
  record_number: string;
  case_type: string;
  status: CaseStatus;
  synopsis: string;
  lead_investigator: string | null;
  created_by: string;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: DispatchPriority;
  status: WorkOrderStatus;
  assigned_to: string | null;
  location_id: string;
  created_by: string;
  created_at: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

// ── Utility Types ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  dateRange: { from: string | null; to: string | null };
  location_id: string | null;
}
