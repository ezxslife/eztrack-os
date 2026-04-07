import {
  DailyLogStatus,
  DispatchPriority,
  DispatchStatus,
  IncidentSeverity,
  IncidentStatus,
  OfficerStatus,
  StaffRole,
} from "@eztrack/shared";

export const previewProfile = {
  avatar_url: null,
  created_at: "2026-04-07T11:00:00.000Z",
  email: "preview.operator@eztrack.app",
  full_name: "Avery Tran",
  id: "preview-user",
  org_id: "preview-org",
  phone: "555-0182",
  property_id: "preview-property",
  role: StaffRole.Dispatcher,
} as const;

export const previewDashboardStats = {
  activeDispatches: 4,
  dailyLogsToday: 27,
  officersOnDuty: 18,
  totalIncidents: 12,
} as const;

export const previewLocations = [
  { id: "loc-main-gate", name: "Main Gate", propertyId: "preview-property" },
  { id: "loc-north-gate", name: "North Gate", propertyId: "preview-property" },
  { id: "loc-vip-west", name: "VIP West", propertyId: "preview-property" },
  { id: "loc-section-112", name: "Section 112", propertyId: "preview-property" },
  { id: "loc-dock-3", name: "Dock 3", propertyId: "preview-property" },
] as const;

export const previewIncidents = [
  {
    id: "inc-2407",
    recordNumber: "INC-2407",
    type: "Security Breach",
    severity: IncidentSeverity.High,
    status: IncidentStatus.InProgress,
    location: "North Gate",
    synopsis: "Credential mismatch triggered an access escalation during vendor load-in.",
    assignedTo: "Jordan Hughes",
    reportedBy: "Checkpoint Officer",
    createdAt: "2026-04-07T10:48:00.000Z",
  },
  {
    id: "inc-2406",
    recordNumber: "INC-2406",
    type: "Medical Emergency",
    severity: IncidentSeverity.Critical,
    status: IncidentStatus.Assigned,
    location: "Section 112",
    synopsis: "Guest collapsed in the aisle and EMS was requested through venue command.",
    assignedTo: "Riley Chen",
    reportedBy: "Guest Services",
    createdAt: "2026-04-07T10:32:00.000Z",
  },
  {
    id: "inc-2405",
    recordNumber: "INC-2405",
    type: "Theft",
    severity: IncidentSeverity.Medium,
    status: IncidentStatus.FollowUp,
    location: "VIP West",
    synopsis: "Patron reported a missing bag after re-entering the suite corridor.",
    assignedTo: "Avery Patel",
    reportedBy: "VIP Concierge",
    createdAt: "2026-04-07T09:58:00.000Z",
  },
] as const;

export const previewIncidentNarratives: Record<
  string,
  Array<{
    authorName: string | null;
    content: string;
    createdAt: string;
    id: string;
    title: string;
  }>
> = {
  "inc-2407": [
    {
      authorName: "Jordan Hughes",
      content:
        "Vendor credentials failed validation at the north gate. Secondary verification confirmed an expired access window and the subject was held outside the perimeter.",
      createdAt: "2026-04-07T10:51:00.000Z",
      id: "nar-2407-1",
      title: "Primary Narrative",
    },
  ],
  "inc-2406": [
    {
      authorName: "Riley Chen",
      content:
        "Medical unit was dispatched immediately after staff observed the patron collapse in Section 112. Crowd spacing was maintained until EMS arrival.",
      createdAt: "2026-04-07T10:35:00.000Z",
      id: "nar-2406-1",
      title: "Initial Medical Summary",
    },
  ],
};

export const previewIncidentParticipants: Record<
  string,
  Array<{
    description: string | null;
    firstName: string;
    id: string;
    lastName: string;
    personType: string;
    primaryRole: string;
  }>
> = {
  "inc-2407": [
    {
      description: "Vendor lead for staging contractor",
      firstName: "Marco",
      id: "part-2407-1",
      lastName: "Silva",
      personType: "staff",
      primaryRole: "subject",
    },
  ],
  "inc-2406": [
    {
      description: "Patron seated in lower bowl",
      firstName: "Dana",
      id: "part-2406-1",
      lastName: "Reed",
      personType: "patron",
      primaryRole: "victim",
    },
  ],
};

export const previewIncidentFinancials: Record<
  string,
  Array<{
    amount: number;
    createdAt: string;
    createdBy: string | null;
    description: string | null;
    entryType: string;
    id: string;
  }>
> = {
  "inc-2405": [
    {
      amount: 480,
      createdAt: "2026-04-07T10:12:00.000Z",
      createdBy: "Avery Patel",
      description: "Estimated value of the missing bag contents.",
      entryType: "property_loss",
      id: "fin-2405-1",
    },
  ],
};

export const previewDispatches = [
  {
    id: "disp-101",
    recordNumber: "DSP-0101",
    dispatchCode: "MED",
    priority: DispatchPriority.Critical,
    status: DispatchStatus.InProgress,
    location: "Dock 3",
    description: "Alarm panel fault during load-out. Supervisor requested immediate response.",
    officerName: "Unit Bravo",
    officerId: "officer-bravo",
    reporterName: "Operations Lead",
    callSource: "radio",
    sublocation: "Loading Tunnel",
    createdAt: "2026-04-07T10:42:00.000Z",
  },
  {
    id: "disp-102",
    recordNumber: "DSP-0102",
    dispatchCode: "C2",
    priority: DispatchPriority.Medium,
    status: DispatchStatus.Scheduled,
    location: "South Concourse",
    description: "Follow-up patrol requested for recurring gate tailgating.",
    officerName: "Unit Delta",
    officerId: "officer-delta",
    reporterName: "Venue Security",
    callSource: "phone",
    sublocation: null,
    createdAt: "2026-04-07T10:05:00.000Z",
  },
  {
    id: "disp-103",
    recordNumber: "DSP-0103",
    dispatchCode: "SEC",
    priority: DispatchPriority.High,
    status: DispatchStatus.OnScene,
    location: "Main Gate",
    description: "Patron altercation under review by perimeter team.",
    officerName: "Unit Echo",
    officerId: "officer-echo",
    reporterName: "Guest Services",
    callSource: "radio",
    sublocation: "Turnstiles",
    createdAt: "2026-04-07T09:54:00.000Z",
  },
] as const;

export const previewOfficers = [
  {
    avatarUrl: null,
    id: "officer-bravo",
    name: "Unit Bravo",
    status: OfficerStatus.Dispatched,
    updatedAt: "2026-04-07T10:42:00.000Z",
  },
  {
    avatarUrl: null,
    id: "officer-delta",
    name: "Unit Delta",
    status: OfficerStatus.OnBreak,
    updatedAt: "2026-04-07T10:10:00.000Z",
  },
  {
    avatarUrl: null,
    id: "officer-echo",
    name: "Unit Echo",
    status: OfficerStatus.OnScene,
    updatedAt: "2026-04-07T09:57:00.000Z",
  },
] as const;

export const previewDailyLogs = [
  {
    createdAt: "2026-04-07T10:56:00.000Z",
    createdBy: "Avery Tran",
    id: "log-3102",
    location: "Main Gate",
    priority: "medium",
    recordNumber: "DL-3102",
    status: DailyLogStatus.Open,
    synopsis: "Credential screening pace normalized after the morning ingress surge.",
    topic: "Ingress update",
  },
  {
    createdAt: "2026-04-07T10:18:00.000Z",
    createdBy: "Jordan Hughes",
    id: "log-3101",
    location: "Dock 3",
    priority: "high",
    recordNumber: "DL-3101",
    status: DailyLogStatus.HighPriority,
    synopsis: "Alarm panel diagnostics escalated to facilities and dispatch.",
    topic: "Load-out alarm fault",
  },
  {
    createdAt: "2026-04-07T09:40:00.000Z",
    createdBy: "Riley Chen",
    id: "log-3100",
    location: "Section 112",
    priority: "medium",
    recordNumber: "DL-3100",
    status: DailyLogStatus.Pending,
    synopsis: "Medical response debrief queued for supervisor review.",
    topic: "Medical follow-up",
  },
] as const;

export const previewRecentActivity = [
  {
    action: "status_changed",
    actorName: "Jordan Hughes",
    changes: { status: "in_progress" },
    createdAt: "2026-04-07T10:50:00.000Z",
    entityId: "inc-2407",
    entityType: "incident",
    id: "act-1",
  },
  {
    action: "dispatch_assigned",
    actorName: "Avery Tran",
    changes: { unit: "Unit Bravo" },
    createdAt: "2026-04-07T10:44:00.000Z",
    entityId: "disp-101",
    entityType: "dispatch",
    id: "act-2",
  },
  {
    action: "daily_log_created",
    actorName: "Avery Tran",
    changes: null,
    createdAt: "2026-04-07T10:56:00.000Z",
    entityId: "log-3102",
    entityType: "daily_log",
    id: "act-3",
  },
] as const;
