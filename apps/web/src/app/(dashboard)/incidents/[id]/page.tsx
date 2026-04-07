"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  UserPlus,
  ArrowUpRight,
  CheckSquare,
  Square,
  Plus,
  FileText,
  Image as ImageIcon,
  Link2,
  Paperclip,
  ClipboardList,
  DollarSign,
  Share2,
  Shield,
  ScrollText,
  Upload,
  Eye,
  Download,
  Star,
  Lock,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  X,
  Copy,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  Video,
  File,
  Users,
  Building2,
  Globe,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import {
  fetchIncidentById,
  fetchIncidentNarratives,
  fetchIncidentParticipants,
  fetchIncidentFinancials,
  type IncidentDetail,
  type IncidentNarrative,
  type IncidentParticipant,
  type IncidentFinancial,
} from "@/lib/queries/incidents";
import { formatDateTime } from "@/lib/utils/time";

const AddNarrativeModal = dynamic(() => import("@/components/modals/incidents/AddNarrativeModal").then(m => ({ default: m.AddNarrativeModal })), { ssr: false });
const EditNarrativeModal = dynamic(() => import("@/components/modals/incidents/EditNarrativeModal").then(m => ({ default: m.EditNarrativeModal })), { ssr: false });
const AddParticipantWizard = dynamic(() => import("@/components/modals/incidents/AddParticipantWizard").then(m => ({ default: m.AddParticipantWizard })), { ssr: false });
const UploadMediaModal = dynamic(() => import("@/components/modals/incidents/UploadMediaModal").then(m => ({ default: m.UploadMediaModal })), { ssr: false });
const AddFinancialEntryModal = dynamic(() => import("@/components/modals/incidents/AddFinancialEntryModal").then(m => ({ default: m.AddFinancialEntryModal })), { ssr: false });
const ShareIncidentModal = dynamic(() => import("@/components/modals/incidents/ShareIncidentModal").then(m => ({ default: m.ShareIncidentModal })), { ssr: false });
const LinkIncidentModal = dynamic(() => import("@/components/modals/incidents/LinkIncidentModal").then(m => ({ default: m.LinkIncidentModal })), { ssr: false });
const RiskAssessmentModal = dynamic(() => import("@/components/modals/incidents/RiskAssessmentModal").then(m => ({ default: m.RiskAssessmentModal })), { ssr: false });
const TransferOwnershipModal = dynamic(() => import("@/components/modals/incidents/TransferOwnershipModal").then(m => ({ default: m.TransferOwnershipModal })), { ssr: false });
const DeleteIncidentModal = dynamic(() => import("@/components/modals/incidents/DeleteIncidentModal").then(m => ({ default: m.DeleteIncidentModal })), { ssr: false });
const LockIncidentModal = dynamic(() => import("@/components/modals/incidents/LockIncidentModal").then(m => ({ default: m.LockIncidentModal })), { ssr: false });
const EscalationChainModal = dynamic(() => import("@/components/modals/workflows/EscalationChainModal").then(m => ({ default: m.EscalationChainModal })), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA — ALL 11 TABS
   ═══════════════════════════════════════════════════════════════ */

const INCIDENT = {
  id: "1",
  recordNumber: "2026-04-00042",
  type: "Medical",
  specific: "Overdose",
  category: "Heroin",
  severity: "critical" as const,
  status: "in_progress",
  riskLevel: "high",
  riskAssessmentNotes:
    "Active unconsciousness, multiple ODs same event — elevated to high risk per protocol.",
  location: "North Camping Area",
  specificLocation: "Tent C12, near bar counter",
  zone: "Campgrounds",
  event: "Magnetic World Music Festival",
  synopsis:
    "19-year-old patron collapsed near campground tent C12. Appeared unresponsive, pale complexion, shallow breathing. Medics on scene immediately administered Narcan. Transported to County Hospital.",
  description:
    "Patient found lying on ground by tent C12, unresponsive. Pale skin, diaphoretic, shallow respirations approximately 8/min. Pinpoint pupils noted. Narcan 2mg IN administered at 2:18 PM with improvement in respirations within 2 minutes. Patient became semi-conscious. EMS called for transport.",
  occurrenceDateTime: "Apr 5, 2026 2:15 PM",
  reportedDateTime: "Apr 5, 2026 2:30 PM",
  assignedTo: "Officer Mike Torres",
  createdBy: "Officer Sarah Chen",
  owner: "Officer Sarah Chen",
  createdAt: "Apr 5, 2026 2:30 PM",
  updatedAt: "Apr 5, 2026 4:30 PM",
  totalLosses: 2650.0,
  totalSavings: 800.0,
  isExclusive: false,
  isGlobal: false,
  isLocked: false,
  customField1Label: "Hospital Case #",
  customField1Value: "MRH-123456",
  customField2Label: "Insurance Claim #",
  customField2Value: "IC-2026-0891",
  customField3Label: "Badge # (Primary)",
  customField3Value: "B-4421",
};

const CHECKLIST = [
  { id: "c1", label: "Initial medical assessment", checked: true, completedBy: "Officer Sarah", completedAt: "2:32 PM" },
  { id: "c2", label: "Narcan administered (if needed)", checked: true, completedBy: "EMT-4 Williams", completedAt: "2:35 PM" },
  { id: "c3", label: "Police notified", checked: true, completedBy: "Officer Sarah", completedAt: "3:00 PM" },
  { id: "c4", label: "Family contacted", checked: false, completedBy: null, completedAt: null },
  { id: "c5", label: "Toxicology results reviewed", checked: false, completedBy: null, completedAt: null },
  { id: "c6", label: "Medical records obtained", checked: false, completedBy: null, completedAt: null },
];

const NARRATIVES = [
  {
    id: "n1",
    title: "Initial Report",
    author: "Officer Sarah Chen",
    initials: "SC",
    timestamp: "Apr 5, 2:30 PM",
    isEdited: false,
    editedBy: null,
    editedAt: null,
    content:
      "At 2:15 PM, patron collapsed near campground tent C12. Appeared unresponsive, pale complexion, shallow breathing. Medics on scene immediately administered Narcan. Patient responded after approximately 2 minutes, became semi-conscious. EMS dispatched at 2:20 PM for transport. Patron's companion (Jennifer R.) identified and provided contact information for family. Scene secured, evidence collected (see Media tab).",
  },
  {
    id: "n2",
    title: "Medical Follow-Up",
    author: "Officer Mike Torres",
    initials: "MT",
    timestamp: "Apr 5, 4:10 PM",
    isEdited: true,
    editedBy: "Officer Mike Torres",
    editedAt: "Apr 5, 4:15 PM",
    content:
      "Hospital confirmed opioid overdose (heroin). Patient conscious, stable, admitted to ICU for observation. Vitals stabilizing: BP 118/72, HR 88, O2 sat 97%. Mother (Maria Thompson) contacted and arrived at hospital at 3:45 PM. Hospital social worker assigned. Patient cooperative and willing to provide statement when recovered.",
  },
  {
    id: "n3",
    title: "Investigation Status",
    author: "Officer Sarah Chen",
    initials: "SC",
    timestamp: "Apr 5, 3:25 PM",
    isEdited: false,
    editedBy: null,
    editedAt: null,
    content:
      "Reviewing circumstantial evidence of narcotics source. Witness Jennifer R. identified as present in tent at time of overdose. Follow-up interviews scheduled with 3 additional witnesses who were in the campground area. Coordinating with narcotics unit regarding potential distribution investigation. Evidence bag #E-0042-01 submitted to secure storage.",
  },
];

const PARTICIPANTS = [
  {
    id: "p1",
    name: "Alex Thompson",
    type: "Patron",
    patronId: "#2890",
    role: "Victim",
    secondaryRole: "Witness",
    contact: "alex.t@email.com",
    description: "19-year-old male, found unresponsive near tent C12. Treated for heroin overdose.",
    policeContacted: true,
    policeResult: "Statement taken, no charges filed",
    medicalAttention: true,
    medicalDetails: "Narcan administered on scene, transported to County Hospital ICU",
  },
  {
    id: "p2",
    name: "Jennifer R.",
    type: "Patron",
    patronId: "#3102",
    role: "Witness",
    secondaryRole: null,
    contact: "(555) 234-5678",
    description: "Patron's companion, present in tent at time of overdose. Flagged security.",
    policeContacted: true,
    policeResult: "Interview scheduled",
    medicalAttention: false,
    medicalDetails: null,
  },
  {
    id: "p3",
    name: "Officer Sarah Chen",
    type: "Staff",
    patronId: null,
    role: "Respondent",
    secondaryRole: null,
    contact: "schen@eztrack.io",
    description: "First responder, administered initial aid and secured scene",
    policeContacted: false,
    policeResult: null,
    medicalAttention: false,
    medicalDetails: null,
  },
  {
    id: "p4",
    name: "EMT-4 Williams",
    type: "Staff",
    patronId: null,
    role: "Respondent",
    secondaryRole: null,
    contact: "rwilliams@ems.io",
    description: "Paramedic, administered Narcan 2mg IN and monitored vitals until transport",
    policeContacted: false,
    policeResult: null,
    medicalAttention: false,
    medicalDetails: null,
  },
  {
    id: "p5",
    name: "Sam Ortiz",
    type: "Contact",
    patronId: null,
    role: "Reporting Party",
    secondaryRole: null,
    contact: "(555) 876-5432",
    description: "Festival staff member who called in the medical alert to dispatch",
    policeContacted: false,
    policeResult: null,
    medicalAttention: false,
    medicalDetails: null,
  },
];

const MEDIA = [
  {
    id: "m1",
    type: "photo",
    title: "Evidence: Needle",
    description: "Discarded syringe found at scene near tent C12",
    uploadedBy: "Officer Sarah Chen",
    uploadedAt: "Apr 5, 3:45 PM",
    size: "2.3 MB",
    isPrimary: true,
    isProtected: true,
    tags: ["evidence", "narcotics"],
  },
  {
    id: "m2",
    type: "photo",
    title: "Scene Overview",
    description: "Wide shot of tent C12 area showing scene layout",
    uploadedBy: "Officer Sarah Chen",
    uploadedAt: "Apr 5, 2:40 PM",
    size: "3.1 MB",
    isPrimary: false,
    isProtected: false,
    tags: ["scene", "location"],
  },
  {
    id: "m3",
    type: "video",
    title: "Witness Interview - Jennifer R.",
    description: "Initial statement from witness present in tent",
    uploadedBy: "Officer Mike Torres",
    uploadedAt: "Apr 5, 4:30 PM",
    size: "48.6 MB",
    isPrimary: false,
    isProtected: true,
    tags: ["witness", "interview"],
  },
  {
    id: "m4",
    type: "document",
    title: "EMS Run Sheet (Scanned)",
    description: "Scanned copy of EMS run sheet from transport",
    uploadedBy: "EMT-4 Williams",
    uploadedAt: "Apr 5, 5:10 PM",
    size: "1.8 MB",
    isPrimary: false,
    isProtected: false,
    tags: ["medical", "documentation"],
  },
];

const RELATED_INCIDENTS = [
  {
    id: "ri1",
    incidentNumber: "2026-04-00040",
    type: "Medical",
    specific: "Overdose",
    status: "completed",
    riskLevel: "high",
    relationship: "parent" as const,
    notes: "Same patron — previous OD incident earlier in the day at east campground",
    createdBy: "Lt. Nguyen",
    createdAt: "Apr 5, 12:15 PM",
  },
  {
    id: "ri2",
    incidentNumber: "2026-04-00045",
    type: "Drugs",
    specific: "Distribution",
    status: "in_progress",
    riskLevel: "critical",
    relationship: "related" as const,
    notes: "Suspected distribution source for narcotics in campground area",
    createdBy: "Detective Lee",
    createdAt: "Apr 5, 6:00 PM",
  },
];

const ATTACHED_RECORDS = {
  dailyLogs: [
    { id: "dl1", number: "DL-042", title: "Campus medical alert — overdose reported", date: "Apr 5, 2:30 PM", escalated: true },
  ],
  dispatches: [
    { id: "dsp1", number: "DSP-156", title: "EMS Response - Overdose", assignedTo: "Officer Sarah, EMT Williams", date: "Apr 5, 2:35 PM" },
  ],
  cases: [
    { id: "cs1", number: "CS-0012", title: "Investigation: Heroin Distribution", status: "open", date: "Apr 6" },
  ],
  foundItems: [] as { id: string; number: string; title: string }[],
  briefings: [
    { id: "br1", number: "BRF-89", title: "Incident Follow-Up Alert", recipients: "All Managers", date: "Apr 5, 4:30 PM" },
    { id: "br2", number: "BRF-91", title: "Shared: Medical Overdose Investigation", recipients: "Legal Team", date: "Apr 5, 5:00 PM" },
  ],
};

const FORMS = [
  {
    id: "f1",
    name: "Injury Report",
    completed: true,
    completedAt: "Apr 5, 3:25 PM",
    completedBy: "Officer Sarah",
    fields: [
      { label: "Patient Name", value: "Alex Thompson" },
      { label: "Injury Type", value: "Overdose — Opioid" },
      { label: "Location on Body", value: "N/A (systemic)" },
      { label: "Mechanism", value: "Heroin ingestion (suspected IV)" },
      { label: "Pain Level", value: "N/A (unconscious on arrival)" },
      { label: "Medical Responders", value: "Officer Sarah Chen, EMT-4 Williams" },
      { label: "Hospital Transferred", value: "County Hospital" },
      { label: "Medical Record #", value: "MRH-123456" },
    ],
  },
  {
    id: "f2",
    name: "Witness Statement",
    completed: false,
    completedAt: null,
    completedBy: null,
    lastSaved: "Apr 5, 4:00 PM",
    fields: [
      { label: "Witness Name", value: "Jennifer R." },
      { label: "What did you see?", value: "I was in the tent with Alex when he started acting strange..." },
    ],
  },
  {
    id: "f3",
    name: "Medical Run Sheet",
    completed: true,
    completedAt: "Apr 5, 5:15 PM",
    completedBy: "EMT-4 Williams",
    fields: [
      { label: "Patient", value: "Alex Thompson, M, 19" },
      { label: "Vitals (Initial)", value: "BP 90/60, HR 52, RR 8, O2 88%" },
      { label: "Vitals (Post-Narcan)", value: "BP 118/72, HR 88, RR 16, O2 97%" },
      { label: "Medications", value: "Narcan (Naloxone) 2mg IN at 2:18 PM" },
      { label: "Procedures", value: "Nasal Narcan, IV access established, O2 NRB 15L" },
      { label: "Destination", value: "County Hospital ER" },
    ],
  },
];

const SAVINGS_LOSSES = [
  { id: "sl1", type: "Medical Cost", isSaving: false, value: 350.0, description: "Paramedic EMS response and transport to County Hospital", createdBy: "Officer Sarah", createdAt: "Apr 5, 6:00 PM" },
  { id: "sl2", type: "Property Damage", isSaving: false, value: 1500.0, description: "Tent C12 canvas torn during emergency response, table overturned", createdBy: "Officer Sarah", createdAt: "Apr 5, 6:00 PM" },
  { id: "sl3", type: "Theft", isSaving: false, value: 800.0, description: "DJ equipment reported missing from adjacent tent during commotion", createdBy: "Officer Mike Torres", createdAt: "Apr 5, 7:00 PM" },
  { id: "sl4", type: "Recovery", isSaving: true, value: 800.0, description: "Stolen DJ equipment recovered from suspect vehicle", createdBy: "Officer Mike Torres", createdAt: "Apr 6, 10:00 AM" },
];

const SHARES = [
  {
    id: "s1",
    sharedWith: "Officer Mike Torres",
    sharedWithType: "user" as const,
    permission: "contributor" as const,
    instructions: "Conduct follow-up interviews with campground witnesses",
    expiresAt: "Apr 12, 2026",
    expireOnClose: false,
    isExpired: false,
    sharedBy: "Officer Sarah Chen",
    sharedAt: "Apr 5, 3:00 PM",
  },
  {
    id: "s2",
    sharedWith: "Legal Team",
    sharedWithType: "role" as const,
    permission: "view" as const,
    instructions: "Review for liability assessment — hospital costs may be claimable",
    expiresAt: null,
    expireOnClose: false,
    isExpired: false,
    sharedBy: "Officer Sarah Chen",
    sharedAt: "Apr 5, 5:00 PM",
  },
  {
    id: "s3",
    sharedWith: "Detective Sarah Lee",
    sharedWithType: "user" as const,
    permission: "co_author" as const,
    instructions: "Help with narcotics distribution investigation",
    expiresAt: null,
    expireOnClose: true,
    isExpired: false,
    sharedBy: "Officer Sarah Chen",
    sharedAt: "Apr 5, 6:30 PM",
  },
  {
    id: "s4",
    sharedWith: "Officer John D.",
    sharedWithType: "user" as const,
    permission: "contributor" as const,
    instructions: "Assist with initial evidence collection",
    expiresAt: "Apr 4, 2026",
    expireOnClose: false,
    isExpired: true,
    sharedBy: "Officer Sarah Chen",
    sharedAt: "Mar 28, 2026",
  },
];

const DOCUMENT_LOG = [
  { id: "dl1", action: "Status Changed", detail: "IN_PROGRESS → FOLLOW_UP_REQUIRED", reason: "Investigation continuing, requires follow-up with witnesses", user: "Officer Sarah Chen", timestamp: "Apr 5, 4:30 PM", auto: "Auto-created briefing: BRF-89", icon: "status" as const },
  { id: "dl2", action: "Narrative Edited", detail: "\"Medical Follow-Up\" by Officer Mike Torres", reason: "Added hospital vitals update", user: "Officer Mike Torres", timestamp: "Apr 5, 4:15 PM", auto: null, icon: "narrative" as const },
  { id: "dl3", action: "Media Added", detail: "Photo: \"Evidence: Needle\" (2.3 MB)", reason: null, user: "Officer Sarah Chen", timestamp: "Apr 5, 3:45 PM", auto: null, icon: "media" as const },
  { id: "dl4", action: "Form Completed", detail: "Injury Report — submitted", reason: null, user: "Officer Sarah Chen", timestamp: "Apr 5, 3:25 PM", auto: null, icon: "form" as const },
  { id: "dl5", action: "Participant Added", detail: "Jennifer R. (Patron) — Role: Witness", reason: null, user: "Officer Sarah Chen", timestamp: "Apr 5, 3:15 PM", auto: null, icon: "participant" as const },
  { id: "dl6", action: "Shared", detail: "Shared with Officer Mike Torres (Contributor)", reason: "Conduct follow-up interviews", user: "Officer Sarah Chen", timestamp: "Apr 5, 3:00 PM", auto: null, icon: "share" as const },
  { id: "dl7", action: "Checklist Updated", detail: "Police notified — marked complete", reason: null, user: "Officer Sarah Chen", timestamp: "Apr 5, 3:00 PM", auto: null, icon: "checklist" as const },
  { id: "dl8", action: "Narrative Added", detail: "\"Investigation Status\" by Officer Sarah Chen", reason: null, user: "Officer Sarah Chen", timestamp: "Apr 5, 3:25 PM", auto: null, icon: "narrative" as const },
  { id: "dl9", action: "Dispatch Linked", detail: "DSP-156 (EMS Response)", reason: "Auto-linked on escalation", user: "System", timestamp: "Apr 5, 2:35 PM", auto: "Officers added: Sarah Chen (respondent), Williams (respondent)", icon: "link" as const },
  { id: "dl10", action: "Status Changed", detail: "OPEN → IN_PROGRESS", reason: null, user: "Officer Sarah Chen", timestamp: "Apr 5, 2:33 PM", auto: null, icon: "status" as const },
  { id: "dl11", action: "Incident Created", detail: "Medical - Overdose — Risk: High", reason: null, user: "Officer Sarah Chen", timestamp: "Apr 5, 2:30 PM", auto: "Status: OPEN", icon: "create" as const },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = params.id as string;

  // Data state — loaded from Supabase
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [narratives, setNarratives] = useState<IncidentNarrative[]>([]);
  const [participants, setParticipants] = useState<IncidentParticipant[]>([]);
  const [financials, setFinancials] = useState<IncidentFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("report");
  const [checklist, setChecklist] = useState(CHECKLIST);

  // Modal states
  const [narrativeModal, setNarrativeModal] = useState(false);
  const [editNarrativeModal, setEditNarrativeModal] = useState<{ open: boolean; data?: { id: string; title: string; content: string } }>({ open: false });
  const [participantWizard, setParticipantWizard] = useState(false);
  const [mediaModal, setMediaModal] = useState(false);
  const [financialModal, setFinancialModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [riskModal, setRiskModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [lockModal, setLockModal] = useState(false);
  const [escalationChainModal, setEscalationChainModal] = useState(false);

  // Fetch all incident data from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [inc, narr, parts, fins] = await Promise.all([
          fetchIncidentById(incidentId),
          fetchIncidentNarratives(incidentId),
          fetchIncidentParticipants(incidentId),
          fetchIncidentFinancials(incidentId),
        ]);
        if (cancelled) return;
        setIncident(inc);
        setNarratives(narr);
        setParticipants(parts);
        setFinancials(fins);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load incident");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [incidentId]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        <span className="ml-2 text-[13px] text-[var(--text-tertiary)]">Loading incident…</span>
      </div>
    );
  }

  // Error state
  if (error || !incident) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-[var(--status-error)]" />
        <p className="text-[13px] text-[var(--text-secondary)]">{error || "Incident not found"}</p>
        <Link href="/incidents">
          <Button variant="outline" size="sm">Back to Incidents</Button>
        </Link>
      </div>
    );
  }

  // Compute financial totals from real data
  const totalLosses = financials.filter((f) => f.entryType === "loss").reduce((sum, f) => sum + f.amount, 0);
  const totalSavings = financials.filter((f) => f.entryType === "saving").reduce((sum, f) => sum + f.amount, 0);

  const TAB_LIST = [
    { id: "report", label: "Report Details" },
    { id: "narrative", label: "Narrative", count: narratives.length },
    { id: "participants", label: "Participants", count: participants.length },
    { id: "media", label: "Media", count: MEDIA.length },
    { id: "related", label: "Related", count: RELATED_INCIDENTS.length },
    { id: "attached", label: "Attached Records" },
    { id: "forms", label: "Forms", count: FORMS.length },
    { id: "financial", label: "Savings & Losses" },
    { id: "sharing", label: "Sharing", count: SHARES.filter((s) => !s.isExpired).length },
    { id: "doccontrol", label: "Doc Control" },
    { id: "doclog", label: "Document Log" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Incidents
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                Incident #{incident.recordNumber}
              </h1>
              <StatusBadge status={incident.status} dot />
              <PriorityBadge priority={incident.severity as any} />
            </div>
            <div className="flex items-center gap-4 text-[12px] text-[var(--text-tertiary)]">
              <span>{incident.type}</span>
              <span>·</span>
              <span>Owner: {incident.creator?.fullName || "Unknown"}</span>
              <span>·</span>
              <span>Created {formatDateTime(incident.createdAt)}</span>
              <span>·</span>
              <span>Updated {formatDateTime(incident.updatedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="secondary" size="sm">
              <UserPlus className="h-3.5 w-3.5" />
              Assign
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setEscalationChainModal(true)}>
              <ArrowUpRight className="h-3.5 w-3.5" />
              Escalate to Case
            </Button>
          </div>
        </div>
      </div>

      {/* ── 11 Tabs ── */}
      <Tabs tabs={TAB_LIST} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Tab Content ── */}
      <div>
        {activeTab === "report" && (
          <ReportDetailsTab incident={incident} totalLosses={totalLosses} totalSavings={totalSavings} checklist={checklist} onToggle={toggleCheck} />
        )}
        {activeTab === "narrative" && (
          <NarrativeTab
            narratives={narratives}
            onAddNarrative={() => setNarrativeModal(true)}
            onEditNarrative={(n) => setEditNarrativeModal({ open: true, data: { id: n.id, title: n.title, content: n.content } })}
          />
        )}
        {activeTab === "participants" && (
          <ParticipantsTab participants={participants} onAddParticipant={() => setParticipantWizard(true)} />
        )}
        {activeTab === "media" && (
          <MediaTab onUploadMedia={() => setMediaModal(true)} />
        )}
        {activeTab === "related" && (
          <RelatedIncidentsTab onLinkIncident={() => setLinkModal(true)} />
        )}
        {activeTab === "attached" && <AttachedRecordsTab />}
        {activeTab === "forms" && <FormsTab />}
        {activeTab === "financial" && (
          <SavingsLossesTab financials={financials} totalLosses={totalLosses} totalSavings={totalSavings} onAddEntry={() => setFinancialModal(true)} />
        )}
        {activeTab === "sharing" && (
          <SharingTab onShare={() => setShareModal(true)} />
        )}
        {activeTab === "doccontrol" && (
          <DocumentControlTab
            onTransferOwnership={() => setTransferModal(true)}
            onDeleteIncident={() => setDeleteModal(true)}
            onLockIncident={() => setLockModal(true)}
            onRiskAssessment={() => setRiskModal(true)}
          />
        )}
        {activeTab === "doclog" && <DocumentLogTab />}
      </div>

      {/* ── Modals ── */}
      <AddNarrativeModal
        open={narrativeModal}
        onClose={() => setNarrativeModal(false)}
        onSubmit={async () => { setNarrativeModal(false); }}
      />
      <EditNarrativeModal
        open={editNarrativeModal.open}
        onClose={() => setEditNarrativeModal({ open: false })}
        onSubmit={async () => { setEditNarrativeModal({ open: false }); }}
        initialTitle={editNarrativeModal.data?.title ?? ""}
        initialContent={editNarrativeModal.data?.content ?? ""}
      />
      <AddParticipantWizard
        open={participantWizard}
        onClose={() => setParticipantWizard(false)}
        onSubmit={async () => { setParticipantWizard(false); }}
      />
      <UploadMediaModal
        open={mediaModal}
        onClose={() => setMediaModal(false)}
        onSubmit={async () => { setMediaModal(false); }}
      />
      <AddFinancialEntryModal
        open={financialModal}
        onClose={() => setFinancialModal(false)}
        onSubmit={async () => { setFinancialModal(false); }}
      />
      <ShareIncidentModal
        open={shareModal}
        onClose={() => setShareModal(false)}
        onSubmit={async () => { setShareModal(false); }}
      />
      <LinkIncidentModal
        open={linkModal}
        onClose={() => setLinkModal(false)}
        onSubmit={async () => { setLinkModal(false); }}
      />
      <RiskAssessmentModal
        open={riskModal}
        onClose={() => setRiskModal(false)}
        onSubmit={async () => { setRiskModal(false); }}
      />
      <TransferOwnershipModal
        open={transferModal}
        onClose={() => setTransferModal(false)}
        onSubmit={async () => { setTransferModal(false); }}
      />
      <DeleteIncidentModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={async () => { setDeleteModal(false); }}
        incidentNumber={incident.recordNumber}
      />
      <LockIncidentModal
        open={lockModal}
        onClose={() => setLockModal(false)}
        onConfirm={async () => { setLockModal(false); }}
        isLocked={false}
        incidentNumber={incident.recordNumber}
      />
      <EscalationChainModal
        open={escalationChainModal}
        onClose={() => setEscalationChainModal(false)}
        onSubmit={async (data) => {
          setEscalationChainModal(false);
        }}
        sourceType="incident"
        sourceData={{
          id: incident.id,
          title: incident.recordNumber,
          location: incident.location?.name || "",
          priority: incident.severity || "medium",
          synopsis: incident.synopsis || "",
          createdBy: incident.creator?.fullName || "",
        }}
        targetType="case"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1: REPORT DETAILS
   ═══════════════════════════════════════════════════════════════ */

function ReportDetailsTab({
  incident,
  totalLosses,
  totalSavings,
  checklist,
  onToggle,
}: {
  incident: IncidentDetail;
  totalLosses: number;
  totalSavings: number;
  checklist: typeof CHECKLIST;
  onToggle: (id: string) => void;
}) {
  const completed = checklist.filter((c) => c.checked).length;
  const total = checklist.length;

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 min-w-0 space-y-5">
        {/* Incident Information */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <FieldRow
                label="Incident Number"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    {incident.recordNumber}
                    <button
                      onClick={() => navigator.clipboard.writeText(incident.recordNumber)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                }
              />
              <FieldRow label="Incident Type" value={incident.type} />
              <FieldRow label="Severity" value={<PriorityBadge priority={incident.severity as any} />} />
              <FieldRow label="Disposition" value={incident.disposition || "—"} />
              <FieldRow label="Created" value={`${formatDateTime(incident.createdAt)} by ${incident.creator?.fullName || "Unknown"}`} />
              <FieldRow label="Last Updated" value={formatDateTime(incident.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        {/* Classification & Risk */}
        <Card>
          <CardHeader>
            <CardTitle>Classification & Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <FieldRow label="Status" value={<StatusBadge status={incident.status} dot />} />
              <FieldRow label="Severity" value={<PriorityBadge priority={incident.severity as any} />} />
              <FieldRow label="Owner" value={incident.creator?.fullName || "Unknown"} />
              <FieldRow label="Reported By" value={incident.reportedBy || "—"} />
            </div>
          </CardContent>
        </Card>

        {/* Incident Details */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <FieldRow label="Reported" value={formatDateTime(incident.createdAt)} />
              <FieldRow label="Location" value={incident.location?.name || "Unknown"} />
              <div className="col-span-2">
                <FieldRow label="Synopsis" value={incident.synopsis || "—"} />
              </div>
              <div className="col-span-2">
                <FieldRow label="Full Description" value={incident.description || "—"} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Investigation Checklist</CardTitle>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                {completed} of {total} completed
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            <ProgressBar value={total > 0 ? (completed / total) * 100 : 0} size="sm" />
            <div className="space-y-1.5 mt-3">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className="flex items-center gap-2.5 w-full text-left group py-1"
                >
                  {item.checked ? (
                    <CheckSquare className="h-4 w-4 text-[var(--status-success,#059669)] shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] shrink-0" />
                  )}
                  <span
                    className={`text-[13px] flex-1 ${
                      item.checked
                        ? "text-[var(--text-tertiary)] line-through"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.checked && item.completedBy && (
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {item.completedBy} · {item.completedAt}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[300px] lg:shrink-0 space-y-4">
        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-tertiary)]">Total Losses</span>
              <span className="text-[13px] font-semibold text-red-500">
                ${totalLosses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-tertiary)]">Total Savings</span>
              <span className="text-[13px] font-semibold text-green-500">
                ${totalSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-px bg-[var(--border-default)]" />
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">Net Impact</span>
              <span className={`text-[13px] font-bold ${totalLosses - totalSavings > 0 ? "text-red-500" : "text-green-500"}`}>
                {totalLosses - totalSavings > 0 ? "-" : "+"}${Math.abs(totalLosses - totalSavings).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Document Control Quick */}
        <Card>
          <CardHeader>
            <CardTitle>Document Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[11px] font-medium text-[var(--text-secondary)]">
                SC
              </div>
              <div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">
                  {INCIDENT.owner}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)]">Document Owner</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-secondary)]">Exclusive</span>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                OFF
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--text-secondary)]">Global</span>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                OFF
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Linked Records Quick View */}
        <Card>
          <CardHeader>
            <CardTitle>Linked Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <LinkedRecordRow label="Daily Log" value="DL-042" href="/daily-log" />
            <LinkedRecordRow label="Dispatch" value="DSP-156" href="/dispatch" />
            <LinkedRecordRow label="Case" value="CS-0012" href="/cases" />
            <LinkedRecordRow label="Related" value={`${RELATED_INCIDENTS.length} incidents`} href="#" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2: NARRATIVE
   ═══════════════════════════════════════════════════════════════ */

function NarrativeTab({
  narratives,
  onAddNarrative,
  onEditNarrative,
}: {
  narratives: IncidentNarrative[];
  onAddNarrative: () => void;
  onEditNarrative: (n: { id: string; title: string; content: string }) => void;
}) {
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Narrative Entries ({narratives.length})
        </h3>
        <Button variant="outline" size="sm" onClick={onAddNarrative}>
          <Plus className="h-3.5 w-3.5" />
          Add Narrative
        </Button>
      </div>

      {narratives.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-[13px] text-[var(--text-tertiary)] text-center py-6">
              No narrative entries yet. Add the first report.
            </p>
          </CardContent>
        </Card>
      )}

      {narratives.map((n) => {
        const initials = (n.authorName || "?")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const isEdited = n.updatedAt !== n.createdAt;

        return (
          <Card key={n.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-secondary)] shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                        {n.authorName || "Unknown"}
                      </span>
                    </div>
                    <div className="text-[13px] font-medium text-[var(--text-primary)] mt-0.5">
                      {n.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                      <span>{formatDateTime(n.createdAt)}</span>
                      {isEdited && (
                        <>
                          <span>·</span>
                          <span className="italic">
                            Edited {formatDateTime(n.updatedAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="h-7 w-7 rounded-md hover:bg-[var(--surface-secondary)] flex items-center justify-center transition-colors"
                    onClick={() => onEditNarrative({ id: n.id, title: n.title, content: n.content })}
                  >
                    <Edit className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  </button>
                  <button className="h-7 w-7 rounded-md hover:bg-[var(--surface-secondary)] flex items-center justify-center transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {n.content}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3: PARTICIPANTS
   ═══════════════════════════════════════════════════════════════ */

function ParticipantsTab({ participants, onAddParticipant }: { participants: IncidentParticipant[]; onAddParticipant: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Participants ({participants.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onAddParticipant}>
            <Plus className="h-3.5 w-3.5" />
            Add Participant
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-secondary)] border-b border-[var(--border-default)]">
                  <th className="w-8 px-3 h-9" />
                  <th className="px-4 h-9 text-left text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Name (Type)
                  </th>
                  <th className="px-4 h-9 text-left text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Role(s)
                  </th>
                  <th className="px-4 h-9 text-left text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 h-9 text-center text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Police
                  </th>
                  <th className="px-4 h-9 text-center text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Medical
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    isExpanded={expanded === p.id}
                    onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParticipantRow({
  participant: p,
  isExpanded,
  onToggle,
}: {
  participant: IncidentParticipant;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-[var(--border-subdued,var(--border-default))] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 h-10">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          )}
        </td>
        <td className="px-4 h-10">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {p.firstName} {p.lastName}
            </span>
            <TypeBadge type={p.personType} id={null} />
          </div>
        </td>
        <td className="px-4 h-10">
          <div className="flex items-center gap-1.5">
            <RoleBadge role={p.primaryRole} />
            {p.secondaryRole && <RoleBadge role={p.secondaryRole} />}
          </div>
        </td>
        <td className="px-4 h-10 text-[13px] text-[var(--text-secondary)]">
          {p.email || p.phone || "—"}
        </td>
        <td className="px-4 h-10 text-center">
          <BooleanIndicator value={p.policeContacted} />
        </td>
        <td className="px-4 h-10 text-center">
          <BooleanIndicator value={p.medicalAttention} />
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-[var(--surface-secondary)]/50">
          <td colSpan={6} className="px-8 py-4">
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {p.description}
                </p>
              </div>
              {p.phone && (
                <div>
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
                    Phone
                  </span>
                  <p className="text-[var(--text-secondary)]">{p.phone}</p>
                </div>
              )}
              {p.email && (
                <div>
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
                    Email
                  </span>
                  <p className="text-[var(--text-secondary)]">{p.email}</p>
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-[var(--border-subdued,var(--border-default))]">
                <Button variant="ghost" size="sm">
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4: MEDIA
   ═══════════════════════════════════════════════════════════════ */

function MediaTab({ onUploadMedia }: { onUploadMedia: () => void }) {
  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Media ({MEDIA.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUploadMedia}>
            <ImageIcon className="h-3.5 w-3.5" />
            Add Photo
          </Button>
          <Button variant="outline" size="sm" onClick={onUploadMedia}>
            <Video className="h-3.5 w-3.5" />
            Add Video
          </Button>
          <Button variant="outline" size="sm" onClick={onUploadMedia}>
            <Upload className="h-3.5 w-3.5" />
            Upload Files
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MEDIA.map((m) => (
          <Card key={m.id} className="overflow-hidden group">
            {/* Thumbnail Placeholder */}
            <div className="aspect-square bg-[var(--surface-secondary)] relative flex items-center justify-center">
              {m.type === "photo" && (
                <ImageIcon className="h-10 w-10 text-[var(--text-tertiary)] opacity-40" />
              )}
              {m.type === "video" && (
                <Video className="h-10 w-10 text-[var(--text-tertiary)] opacity-40" />
              )}
              {m.type === "document" && (
                <File className="h-10 w-10 text-[var(--text-tertiary)] opacity-40" />
              )}

              {/* Badges overlay */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                {m.isPrimary && (
                  <span className="h-5 w-5 rounded-full bg-yellow-500/90 flex items-center justify-center">
                    <Star className="h-3 w-3 text-white" />
                  </span>
                )}
                {m.isProtected && (
                  <span className="h-5 w-5 rounded-full bg-red-500/90 flex items-center justify-center">
                    <Lock className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>

              {/* Type badge */}
              <div className="absolute top-2 right-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white uppercase">
                  {m.type}
                </span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-gray-800" />
                </button>
                <button className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center">
                  <Download className="h-4 w-4 text-gray-800" />
                </button>
                <button className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-gray-800" />
                </button>
              </div>
            </div>

            <CardContent className="p-3">
              <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                {m.title}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
                {m.description}
              </p>
              <div className="flex items-center justify-between mt-2 text-[11px] text-[var(--text-tertiary)]">
                <span>{m.uploadedBy}</span>
                <span>{m.size}</span>
              </div>
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {m.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-secondary)] text-[var(--text-tertiary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5: RELATED INCIDENTS
   ═══════════════════════════════════════════════════════════════ */

function RelatedIncidentsTab({ onLinkIncident }: { onLinkIncident: () => void }) {
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Related Incidents ({RELATED_INCIDENTS.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onLinkIncident}>
            <Link2 className="h-3.5 w-3.5" />
            Link Incident
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Create New
          </Button>
        </div>
      </div>

      {RELATED_INCIDENTS.map((ri) => (
        <Card key={ri.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Link
                    href={`/incidents/${ri.id}`}
                    className="text-[13px] font-semibold text-[var(--action-primary)] hover:underline"
                  >
                    #{ri.incidentNumber}
                  </Link>
                  <StatusBadge status={ri.status} dot />
                  <RiskBadge level={ri.riskLevel} />
                </div>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {ri.type} — {ri.specific}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <RelationshipBadge type={ri.relationship} />
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    Linked by {ri.createdBy} on {ri.createdAt}
                  </span>
                </div>
                {ri.notes && (
                  <p className="text-[12px] text-[var(--text-tertiary)] mt-2 italic">
                    &ldquo;{ri.notes}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Button>
                <Button variant="ghost" size="sm">
                  <X className="h-3.5 w-3.5" />
                  Unlink
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {RELATED_INCIDENTS.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-8 w-8 mx-auto text-[var(--text-tertiary)] opacity-40 mb-3" />
            <p className="text-[13px] text-[var(--text-secondary)]">No related incidents</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
              Link incidents that are connected to this one
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 6: ATTACHED RECORDS
   ═══════════════════════════════════════════════════════════════ */

function AttachedRecordsTab() {
  const sections = [
    {
      title: "Daily Logs",
      icon: <ScrollText className="h-4 w-4" />,
      items: ATTACHED_RECORDS.dailyLogs.map((dl) => ({
        id: dl.id,
        label: dl.number,
        description: dl.title,
        meta: dl.date,
        badge: dl.escalated ? "Escalated" : null,
        href: "/daily-log",
      })),
    },
    {
      title: "Dispatches",
      icon: <Paperclip className="h-4 w-4" />,
      items: ATTACHED_RECORDS.dispatches.map((d) => ({
        id: d.id,
        label: d.number,
        description: `${d.title} — Assigned: ${d.assignedTo}`,
        meta: d.date,
        badge: null,
        href: "/dispatch",
      })),
    },
    {
      title: "Cases",
      icon: <FileText className="h-4 w-4" />,
      items: ATTACHED_RECORDS.cases.map((c) => ({
        id: c.id,
        label: c.number,
        description: c.title,
        meta: `Status: ${c.status.toUpperCase()} — ${c.date}`,
        badge: null,
        href: "/cases",
      })),
    },
    {
      title: "Found Items",
      icon: <Search className="h-4 w-4" />,
      items: [] as { id: string; label: string; description: string; meta: string; badge: string | null; href: string }[],
      emptyAction: "Link Found Item",
    },
    {
      title: "Briefings",
      icon: <FileText className="h-4 w-4" />,
      items: ATTACHED_RECORDS.briefings.map((b) => ({
        id: b.id,
        label: b.number,
        description: `${b.title} — Recipients: ${b.recipients}`,
        meta: b.date,
        badge: null,
        href: "/briefings",
      })),
    },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        Attached Records
      </h3>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-tertiary)]">{section.icon}</span>
              <CardTitle>{section.title}</CardTitle>
              <span className="text-[11px] text-[var(--text-tertiary)] bg-[var(--surface-secondary)] rounded-full px-1.5 py-0.5">
                {section.items.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.items.length > 0 ? (
              section.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2 border-b border-[var(--border-subdued,var(--border-default))] last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={item.href}
                        className="text-[13px] font-medium text-[var(--action-primary)] hover:underline"
                      >
                        {item.label}
                      </Link>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      {item.meta}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center">
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  No {section.title.toLowerCase()} linked
                </p>
                {section.emptyAction && (
                  <Button variant="ghost" size="sm" className="mt-2">
                    <Plus className="h-3.5 w-3.5" />
                    {section.emptyAction}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 7: FORMS
   ═══════════════════════════════════════════════════════════════ */

function FormsTab() {
  const [expandedForm, setExpandedForm] = useState<string | null>(null);

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Supplemental Forms ({FORMS.length})
        </h3>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Form
        </Button>
      </div>

      {FORMS.map((form) => (
        <Card key={form.id}>
          <CardContent className="p-0">
            {/* Form header row */}
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-hover)] transition-colors text-left"
              onClick={() =>
                setExpandedForm(expandedForm === form.id ? null : form.id)
              }
            >
              <div className="flex items-center gap-3">
                {expandedForm === form.id ? (
                  <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                )}
                <div className="flex items-center gap-2">
                  {form.completed ? (
                    <CheckSquare className="h-4 w-4 text-[var(--status-success,#059669)]" />
                  ) : (
                    <ClipboardList className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">
                    {form.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {form.completed ? (
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    Completed {form.completedAt} by {form.completedBy}
                  </span>
                ) : (
                  <span className="text-[11px] text-yellow-600 dark:text-yellow-400 font-medium">
                    Draft — Last saved {form.lastSaved}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    className="h-7 px-2 rounded-md hover:bg-[var(--surface-secondary)] text-[12px] text-[var(--text-secondary)] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {form.completed ? "View" : "Resume"}
                  </button>
                  <button
                    className="h-7 px-2 rounded-md hover:bg-[var(--surface-secondary)] text-[12px] text-[var(--text-secondary)] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </button>

            {/* Expanded form fields */}
            {expandedForm === form.id && (
              <div className="px-5 pb-4 border-t border-[var(--border-default)]">
                <div className="mt-3 space-y-2.5">
                  {form.fields.map((field, idx) => (
                    <div key={idx} className="grid grid-cols-[180px_1fr] gap-2">
                      <span className="text-[12px] font-medium text-[var(--text-tertiary)]">
                        {field.label}
                      </span>
                      <span className="text-[13px] text-[var(--text-primary)]">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border-subdued,var(--border-default))]">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Available forms hint */}
      <div className="p-4 rounded-lg border border-dashed border-[var(--border-default)] text-center">
        <p className="text-[12px] text-[var(--text-tertiary)]">
          Available: Accident Report, Property Damage, Use of Force, Evidence Log, Hazard Report, Environmental Report, Vehicle Accident Report, + Custom Forms
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 8: SAVINGS & LOSSES
   ═══════════════════════════════════════════════════════════════ */

function SavingsLossesTab({ financials, totalLosses, totalSavings, onAddEntry }: { financials: IncidentFinancial[]; totalLosses: number; totalSavings: number; onAddEntry: () => void }) {
  const netImpact = totalLosses - totalSavings;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Savings & Losses
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            Download for Insurance
          </Button>
          <Button variant="outline" size="sm" onClick={onAddEntry}>
            <Plus className="h-3.5 w-3.5" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Total Losses
            </p>
            <p className="text-xl font-bold text-red-500 mt-1">
              ${totalLosses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Total Savings
            </p>
            <p className="text-xl font-bold text-green-500 mt-1">
              ${totalSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Net Impact
            </p>
            <p className={`text-xl font-bold mt-1 ${netImpact > 0 ? "text-red-500" : "text-green-500"}`}>
              {netImpact > 0 ? "-" : "+"}${Math.abs(netImpact).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-secondary)] border-b border-[var(--border-default)]">
                  <th className="px-4 h-9 text-left text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 h-9 text-right text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 h-9 text-center text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 h-9 text-left text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 h-9 text-left text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-4 h-9 w-10" />
                </tr>
              </thead>
              <tbody>
                {financials.map((f) => {
                  const isSaving = f.entryType === "saving";
                  return (
                    <tr
                      key={f.id}
                      className="border-b border-[var(--border-subdued,var(--border-default))] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="px-4 h-10 text-[13px] font-medium text-[var(--text-primary)]">
                        {f.entryType}
                      </td>
                      <td className={`px-4 h-10 text-[13px] font-semibold text-right ${isSaving ? "text-green-500" : "text-red-500"}`}>
                        {isSaving ? "+" : "-"}${f.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 h-10 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isSaving
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isSaving ? "Saving" : "Loss"}
                        </span>
                      </td>
                      <td className="px-4 h-10 text-[13px] text-[var(--text-secondary)] max-w-[250px] truncate">
                        {f.description || "—"}
                      </td>
                      <td className="px-4 h-10 text-[12px] text-[var(--text-tertiary)]">
                        {f.createdBy || "—"}
                      </td>
                      <td className="px-4 h-10">
                        <button className="h-7 w-7 rounded-md hover:bg-[var(--surface-secondary)] flex items-center justify-center transition-colors">
                          <MoreHorizontal className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--surface-secondary)] border-t border-[var(--border-default)]">
                  <td className="px-4 h-10 text-[12px] font-semibold text-[var(--text-primary)]">
                    TOTALS
                  </td>
                  <td className="px-4 h-10 text-[13px] font-bold text-right text-[var(--text-primary)]">
                    -${netImpact.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={4} className="px-4 h-10 text-[12px] text-[var(--text-tertiary)]">
                    Losses: ${totalLosses.toLocaleString()} · Savings: ${totalSavings.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 9: SHARING
   ═══════════════════════════════════════════════════════════════ */

function SharingTab({ onShare }: { onShare: () => void }) {
  const active = SHARES.filter((s) => !s.isExpired);
  const expired = SHARES.filter((s) => s.isExpired);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Sharing & Permissions
        </h3>
        <Button variant="outline" size="sm" onClick={onShare}>
          <Share2 className="h-3.5 w-3.5" />
          Share Incident
        </Button>
      </div>

      {/* Active Shares */}
      <div className="space-y-3">
        <h4 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Active Shares ({active.length})
        </h4>
        {active.map((share) => (
          <Card key={share.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                    {share.sharedWithType === "role" ? (
                      <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
                    ) : (
                      <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                        {share.sharedWith
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">
                        {share.sharedWith}
                      </span>
                      {share.sharedWithType === "role" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          Role
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <PermissionBadge level={share.permission} />
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        Shared {share.sharedAt}
                      </span>
                    </div>
                    {share.instructions && (
                      <p className="text-[12px] text-[var(--text-secondary)] mt-2 italic">
                        &ldquo;{share.instructions}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-tertiary)]">
                      <span>
                        Expires:{" "}
                        {share.expireOnClose
                          ? "On incident close"
                          : share.expiresAt ?? "Never"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm">
                    Revoke
                  </Button>
                  {share.expiresAt && (
                    <Button variant="ghost" size="sm">
                      Extend
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expired Shares */}
      {expired.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Expired Shares ({expired.length})
          </h4>
          {expired.map((share) => (
            <Card key={share.id} className="opacity-60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center">
                      <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                        {share.sharedWith
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[13px] text-[var(--text-secondary)]">
                        {share.sharedWith}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <PermissionBadge level={share.permission} />
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          Expired {share.expiresAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Re-Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 10: DOCUMENT CONTROL
   ═══════════════════════════════════════════════════════════════ */

function DocumentControlTab({
  onTransferOwnership,
  onDeleteIncident,
  onLockIncident,
  onRiskAssessment,
}: {
  onTransferOwnership: () => void;
  onDeleteIncident: () => void;
  onLockIncident: () => void;
  onRiskAssessment: () => void;
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Document Control
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRiskAssessment}>
            <Shield className="h-3.5 w-3.5" />
            Risk Assessment
          </Button>
          <Button variant="outline" size="sm" onClick={onLockIncident}>
            <Lock className="h-3.5 w-3.5" />
            {INCIDENT.isLocked ? "Unlock" : "Lock"} Incident
          </Button>
          <Button variant="destructive" size="sm" onClick={onDeleteIncident}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Ownership */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[13px] font-semibold text-[var(--text-secondary)]">
                SC
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {INCIDENT.owner}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Document Owner · Created {INCIDENT.createdAt}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onTransferOwnership}>
              Transfer Ownership
            </Button>
          </div>
          <p className="text-[12px] text-[var(--text-tertiary)] bg-[var(--surface-secondary)] rounded-lg px-3 py-2">
            The document owner has full control over this incident including editing, sharing, deletion, and archive permissions.
          </p>
        </CardContent>
      </Card>

      {/* Exclusive Access */}
      <Card>
        <CardHeader>
          <CardTitle>Exclusive Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[var(--text-primary)]">Exclusive Mode</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                When enabled, only listed users/roles can view this incident
              </p>
            </div>
            <ToggleSwitch enabled={INCIDENT.isExclusive} />
          </div>

          {INCIDENT.isExclusive && (
            <div className="space-y-2 pl-4 border-l-2 border-[var(--border-default)]">
              <p className="text-[12px] font-medium text-[var(--text-secondary)]">
                Authorized access:
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--text-primary)]">
                  {INCIDENT.owner} (Owner — implicit)
                </span>
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Add User/Role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Access */}
      <Card>
        <CardHeader>
          <CardTitle>Global Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] text-[var(--text-primary)]">Global Visibility</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                  Admin Only
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                When enabled, visible across all organizations
              </p>
            </div>
            <ToggleSwitch enabled={INCIDENT.isGlobal} />
          </div>

          {INCIDENT.isGlobal && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-yellow-700 dark:text-yellow-300">
                  This incident is visible to administrators across all organizations in the network.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive */}
      <Card>
        <CardHeader>
          <CardTitle>Archive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Current Status" value={<StatusBadge status={INCIDENT.status} dot />} />
            <FieldRow label="Is Archived" value="No" />
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface-secondary)]">
            <p className="text-[12px] text-[var(--text-tertiary)]">
              Archiving is <strong>irreversible</strong>. The incident becomes permanently read-only for all users including the owner. Available only for CLOSED incidents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Archive className="h-3.5 w-3.5" />
              Archive Now
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Calendar className="h-3.5 w-3.5" />
              Schedule Archive
            </Button>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Incident must be CLOSED first
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 11: DOCUMENT LOG
   ═══════════════════════════════════════════════════════════════ */

function DocumentLogTab() {
  const iconMap: Record<string, React.ReactNode> = {
    status: <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />,
    narrative: <FileText className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
    media: <ImageIcon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
    form: <ClipboardList className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
    participant: <UserPlus className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
    share: <Share2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
    checklist: <CheckSquare className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
    link: <Link2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
    create: <Plus className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />,
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Document Log ({DOCUMENT_LOG.length} entries)
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[29px] top-4 bottom-4 w-px bg-[var(--border-default)]" />

            <div className="divide-y divide-[var(--border-subdued,var(--border-default))]">
              {DOCUMENT_LOG.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {/* Icon */}
                  <div className="relative z-10 mt-1 h-6 w-6 rounded-full bg-[var(--surface-primary)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                    {iconMap[entry.icon]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">
                          {entry.action}
                        </span>
                        <span className="text-[13px] text-[var(--text-secondary)] ml-1.5">
                          — {entry.detail}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap shrink-0">
                        {entry.timestamp}
                      </span>
                    </div>

                    <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                      by {entry.user}
                    </p>

                    {entry.reason && (
                      <p className="text-[12px] text-[var(--text-secondary)] mt-1 italic">
                        Reason: &ldquo;{entry.reason}&rdquo;
                      </p>
                    )}

                    {entry.auto && (
                      <p className="text-[11px] text-[var(--action-primary)] mt-1">
                        ⤷ {entry.auto}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED UTILITY COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--text-primary)] leading-snug">{value}</dd>
    </div>
  );
}

function LinkedRecordRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="text-[var(--text-tertiary)]">{label}:</span>
      <Link
        href={href}
        className="text-[var(--action-primary)] hover:underline font-medium"
      >
        {value}
      </Link>
    </div>
  );
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Victim: { bg: "var(--status-critical-surface, #fef2f2)", text: "var(--status-critical, #dc2626)" },
  Witness: { bg: "var(--status-info-surface, #eff6ff)", text: "var(--status-info, #2563eb)" },
  Suspect: { bg: "var(--status-warning-surface, #fffbeb)", text: "var(--status-warning, #d97706)" },
  "Reporting Party": { bg: "var(--status-attention-surface, #fefce8)", text: "var(--status-attention, #ca8a04)" },
  Respondent: { bg: "var(--status-success-surface, #ecfdf5)", text: "var(--status-success, #059669)" },
  Complainant: { bg: "var(--status-info-surface, #eff6ff)", text: "var(--status-info, #2563eb)" },
  Offender: { bg: "var(--status-critical-surface, #fef2f2)", text: "var(--status-critical, #dc2626)" },
};

function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role] ?? {
    bg: "var(--surface-secondary)",
    text: "var(--text-secondary)",
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 text-[11px] font-medium leading-5 whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {role}
    </span>
  );
}

function TypeBadge({ type, id }: { type: string; id: string | null }) {
  return (
    <span className="inline-flex items-center rounded px-1 text-[10px] font-medium bg-[var(--surface-secondary)] text-[var(--text-tertiary)]">
      {type}
      {id && <span className="ml-0.5 opacity-70">{id}</span>}
    </span>
  );
}

function BooleanIndicator({ value }: { value: boolean }) {
  if (value) {
    return (
      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500/10">
        <CheckSquare className="h-3 w-3 text-green-500" />
      </span>
    );
  }
  return (
    <span className="text-[11px] text-[var(--text-tertiary)]">—</span>
  );
}

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" },
  high: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" },
  low: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  informational: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400" },
};

function RiskBadge({ level }: { level: string }) {
  const colors = RISK_COLORS[level] ?? RISK_COLORS.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${colors.bg} ${colors.text}`}
    >
      {level}
    </span>
  );
}

const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string }> = {
  parent: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  child: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  related: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  duplicate: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" },
};

function RelationshipBadge({ type }: { type: string }) {
  const colors = RELATIONSHIP_COLORS[type] ?? RELATIONSHIP_COLORS.related;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${colors.bg} ${colors.text}`}
    >
      {type}
    </span>
  );
}

function PermissionBadge({ level }: { level: string }) {
  const labels: Record<string, { label: string; bg: string; text: string }> = {
    view: { label: "View", bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400" },
    contributor: { label: "Contributor", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    co_author: { label: "Co-Author", bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  };
  const p = labels[level] ?? labels.view;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${p.bg} ${p.text}`}>
      {p.label}
    </span>
  );
}

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <button
      className={`relative w-10 h-[22px] rounded-full transition-colors ${
        enabled ? "bg-[var(--action-primary)]" : "bg-[var(--surface-tertiary)]"
      }`}
    >
      <span
        className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "left-[20px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}
