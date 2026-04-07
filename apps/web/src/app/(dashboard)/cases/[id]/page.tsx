"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Clock,
  FileText,
  Users,
  Shield,
  Package,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Calendar,
  DollarSign,
  Eye,
  Plus,
  Camera,
  Video,
  Mic,
  HardDrive,
  Link2,
  ListChecks,
  StickyNote,
  BarChart3,
  History,
  MapPin,
  User,
  Briefcase,
  Flag,
  Timer,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { useToast } from "@/components/ui/Toast";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import dynamic from "next/dynamic";

const AddResourceModal = dynamic(() => import("@/components/modals/cases/AddResourceModal").then(m => ({ default: m.AddResourceModal })), { ssr: false });
const AddEvidenceModal = dynamic(() => import("@/components/modals/cases/AddEvidenceModal").then(m => ({ default: m.AddEvidenceModal })), { ssr: false });
const AddTaskModal = dynamic(() => import("@/components/modals/cases/AddTaskModal").then(m => ({ default: m.AddTaskModal })), { ssr: false });
const CaseStatusChangeModal = dynamic(() => import("@/components/modals/cases/CaseStatusChangeModal").then(m => ({ default: m.CaseStatusChangeModal })), { ssr: false });
const AddCaseNarrativeModal = dynamic(() => import("@/components/modals/cases/AddCaseNarrativeModal").then(m => ({ default: m.AddCaseNarrativeModal })), { ssr: false });
const ChainOfCustodyModal = dynamic(() => import("@/components/modals/cases/ChainOfCustodyModal").then(m => ({ default: m.ChainOfCustodyModal })), { ssr: false });
const LinkRecordModal = dynamic(() => import("@/components/modals/cases/LinkRecordModal").then(m => ({ default: m.LinkRecordModal })), { ssr: false });
const EscalateCaseModal = dynamic(() => import("@/components/modals/cases/EscalateCaseModal").then(m => ({ default: m.EscalateCaseModal })), { ssr: false });
const CloseCaseModal = dynamic(() => import("@/components/modals/cases/CloseCaseModal").then(m => ({ default: m.CloseCaseModal })), { ssr: false });
const DeleteCaseModal = dynamic(() => import("@/components/modals/cases/DeleteCaseModal").then(m => ({ default: m.DeleteCaseModal })), { ssr: false });
const AdvanceStageModal = dynamic(() => import("@/components/modals/cases/AdvanceStageModal").then(m => ({ default: m.AdvanceStageModal })), { ssr: false });
const AddCaseFinancialModal = dynamic(() => import("@/components/modals/cases/AddCaseFinancialModal").then(m => ({ default: m.AddCaseFinancialModal })), { ssr: false });
const TransferEvidenceWizard = dynamic(() => import("@/components/modals/cases/TransferEvidenceWizard").then(m => ({ default: m.TransferEvidenceWizard })), { ssr: false });
const OutcomeDocumentationModal = dynamic(() => import("@/components/modals/cases/OutcomeDocumentationModal").then(m => ({ default: m.OutcomeDocumentationModal })), { ssr: false });
const CaseClosureWizard = dynamic(() => import("@/components/modals/cases/CaseClosureWizard").then(m => ({ default: m.CaseClosureWizard })), { ssr: false });
const CreateBriefingFromCaseModal = dynamic(() => import("@/components/modals/workflows/CreateBriefingFromCaseModal").then(m => ({ default: m.CreateBriefingFromCaseModal })), { ssr: false });
const CreateWorkOrderFromCaseModal = dynamic(() => import("@/components/modals/workflows/CreateWorkOrderFromCaseModal").then(m => ({ default: m.CreateWorkOrderFromCaseModal })), { ssr: false });

import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchCaseById, updateCaseStatus, deleteCase, type CaseDetail } from "@/lib/queries/cases";
import { createBriefing } from "@/lib/queries/briefings";
import { createWorkOrder } from "@/lib/queries/work-orders";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/time";

/* ================================================================
   MOCK DATA (sub-resources — no dedicated DB tables yet)
   ================================================================ */

const STAGES = [
  { key: "assessment", label: "Assessment", number: 1 },
  { key: "evidence_collection", label: "Evidence Collection", number: 2 },
  { key: "detailed_investigation", label: "Detailed Investigation", number: 3 },
  { key: "outcome", label: "Outcome", number: 4 },
  { key: "cost_analysis", label: "Cost Analysis", number: 5 },
  { key: "disposition", label: "Disposition", number: 6 },
  { key: "resulting_actions", label: "Resulting Actions", number: 7 },
] as const;

const CASE_DATA = {
  id: "CASE-2026-000012",
  title: "Investigation: Heroin Distribution at Campgrounds",
  stage: "detailed_investigation",
  status: "open",
  priority: "high" as const,
  daysOpen: 45,
  createdBy: "Officer Sarah Chen",
  caseManager: "Detective Sarah Lee",
  createdAt: "Feb 19, 2026 at 10:22 AM",
  updatedAt: "Apr 4, 2026 at 3:48 PM",
  location: "Campground Section D, Lots 42-48",
  category: "Narcotics Distribution",
  description:
    "Ongoing investigation into suspected heroin distribution activity centered around Campground Section D. Multiple tips from park visitors and undercover observations indicate a distribution network operating from lots 42 through 48. Suspected individuals have been identified through surveillance and informant reports. Evidence collection is underway, including physical evidence from controlled buys, digital communications intercepts, and photographic surveillance documentation.",
  evidenceCount: 23,
  taskCount: 18,
  tasksCompleted: 11,
  resourceCount: 6,
  narrativeCount: 14,
};

const RESOURCES = [
  { id: 1, name: "Det. Sarah Lee", alias: "Lead-1", role: "case_manager", rate: 85, hours: 124, status: "active" },
  { id: 2, name: "Off. James Park", alias: "UC-7", role: "investigator", rate: 65, hours: 88, status: "active" },
  { id: 3, name: "Off. Maria Santos", alias: "UC-12", role: "investigator", rate: 65, hours: 72, status: "active" },
  { id: 4, name: "Tech. Ryan Nguyen", alias: null, role: "investigator", rate: 55, hours: 36, status: "active" },
  { id: 5, name: "Lt. David Kim", alias: null, role: "view_only", rate: 95, hours: 8, status: "active" },
  { id: 6, name: "Off. Emily Torres", alias: "UC-3", role: "investigator", rate: 65, hours: 44, status: "inactive" },
];

const RELATED_RECORDS = [
  { id: "INC-2026-000089", type: "incident", title: "Suspicious activity near Lot 44", date: "Feb 18, 2026", status: "closed" },
  { id: "INC-2026-000102", type: "incident", title: "Drug paraphernalia found at Lot 42", date: "Feb 25, 2026", status: "closed" },
  { id: "INC-2026-000134", type: "incident", title: "Patron overdose near Section D restrooms", date: "Mar 8, 2026", status: "closed" },
  { id: "DSP-2026-000245", type: "dispatch", title: "Welfare check Lot 46 occupant", date: "Mar 3, 2026", status: "completed" },
  { id: "DSP-2026-000271", type: "dispatch", title: "Backup request for controlled buy", date: "Mar 15, 2026", status: "completed" },
  { id: "DL-2026-000412", type: "daily_log", title: "Surveillance notes - Section D overnight", date: "Mar 20, 2026", status: "closed" },
  { id: "DL-2026-000438", type: "daily_log", title: "Informant debrief summary", date: "Mar 28, 2026", status: "closed" },
];

const EVIDENCE = [
  { id: "EV-001", description: "Ziplock bag with white powder residue", type: "physical", storageLocation: "Evidence Locker B-14", custodian: "Off. Park", collectedDate: "Feb 25, 2026", daysHeld: 39, chainOfCustody: 3 },
  { id: "EV-002", description: "Cell phone - Samsung Galaxy S25", type: "digital", storageLocation: "Digital Lab Safe 2", custodian: "Tech. Nguyen", collectedDate: "Mar 1, 2026", daysHeld: 35, chainOfCustody: 2 },
  { id: "EV-003", description: "Surveillance photos - Lot 44 (32 images)", type: "photo", storageLocation: "Digital Evidence Server", custodian: "Off. Santos", collectedDate: "Mar 5, 2026", daysHeld: 31, chainOfCustody: 1 },
  { id: "EV-004", description: "Body cam footage - controlled buy #1", type: "video", storageLocation: "Digital Evidence Server", custodian: "Off. Park", collectedDate: "Mar 10, 2026", daysHeld: 26, chainOfCustody: 2 },
  { id: "EV-005", description: "Recorded informant statement", type: "audio", storageLocation: "Digital Evidence Server", custodian: "Det. Lee", collectedDate: "Mar 12, 2026", daysHeld: 24, chainOfCustody: 1 },
  { id: "EV-006", description: "Search warrant - Lot 46", type: "document", storageLocation: "Case File Cabinet 3", custodian: "Det. Lee", collectedDate: "Mar 14, 2026", daysHeld: 22, chainOfCustody: 2 },
  { id: "EV-007", description: "Scale with residue", type: "physical", storageLocation: "Evidence Locker B-14", custodian: "Off. Park", collectedDate: "Mar 15, 2026", daysHeld: 21, chainOfCustody: 4 },
  { id: "EV-008", description: "Cash bundle ($2,340)", type: "physical", storageLocation: "Evidence Safe A-1", custodian: "Det. Lee", collectedDate: "Mar 15, 2026", daysHeld: 21, chainOfCustody: 3 },
  { id: "EV-009", description: "Text message extraction report", type: "document", storageLocation: "Digital Lab Safe 2", custodian: "Tech. Nguyen", collectedDate: "Mar 18, 2026", daysHeld: 18, chainOfCustody: 1 },
  { id: "EV-010", description: "Drone aerial footage - Section D", type: "video", storageLocation: "Digital Evidence Server", custodian: "Off. Santos", collectedDate: "Mar 22, 2026", daysHeld: 14, chainOfCustody: 1 },
];

const TASKS = [
  {
    id: "T-001", title: "Initial assessment and case opening", assignedTo: "Det. Lee", dueDate: "Feb 20, 2026",
    percentComplete: 100, critical: false, hoursLogged: 4, subtasks: [
      { title: "Review incident reports", complete: true },
      { title: "Assign case number", complete: true },
      { title: "Initial briefing with team", complete: true },
    ],
  },
  {
    id: "T-002", title: "Establish surveillance on Section D", assignedTo: "Off. Santos", dueDate: "Mar 1, 2026",
    percentComplete: 100, critical: true, hoursLogged: 48, subtasks: [
      { title: "Deploy covert cameras", complete: true },
      { title: "Schedule rotation coverage", complete: true },
      { title: "Document vehicle traffic patterns", complete: true },
    ],
  },
  {
    id: "T-003", title: "Controlled buy operation #1", assignedTo: "Off. Park", dueDate: "Mar 10, 2026",
    percentComplete: 100, critical: true, hoursLogged: 16, subtasks: [
      { title: "Pre-operation briefing", complete: true },
      { title: "Execute controlled buy", complete: true },
      { title: "Evidence processing", complete: true },
      { title: "Post-operation debrief", complete: true },
    ],
  },
  {
    id: "T-004", title: "Digital forensics - seized phone", assignedTo: "Tech. Nguyen", dueDate: "Mar 20, 2026",
    percentComplete: 100, critical: false, hoursLogged: 24, subtasks: [
      { title: "Image device", complete: true },
      { title: "Extract messages and contacts", complete: true },
      { title: "Analyze call records", complete: true },
      { title: "Generate forensics report", complete: true },
    ],
  },
  {
    id: "T-005", title: "Informant management and debriefs", assignedTo: "Det. Lee", dueDate: "Apr 1, 2026",
    percentComplete: 75, critical: true, hoursLogged: 32, subtasks: [
      { title: "Initial informant interview", complete: true },
      { title: "Verify informant claims", complete: true },
      { title: "Second debrief session", complete: true },
      { title: "Final corroboration report", complete: false },
    ],
  },
  {
    id: "T-006", title: "Obtain and execute search warrant", assignedTo: "Det. Lee", dueDate: "Mar 18, 2026",
    percentComplete: 100, critical: true, hoursLogged: 20, subtasks: [
      { title: "Draft warrant affidavit", complete: true },
      { title: "Submit to judge", complete: true },
      { title: "Execute search", complete: true },
    ],
  },
  {
    id: "T-007", title: "Controlled buy operation #2", assignedTo: "Off. Park", dueDate: "Apr 5, 2026",
    percentComplete: 60, critical: true, hoursLogged: 8, subtasks: [
      { title: "Pre-operation briefing", complete: true },
      { title: "Execute controlled buy", complete: true },
      { title: "Evidence processing", complete: false },
      { title: "Post-operation debrief", complete: false },
      { title: "Comparative analysis with buy #1", complete: false },
    ],
  },
  {
    id: "T-008", title: "Compile evidence summary report", assignedTo: "Det. Lee", dueDate: "Apr 15, 2026",
    percentComplete: 20, critical: false, hoursLogged: 6, subtasks: [
      { title: "Organize all physical evidence", complete: true },
      { title: "Compile digital evidence index", complete: false },
      { title: "Write narrative summary", complete: false },
      { title: "Legal review", complete: false },
    ],
  },
  {
    id: "T-009", title: "Interview suspect associates", assignedTo: "Off. Santos", dueDate: "Apr 10, 2026",
    percentComplete: 33, critical: false, hoursLogged: 12, subtasks: [
      { title: "Identify associates from surveillance", complete: true },
      { title: "Conduct interviews", complete: false },
      { title: "Cross-reference statements", complete: false },
    ],
  },
  {
    id: "T-010", title: "Financial records analysis", assignedTo: "Tech. Nguyen", dueDate: "Apr 12, 2026",
    percentComplete: 0, critical: false, hoursLogged: 0, subtasks: [
      { title: "Obtain financial records", complete: false },
      { title: "Trace cash flow patterns", complete: false },
    ],
  },
];

const NARRATIVES = [
  { id: "N-001", author: "Det. Lee", date: "Feb 19, 2026 10:45 AM", highlight: "yellow", title: "Case Opening Notes", content: "Case opened based on three separate incident reports filed in a 7-day period, all involving narcotics activity in Campground Section D. Pattern analysis suggests organized distribution rather than isolated incidents." },
  { id: "N-002", author: "Off. Santos", date: "Mar 2, 2026 6:15 PM", highlight: "blue", title: "Surveillance Day 1 Observations", content: "Observed consistent foot traffic to Lot 44 between 1800-2200 hours. Approximately 12-15 unique visitors, most staying less than 5 minutes. One individual appears to be the primary point of contact. Vehicle with plate [REDACTED] seen multiple times." },
  { id: "N-003", author: "Off. Park", date: "Mar 10, 2026 9:30 PM", highlight: "green", title: "Controlled Buy #1 Debrief", content: "Controlled buy successfully executed at 2015 hours. Subject sold approximately 0.5g of suspected heroin for $80. Transaction recorded on body camera. Subject identified as [REDACTED], WM, approx 35 years old. Buy money serial numbers recorded." },
  { id: "N-004", author: "Det. Lee", date: "Mar 12, 2026 2:00 PM", highlight: "pink", title: "Informant Reliability Assessment", content: "CI has provided 3 actionable tips in the past 6 months, 2 of which resulted in successful operations. Reliability rating: B (usually reliable). Information provided regarding the distribution network has been partially corroborated through surveillance." },
  { id: "N-005", author: "Tech. Nguyen", date: "Mar 18, 2026 11:00 AM", highlight: "blue", title: "Digital Forensics Preliminary", content: "Initial analysis of seized Samsung device reveals 47 text conversations potentially related to drug transactions. Common code words identified: 'camping gear' (heroin), 'tent stakes' (needles), 'firewood' (cash). Contact list cross-referenced with known associates." },
  { id: "N-006", author: "Off. Santos", date: "Mar 22, 2026 4:30 PM", highlight: "yellow", title: "Aerial Surveillance Summary", content: "Drone footage captured over 3 hours reveals consistent foot traffic patterns matching ground surveillance. Identified secondary staging area at Lot 47 not previously known. Footage archived as EV-010." },
  { id: "N-007", author: "Det. Lee", date: "Mar 28, 2026 10:15 AM", highlight: "green", title: "Network Mapping Update", content: "Based on combined intelligence from surveillance, digital forensics, and informant debriefs, we have identified 4 primary suspects and 8-10 peripheral associates. Distribution appears to follow a hub-and-spoke model with Lot 44 as the central node." },
  { id: "N-008", author: "Off. Park", date: "Apr 3, 2026 8:45 PM", highlight: "blue", title: "Controlled Buy #2 Planning", content: "Pre-operation planning complete for second controlled buy. Target: secondary distributor at Lot 47. Buy amount: $160 for 1g. Backup team positioned per operational plan. Equipment check completed." },
];

const FINANCIAL = {
  ale: 12500,
  incidentalCosts: 3420,
  timeCosts: 24180,
  totalSavings: 0,
  totalLosses: 2340,
  entries: [
    { id: "FIN-001", date: "Feb 25, 2026", category: "Buy Money", description: "Controlled buy #1 - buy money", amount: 80, type: "expense" as const },
    { id: "FIN-002", date: "Mar 1, 2026", category: "Equipment", description: "Covert camera rental (2 units x 30 days)", amount: 1800, type: "expense" as const },
    { id: "FIN-003", date: "Mar 5, 2026", category: "Equipment", description: "Drone operation - aerial surveillance", amount: 450, type: "expense" as const },
    { id: "FIN-004", date: "Mar 10, 2026", category: "Overtime", description: "Off. Park - controlled buy operation OT", amount: 520, type: "expense" as const },
    { id: "FIN-005", date: "Mar 15, 2026", category: "Evidence", description: "Evidence storage and processing fees", amount: 230, type: "expense" as const },
    { id: "FIN-006", date: "Mar 15, 2026", category: "Seizure", description: "Cash seizure from search warrant", amount: -2340, type: "recovery" as const },
    { id: "FIN-007", date: "Mar 18, 2026", category: "Lab", description: "Digital forensics lab time", amount: 680, type: "expense" as const },
    { id: "FIN-008", date: "Mar 22, 2026", category: "Equipment", description: "Drone rental - additional surveillance", amount: 200, type: "expense" as const },
    { id: "FIN-009", date: "Apr 3, 2026", category: "Buy Money", description: "Controlled buy #2 - buy money", amount: 160, type: "expense" as const },
    { id: "FIN-010", date: "Apr 4, 2026", category: "Overtime", description: "Off. Santos - interview OT", amount: 340, type: "expense" as const },
  ],
};

const OUTCOME_DATA = {
  outcomeType: null as string | null,
  classification: "Narcotics - Distribution (Felony)",
  formalNotes: "Investigation ongoing. Sufficient evidence gathered to support probable cause for primary suspect. Awaiting completion of second controlled buy and financial analysis before proceeding to disposition stage.",
  findings: [
    "Identified primary distribution point at Campground Section D, Lot 44",
    "Confirmed heroin distribution through controlled buy with recorded evidence",
    "Digital forensics revealed communication network involving 4 primary suspects",
    "Secondary distribution point discovered at Lot 47 via aerial surveillance",
    "Informant testimony partially corroborated through independent surveillance",
  ],
};

const AUDIT_LOG = [
  { id: 1, action: "Case Created", user: "Off. Sarah Chen", timestamp: "Feb 19, 2026 10:22 AM", details: "Case opened from incident reports INC-2026-000089, INC-2026-000102" },
  { id: 2, action: "Resource Assigned", user: "Det. Sarah Lee", timestamp: "Feb 19, 2026 10:35 AM", details: "Assigned as Case Manager" },
  { id: 3, action: "Resource Assigned", user: "Det. Sarah Lee", timestamp: "Feb 19, 2026 11:00 AM", details: "Off. James Park added as Investigator (alias: UC-7)" },
  { id: 4, action: "Resource Assigned", user: "Det. Sarah Lee", timestamp: "Feb 19, 2026 11:05 AM", details: "Off. Maria Santos added as Investigator (alias: UC-12)" },
  { id: 5, action: "Stage Advanced", user: "Det. Sarah Lee", timestamp: "Feb 22, 2026 3:15 PM", details: "Stage: Assessment -> Evidence Collection" },
  { id: 6, action: "Evidence Added", user: "Off. James Park", timestamp: "Feb 25, 2026 4:30 PM", details: "EV-001: Physical evidence logged" },
  { id: 7, action: "Related Record Linked", user: "Det. Sarah Lee", timestamp: "Feb 25, 2026 5:00 PM", details: "Linked INC-2026-000102" },
  { id: 8, action: "Resource Assigned", user: "Det. Sarah Lee", timestamp: "Mar 1, 2026 9:00 AM", details: "Tech. Ryan Nguyen added as Investigator" },
  { id: 9, action: "Evidence Added", user: "Tech. Nguyen", timestamp: "Mar 1, 2026 2:00 PM", details: "EV-002: Digital evidence (phone) logged" },
  { id: 10, action: "Stage Advanced", user: "Det. Sarah Lee", timestamp: "Mar 5, 2026 10:00 AM", details: "Stage: Evidence Collection -> Detailed Investigation" },
  { id: 11, action: "Task Completed", user: "Off. James Park", timestamp: "Mar 10, 2026 10:00 PM", details: "Controlled buy operation #1 completed" },
  { id: 12, action: "Evidence Added", user: "Off. James Park", timestamp: "Mar 15, 2026 6:00 PM", details: "EV-007, EV-008: Search warrant evidence logged" },
  { id: 13, action: "Narrative Added", user: "Det. Sarah Lee", timestamp: "Mar 28, 2026 10:20 AM", details: "Network mapping update narrative added" },
  { id: 14, action: "Resource Deactivated", user: "Det. Sarah Lee", timestamp: "Apr 1, 2026 9:00 AM", details: "Off. Emily Torres set to inactive" },
  { id: 15, action: "Viewed", user: "Lt. David Kim", timestamp: "Apr 4, 2026 3:48 PM", details: "Supervisory review" },
];

/* ================================================================
   TAB DEFINITIONS
   ================================================================ */

const TAB_LIST = [
  { id: "overview", label: "Overview" },
  { id: "resources", label: "Resources", count: RESOURCES.length },
  { id: "related", label: "Related Records", count: RELATED_RECORDS.length },
  { id: "evidence", label: "Evidence", count: EVIDENCE.length },
  { id: "tasks", label: "Tasks", count: TASKS.length },
  { id: "narratives", label: "Narratives", count: NARRATIVES.length },
  { id: "financial", label: "Financial" },
  { id: "outcome", label: "Outcome" },
  { id: "audit", label: "Audit Log", count: AUDIT_LOG.length },
];

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("overview");

  // Modal states
  const [addResourceModal, setAddResourceModal] = useState(false);
  const [addEvidenceModal, setAddEvidenceModal] = useState(false);
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState(false);
  const [addNarrativeModal, setAddNarrativeModal] = useState(false);
  const [chainOfCustodyModal, setChainOfCustodyModal] = useState(false);
  const [linkRecordModal, setLinkRecordModal] = useState(false);
  const [escalateCaseModal, setEscalateCaseModal] = useState(false);
  const [closeCaseModal, setCloseCaseModal] = useState(false);
  const [deleteCaseModal, setDeleteCaseModal] = useState(false);
  const [advanceStageModal, setAdvanceStageModal] = useState(false);
  const [addFinancialModal, setAddFinancialModal] = useState(false);
  const [transferEvidenceModal, setTransferEvidenceModal] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState(false);
  const [closureWizardModal, setClosureWizardModal] = useState(false);
  const [createBriefingModal, setCreateBriefingModal] = useState(false);
  const [createWorkOrderModal, setCreateWorkOrderModal] = useState(false);

  // ── Real data fetch ──
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCaseById(id);
      setCaseData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={24} className="text-[var(--status-critical)]" />
        <p className="text-[13px] text-[var(--text-tertiary)]">{error || "Case not found"}</p>
        <Link href="/cases"><Button variant="outline" size="sm">Back to Cases</Button></Link>
      </div>
    );
  }

  // Map real DB data → template shape (sub-resource counts stay mock)
  const c = {
    id: caseData.recordNumber,
    title: caseData.caseType,
    stage: "assessment" as const,
    status: caseData.status,
    priority: (caseData.escalationLevel || "medium") as "critical" | "high" | "medium" | "low",
    daysOpen: Math.floor((Date.now() - new Date(caseData.createdAt).getTime()) / 86400000),
    createdBy: caseData.creator?.fullName || "Unknown",
    caseManager: caseData.leadInvestigator?.fullName || "Unassigned",
    createdAt: formatDateTime(caseData.createdAt),
    updatedAt: formatDateTime(caseData.updatedAt),
    location: "—",
    category: caseData.caseType,
    description: caseData.synopsis || "No synopsis provided",
    evidenceCount: EVIDENCE.length,
    taskCount: TASKS.length,
    tasksCompleted: TASKS.filter((t) => t.percentComplete === 100).length,
    resourceCount: RESOURCES.length,
    narrativeCount: NARRATIVES.length,
  };
  const currentStageIndex = STAGES.findIndex((s) => s.key === c.stage);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cases">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <div>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-0.5">Case Management</p>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {c.id}
              </h1>
              <StatusBadge status={c.status} dot />
              <PriorityBadge priority={c.priority} />
              <Badge tone="info">{STAGES[currentStageIndex]?.label}</Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)] max-w-2xl truncate">
              {c.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="md">
            <Printer size={14} />
            Print
          </Button>
          <Button variant="outline" size="md" onClick={() => setStatusChangeModal(true)}>
            <Edit size={14} />
            Edit
          </Button>
          <Button variant="outline" size="md" onClick={() => setCreateBriefingModal(true)}>
            <FileText size={14} />
            Create Briefing
          </Button>
          <Button variant="outline" size="md" onClick={() => setCreateWorkOrderModal(true)}>
            <Briefcase size={14} />
            Create Work Order
          </Button>
          <Button variant="default" size="md" onClick={() => setAdvanceStageModal(true)}>
            <ChevronRight size={14} />
            Advance Stage
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs tabs={TAB_LIST} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Tab Content ── */}
      {activeTab === "overview" && <OverviewTab stageIndex={currentStageIndex} />}
      {activeTab === "resources" && <ResourcesTab onAddResource={() => setAddResourceModal(true)} />}
      {activeTab === "related" && <RelatedRecordsTab onLinkRecord={() => setLinkRecordModal(true)} />}
      {activeTab === "evidence" && <EvidenceTab onAddEvidence={() => setAddEvidenceModal(true)} onTransferCustody={() => setChainOfCustodyModal(true)} />}
      {activeTab === "tasks" && <TasksTab onAddTask={() => setAddTaskModal(true)} />}
      {activeTab === "narratives" && <NarrativesTab onAddNarrative={() => setAddNarrativeModal(true)} />}
      {activeTab === "financial" && <FinancialTab onAddEntry={() => setAddFinancialModal(true)} />}
      {activeTab === "outcome" && <OutcomeTab onDocumentOutcome={() => setOutcomeModal(true)} />}
      {activeTab === "audit" && <AuditLogTab />}

      {/* ── Modals ── */}
      <AddResourceModal
        open={addResourceModal}
        onClose={() => setAddResourceModal(false)}
        onSubmit={async (data) => {
          toast("Resource added to case", { variant: "success" });
          setAddResourceModal(false);
        }}
      />

      <AddEvidenceModal
        open={addEvidenceModal}
        onClose={() => setAddEvidenceModal(false)}
        onSubmit={async (data) => {
          toast("Evidence added to case", { variant: "success" });
          setAddEvidenceModal(false);
        }}
      />

      <AddTaskModal
        open={addTaskModal}
        onClose={() => setAddTaskModal(false)}
        onSubmit={async (data) => {
          toast("Task added", { variant: "success" });
          setAddTaskModal(false);
        }}
      />

      <CaseStatusChangeModal
        open={statusChangeModal}
        onClose={() => setStatusChangeModal(false)}
        onConfirm={async (newStatus, reason) => {
          try {
            await updateCaseStatus(caseData.id, newStatus.toLowerCase() as any);
            toast("Case status updated", { variant: "success" });
            setStatusChangeModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to update status", { variant: "error" });
          }
        }}
        currentStatus={c.status.toUpperCase()}
        caseNumber={c.id}
      />

      <AddCaseNarrativeModal
        open={addNarrativeModal}
        onClose={() => setAddNarrativeModal(false)}
        onSubmit={async (data) => {
          toast("Narrative added", { variant: "success" });
          setAddNarrativeModal(false);
        }}
      />

      <ChainOfCustodyModal
        open={chainOfCustodyModal}
        onClose={() => setChainOfCustodyModal(false)}
        onSubmit={async (data) => {
          toast("Chain of custody transferred", { variant: "success" });
          setChainOfCustodyModal(false);
        }}
        caseId={c.id}
        evidenceItems={EVIDENCE.map((ev) => ({
          id: ev.id,
          label: ev.description,
          type: ev.type,
        }))}
      />

      <LinkRecordModal
        open={linkRecordModal}
        onClose={() => setLinkRecordModal(false)}
        onSubmit={async (data) => {
          toast("Record linked to case", { variant: "success" });
          setLinkRecordModal(false);
        }}
      />

      <EscalateCaseModal
        open={escalateCaseModal}
        onClose={() => setEscalateCaseModal(false)}
        onSubmit={async (data) => {
          toast("Case escalated", { variant: "success" });
          setEscalateCaseModal(false);
        }}
      />

      <CloseCaseModal
        open={closeCaseModal}
        onClose={() => setCloseCaseModal(false)}
        onSubmit={async (data) => {
          toast("Case closed", { variant: "success" });
          setCloseCaseModal(false);
        }}
        openTaskCount={TASKS.filter((t) => t.percentComplete < 100).length}
      />

      <DeleteCaseModal
        open={deleteCaseModal}
        onClose={() => setDeleteCaseModal(false)}
        onConfirm={async (reason) => {
          try {
            await deleteCase(caseData.id);
            toast("Case deleted", { variant: "info" });
            setDeleteCaseModal(false);
            window.location.href = "/cases";
          } catch (err: any) {
            toast(err.message || "Failed to delete case", { variant: "error" });
          }
        }}
        caseNumber={c.id}
      />

      <AdvanceStageModal
        open={advanceStageModal}
        onClose={() => setAdvanceStageModal(false)}
        onConfirm={async (reason) => {
          toast("Case advanced to next stage", { variant: "success" });
          setAdvanceStageModal(false);
        }}
        currentStage={STAGES[currentStageIndex]?.label ?? ""}
        nextStage={STAGES[currentStageIndex + 1]?.label ?? "Complete"}
      />

      <AddCaseFinancialModal
        open={addFinancialModal}
        onClose={() => setAddFinancialModal(false)}
        onSubmit={async (data) => {
          toast("Financial entry added", { variant: "success" });
          setAddFinancialModal(false);
        }}
      />

      <TransferEvidenceWizard
        open={transferEvidenceModal}
        onClose={() => setTransferEvidenceModal(false)}
        onSubmit={async (data) => {
          toast("Evidence transferred", { variant: "success" });
          setTransferEvidenceModal(false);
        }}
        evidence={null}
      />

      <OutcomeDocumentationModal
        open={outcomeModal}
        onClose={() => setOutcomeModal(false)}
        onSubmit={async (data) => {
          toast("Outcome documented", { variant: "success" });
          setOutcomeModal(false);
        }}
      />

      <CaseClosureWizard
        open={closureWizardModal}
        onClose={() => setClosureWizardModal(false)}
        onSubmit={async (data) => {
          toast("Case closure completed", { variant: "success" });
          setClosureWizardModal(false);
        }}
      />

      <CreateBriefingFromCaseModal
        open={createBriefingModal}
        onClose={() => setCreateBriefingModal(false)}
        onSubmit={async (data) => {
          try {
            const result = await createBriefing({
              orgId: caseData.orgId,
              propertyId: caseData.propertyId,
              title: (data as any).title || `Briefing from ${caseData.recordNumber}`,
              content: (data as any).content || caseData.synopsis || "",
              priority: (data as any).priority || caseData.escalationLevel || "medium",
            });
            toast(`Briefing "${result.title}" created`, { variant: "success" });
            setCreateBriefingModal(false);
            router.push("/briefings");
          } catch (err: any) {
            toast(err.message || "Failed to create briefing", { variant: "error" });
          }
        }}
        caseData={{
          id: c.id,
          caseNumber: c.id,
          title: c.title,
          description: c.description,
          outcome: "",
          participants: [],
          severity: c.priority,
        }}
      />

      <CreateWorkOrderFromCaseModal
        open={createWorkOrderModal}
        onClose={() => setCreateWorkOrderModal(false)}
        onSubmit={async (data) => {
          try {
            const result = await createWorkOrder({
              orgId: caseData.orgId,
              propertyId: caseData.propertyId,
              title: (data as any).title || `Work Order from ${caseData.recordNumber}`,
              description: (data as any).description || caseData.synopsis || "",
              category: (data as any).category || "case-related",
              priority: (data as any).priority || caseData.escalationLevel || "medium",
            });
            toast(`Work Order ${result.record_number} created`, { variant: "success" });
            setCreateWorkOrderModal(false);
            router.push(`/work-orders/${result.id}`);
          } catch (err: any) {
            toast(err.message || "Failed to create work order", { variant: "error" });
          }
        }}
        caseData={{
          id: c.id,
          caseNumber: c.id,
          title: c.title,
          findings: c.description,
          severity: c.priority,
        }}
      />
    </div>
  );
}

/* ================================================================
   HELPER COMPONENTS
   ================================================================ */

function FieldRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-[13px] text-[var(--text-primary)]">
        {children ?? value ?? "-"}
      </dd>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: { icon: typeof Clock; label: string; value: string | number; sub?: string }) {
  return (
    <div className="surface-card p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
        <Icon size={15} className="text-[var(--text-tertiary)]" />
      </div>
      <div>
        <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-[var(--text-primary)] leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        {children}
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2 border-b border-[var(--border-default)] ${className ?? ""}`}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-[var(--text-primary)] border-b border-[var(--border-default)] ${className ?? ""}`}>
      {children}
    </td>
  );
}

/* ================================================================
   1. OVERVIEW TAB
   ================================================================ */

function OverviewTab({ stageIndex }: { stageIndex: number }) {
  const c = CASE_DATA;

  return (
    <div className="space-y-5">
      {/* Stage Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Investigation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {STAGES.map((stage, i) => {
              const isComplete = i < stageIndex;
              const isCurrent = i === stageIndex;
              const isFuture = i > stageIndex;

              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border-2 transition-colors ${
                        isComplete
                          ? "bg-[var(--status-success,#059669)] border-[var(--status-success,#059669)] text-white"
                          : isCurrent
                          ? "bg-[var(--action-primary)] border-[var(--action-primary)] text-white"
                          : "bg-[var(--surface-secondary)] border-[var(--border-default)] text-[var(--text-tertiary)]"
                      }`}
                    >
                      {isComplete ? <CheckCircle2 size={14} /> : stage.number}
                    </div>
                    <span
                      className={`text-[10px] text-center leading-tight truncate w-full ${
                        isCurrent ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 min-w-3 mx-1 rounded-full mt-[-18px] ${
                        i < stageIndex
                          ? "bg-[var(--status-success,#059669)]"
                          : "bg-[var(--border-default)]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            <ProgressBar
              value={((stageIndex + 1) / STAGES.length) * 100}
              label="Overall Progress"
              size="md"
              color="var(--action-primary)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Clock} label="Days Open" value={c.daysOpen} sub="Since Feb 19" />
        <MetricCard icon={Users} label="Resources" value={c.resourceCount} sub="5 active, 1 inactive" />
        <MetricCard icon={Package} label="Evidence Items" value={c.evidenceCount} sub="6 physical, 17 digital" />
        <MetricCard icon={ListChecks} label="Tasks" value={`${c.tasksCompleted}/${c.taskCount}`} sub={`${Math.round((c.tasksCompleted / c.taskCount) * 100)}% complete`} />
      </div>

      {/* Detail Fields */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0" style={{ flex: "7 1 0%" }}>
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                <FieldRow label="Case Number" value={c.id} />
                <FieldRow label="Category" value={c.category} />
                <FieldRow label="Location">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[var(--text-tertiary)]" />
                    {c.location}
                  </span>
                </FieldRow>
                <FieldRow label="Priority">
                  <PriorityBadge priority={c.priority} />
                </FieldRow>
                <FieldRow label="Status">
                  <StatusBadge status={c.status} dot />
                </FieldRow>
                <FieldRow label="Current Stage">
                  <Badge tone="info">{STAGES.find((s) => s.key === c.stage)?.label}</Badge>
                </FieldRow>
                <FieldRow label="Created By">
                  <span className="flex items-center gap-1">
                    <User size={12} className="text-[var(--text-tertiary)]" />
                    {c.createdBy}
                  </span>
                </FieldRow>
                <FieldRow label="Case Manager">
                  <span className="flex items-center gap-1">
                    <Shield size={12} className="text-[var(--text-tertiary)]" />
                    {c.caseManager}
                  </span>
                </FieldRow>
                <FieldRow label="Created" value={c.createdAt} />
                <FieldRow label="Last Updated" value={c.updatedAt} />
                <div className="sm:col-span-2">
                  <FieldRow label="Description" value={c.description} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-auto space-y-4 lg:shrink-0" style={{ flex: "3 1 0%", minWidth: 240 }}>
          <div className="surface-card p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Narratives</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">{c.narrativeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Evidence Items</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">{c.evidenceCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Related Records</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">{RELATED_RECORDS.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Audit Entries</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">{AUDIT_LOG.length}</span>
              </div>
            </div>
          </div>

          <div className="surface-card p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Task Completion
            </h3>
            <ProgressBar
              value={Math.round((c.tasksCompleted / c.taskCount) * 100)}
              label="Tasks"
              size="md"
              color="var(--status-success,#059669)"
            />
          </div>

          <div className="surface-card p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Financial Summary
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Total Costs</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  ${(FINANCIAL.incidentalCosts + FINANCIAL.timeCosts).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">ALE Budget</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  ${FINANCIAL.ale.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Recoveries</span>
                <span className="text-[12px] font-medium text-[var(--status-success,#059669)]">
                  ${FINANCIAL.totalLosses.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   2. RESOURCES TAB
   ================================================================ */

function ResourcesTab({ onAddResource }: { onAddResource: () => void }) {
  const roleColors: Record<string, { tone: "info" | "success" | "default"; label: string }> = {
    case_manager: { tone: "info", label: "Case Manager" },
    investigator: { tone: "success", label: "Investigator" },
    view_only: { tone: "default", label: "View Only" },
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Assigned Resources</CardTitle>
        <Button variant="outline" size="sm" onClick={onAddResource}>
          <Plus size={13} />
          Add Resource
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <TableWrapper>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Alias</Th>
              <Th>Role</Th>
              <Th>Hourly Rate</Th>
              <Th>Hours Logged</Th>
              <Th>Total Cost</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {RESOURCES.map((r) => {
              const rc = roleColors[r.role] ?? { tone: "default" as const, label: r.role };
              return (
                <tr key={r.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <Td>
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                        {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium">{r.name}</span>
                    </span>
                  </Td>
                  <Td>
                    {r.alias ? (
                      <span className="text-[12px] font-mono bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded">
                        {r.alias}
                      </span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">--</span>
                    )}
                  </Td>
                  <Td><Badge tone={rc.tone}>{rc.label}</Badge></Td>
                  <Td>${r.rate}/hr</Td>
                  <Td>{r.hours}h</Td>
                  <Td className="font-medium">${(r.rate * r.hours).toLocaleString()}</Td>
                  <Td>
                    <StatusBadge status={r.status} dot />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <div className="px-4 py-3 border-t border-[var(--border-default)] flex justify-between text-[12px] text-[var(--text-secondary)]">
          <span>{RESOURCES.length} resources assigned</span>
          <span className="font-medium text-[var(--text-primary)]">
            Total: ${RESOURCES.reduce((sum, r) => sum + r.rate * r.hours, 0).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   3. RELATED RECORDS TAB
   ================================================================ */

function RelatedRecordsTab({ onLinkRecord }: { onLinkRecord: () => void }) {
  const typeConfig: Record<string, { icon: typeof FileText; tone: "critical" | "info" | "warning"; label: string }> = {
    incident: { icon: AlertTriangle, tone: "critical", label: "Incident" },
    dispatch: { icon: Briefcase, tone: "info", label: "Dispatch" },
    daily_log: { icon: FileText, tone: "warning", label: "Daily Log" },
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Linked Records</CardTitle>
        <Button variant="outline" size="sm" onClick={onLinkRecord}>
          <Link2 size={13} />
          Link Record
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <TableWrapper>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Type</Th>
              <Th>Title</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="w-10">{""}</Th>
            </tr>
          </thead>
          <tbody>
            {RELATED_RECORDS.map((r) => {
              const tc = typeConfig[r.type] ?? { icon: FileText, tone: "default" as const, label: r.type };
              const TypeIcon = tc.icon;
              return (
                <tr key={r.id} className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
                  <Td>
                    <span className="font-mono text-[12px] text-[var(--action-primary)]">{r.id}</span>
                  </Td>
                  <Td>
                    <Badge tone={tc.tone}>
                      <TypeIcon size={10} />
                      {tc.label}
                    </Badge>
                  </Td>
                  <Td>{r.title}</Td>
                  <Td>
                    <span className="text-[12px] text-[var(--text-secondary)]">{r.date}</span>
                  </Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td>
                    <ChevronRight size={13} className="text-[var(--text-tertiary)]" />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <div className="px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
          {RELATED_RECORDS.length} linked records
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   4. EVIDENCE TAB
   ================================================================ */

function EvidenceTab({ onAddEvidence, onTransferCustody }: { onAddEvidence: () => void; onTransferCustody: () => void }) {
  const typeConfig: Record<string, { icon: typeof Package; tone: "default" | "info" | "success" | "warning" | "critical" | "attention" }> = {
    physical: { icon: Package, tone: "warning" },
    digital: { icon: HardDrive, tone: "info" },
    document: { icon: FileText, tone: "default" },
    photo: { icon: Camera, tone: "success" },
    video: { icon: Video, tone: "critical" },
    audio: { icon: Mic, tone: "attention" },
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Evidence Items</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download size={13} />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onAddEvidence}>
            <Plus size={13} />
            Log Evidence
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TableWrapper>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Type</Th>
              <Th>Description</Th>
              <Th>Storage</Th>
              <Th>Custodian</Th>
              <Th>Collected</Th>
              <Th>Days Held</Th>
              <Th>CoC</Th>
            </tr>
          </thead>
          <tbody>
            {EVIDENCE.map((ev) => {
              const tc = typeConfig[ev.type] ?? { icon: Package, tone: "default" as const };
              const EvIcon = tc.icon;
              return (
                <tr key={ev.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <Td>
                    <span className="font-mono text-[12px]">{ev.id}</span>
                  </Td>
                  <Td>
                    <Badge tone={tc.tone}>
                      <EvIcon size={10} />
                      {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="max-w-[240px] truncate block">{ev.description}</span>
                  </Td>
                  <Td>
                    <span className="text-[12px] text-[var(--text-secondary)]">{ev.storageLocation}</span>
                  </Td>
                  <Td>{ev.custodian}</Td>
                  <Td>
                    <span className="text-[12px] text-[var(--text-secondary)]">{ev.collectedDate}</span>
                  </Td>
                  <Td>
                    <span className={`text-[12px] font-medium ${ev.daysHeld > 30 ? "text-[var(--status-warning,#d97706)]" : "text-[var(--text-primary)]"}`}>
                      {ev.daysHeld}d
                    </span>
                  </Td>
                  <Td>
                    <span className="text-[12px] font-mono bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded">
                      {ev.chainOfCustody} transfers
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <div className="px-4 py-3 border-t border-[var(--border-default)] flex justify-between text-[12px] text-[var(--text-secondary)]">
          <span>{EVIDENCE.length} evidence items</span>
          <span>Total chain of custody transfers: {EVIDENCE.reduce((s, e) => s + e.chainOfCustody, 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   5. TASKS TAB
   ================================================================ */

function TasksTab({ onAddTask }: { onAddTask: () => void }) {
  const totalHours = TASKS.reduce((s, t) => s + t.hoursLogged, 0);
  const overallPercent = Math.round(TASKS.reduce((s, t) => s + t.percentComplete, 0) / TASKS.length);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard icon={ListChecks} label="Overall Completion" value={`${overallPercent}%`} />
        <MetricCard icon={Timer} label="Total Hours" value={`${totalHours}h`} sub={`Across ${TASKS.length} tasks`} />
        <MetricCard icon={Flag} label="Critical Tasks" value={TASKS.filter((t) => t.critical).length} sub={`of ${TASKS.length} total`} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Task List</CardTitle>
          <Button variant="outline" size="sm" onClick={onAddTask}>
            <Plus size={13} />
            Add Task
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border-default)]">
            {TASKS.map((task) => (
              <div key={task.id} className="px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{task.id}</span>
                      {task.critical && (
                        <Badge tone="critical">
                          <Flag size={9} />
                          Critical
                        </Badge>
                      )}
                      {task.percentComplete === 100 && (
                        <Badge tone="success">
                          <CheckCircle2 size={9} />
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{task.title}</p>
                    <div className="flex items-center gap-4 mt-1 text-[12px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {task.assignedTo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        Due: {task.dueDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer size={10} />
                        {task.hoursLogged}h logged
                      </span>
                    </div>

                    {/* Subtasks */}
                    <div className="mt-2 space-y-1">
                      {task.subtasks.map((st, i) => (
                        <div key={i} className="flex items-center gap-2 text-[12px]">
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              st.complete
                                ? "bg-[var(--status-success,#059669)] border-[var(--status-success,#059669)]"
                                : "border-[var(--border-default)] bg-transparent"
                            }`}
                          >
                            {st.complete && <CheckCircle2 size={9} className="text-white" />}
                          </div>
                          <span className={st.complete ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-secondary)]"}>
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="w-24 shrink-0 pt-1">
                    <ProgressBar
                      value={task.percentComplete}
                      size="sm"
                      color={
                        task.percentComplete === 100
                          ? "var(--status-success,#059669)"
                          : task.critical
                          ? "var(--status-warning,#d97706)"
                          : "var(--action-primary)"
                      }
                    />
                    <p className="text-[11px] text-center text-[var(--text-tertiary)] mt-1">
                      {task.percentComplete}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================
   6. NARRATIVES TAB
   ================================================================ */

function NarrativesTab({ onAddNarrative }: { onAddNarrative: () => void }) {
  const highlightColors: Record<string, { bg: string; border: string }> = {
    yellow: { bg: "#fefce8", border: "#fde68a" },
    blue: { bg: "#eff6ff", border: "#bfdbfe" },
    green: { bg: "#ecfdf5", border: "#a7f3d0" },
    pink: { bg: "#fdf2f8", border: "#fbcfe8" },
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Investigation Narratives</CardTitle>
        <Button variant="outline" size="sm" onClick={onAddNarrative}>
          <Plus size={13} />
          Add Narrative
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--border-default)]">
          {NARRATIVES.map((n) => {
            const hc = highlightColors[n.highlight] ?? highlightColors.yellow;
            return (
              <div key={n.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-1 shrink-0 rounded-full self-stretch"
                    style={{ backgroundColor: hc.border }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{n.id}</span>
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{n.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                        <span>{n.author}</span>
                        <span>{n.date}</span>
                      </div>
                    </div>
                    <div
                      className="rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] leading-relaxed"
                      style={{ backgroundColor: hc.bg, borderLeft: `3px solid ${hc.border}` }}
                    >
                      {n.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
          {NARRATIVES.length} narratives
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   7. FINANCIAL TAB
   ================================================================ */

function FinancialTab({ onAddEntry }: { onAddEntry: () => void }) {
  const f = FINANCIAL;
  const totalExpenses = f.entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalRecoveries = Math.abs(f.entries.filter((e) => e.type === "recovery").reduce((s, e) => s + e.amount, 0));
  const budgetUsed = Math.round(((f.incidentalCosts + f.timeCosts) / f.ale) * 100);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard icon={DollarSign} label="ALE Budget" value={`$${f.ale.toLocaleString()}`} sub={`${budgetUsed}% utilized`} />
        <MetricCard icon={BarChart3} label="Incidental Costs" value={`$${f.incidentalCosts.toLocaleString()}`} sub="Equipment, buy money" />
        <MetricCard icon={Timer} label="Time Costs" value={`$${f.timeCosts.toLocaleString()}`} sub="Personnel hours" />
        <MetricCard icon={TrendingDown} label="Losses" value={`$${f.totalLosses.toLocaleString()}`} sub="Unrecovered" />
        <MetricCard icon={TrendingUp} label="Recoveries" value={`$${totalRecoveries.toLocaleString()}`} sub="Cash seizures" />
      </div>

      {/* Budget bar */}
      <Card>
        <CardContent>
          <ProgressBar
            value={budgetUsed}
            label="Budget Utilization"
            size="md"
            color={budgetUsed > 80 ? "var(--status-critical,#dc2626)" : budgetUsed > 60 ? "var(--status-warning,#d97706)" : "var(--status-success,#059669)"}
          />
        </CardContent>
      </Card>

      {/* Entries table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Financial Entries</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download size={13} />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onAddEntry}>
              <Plus size={13} />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrapper>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Type</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {f.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <Td><span className="font-mono text-[12px]">{entry.id}</span></Td>
                  <Td><span className="text-[12px] text-[var(--text-secondary)]">{entry.date}</span></Td>
                  <Td>
                    <Badge tone="default">{entry.category}</Badge>
                  </Td>
                  <Td>{entry.description}</Td>
                  <Td>
                    <Badge tone={entry.type === "recovery" ? "success" : "warning"}>
                      {entry.type === "recovery" ? "Recovery" : "Expense"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <span className={`font-medium ${entry.type === "recovery" ? "text-[var(--status-success,#059669)]" : "text-[var(--text-primary)]"}`}>
                      {entry.type === "recovery" ? "+" : ""}${Math.abs(entry.amount).toLocaleString()}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <div className="px-4 py-3 border-t border-[var(--border-default)] flex justify-between text-[12px] text-[var(--text-secondary)]">
            <span>{f.entries.length} entries</span>
            <div className="flex items-center gap-4">
              <span>Expenses: <span className="font-medium text-[var(--text-primary)]">${totalExpenses.toLocaleString()}</span></span>
              <span>Recoveries: <span className="font-medium text-[var(--status-success,#059669)]">+${totalRecoveries.toLocaleString()}</span></span>
              <span>Net: <span className="font-medium text-[var(--text-primary)]">${(totalExpenses - totalRecoveries).toLocaleString()}</span></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================
   8. OUTCOME TAB
   ================================================================ */

function OutcomeTab({ onDocumentOutcome }: { onDocumentOutcome: () => void }) {
  const o = OUTCOME_DATA;
  const outcomeTypes = ["founded", "unfounded", "inconclusive", "unresolved"];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Outcome Determination</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
            <FieldRow label="Outcome Type">
              {o.outcomeType ? (
                <StatusBadge status={o.outcomeType} dot />
              ) : (
                <div className="space-y-2">
                  <span className="text-[12px] text-[var(--text-tertiary)] italic">Not yet determined</span>
                  <div className="flex gap-2 flex-wrap">
                    {outcomeTypes.map((t) => (
                      <button
                        key={t}
                        className="px-2.5 py-1 text-[11px] rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors capitalize"
                        onClick={onDocumentOutcome}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </FieldRow>
            <FieldRow label="Classification" value={o.classification} />
            <div className="sm:col-span-2">
              <FieldRow label="Formal Notes" value={o.formalNotes} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {o.findings.map((finding, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[var(--status-info-surface,#eff6ff)] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[var(--status-info,#2563eb)]">{i + 1}</span>
                </div>
                <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{finding}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investigation Stage Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-[var(--status-info-surface,#eff6ff)] border border-[var(--status-info-border,#bfdbfe)]">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-[var(--status-info,#2563eb)]" />
              <p className="text-[13px] text-[var(--status-info,#2563eb)] font-medium">
                Currently in Detailed Investigation stage
              </p>
            </div>
            <p className="text-[12px] text-[var(--status-info,#2563eb)] mt-1 opacity-80">
              Outcome determination will be finalized when the case advances to the Outcome stage. All evidence and tasks should be reviewed before making a determination.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================
   9. AUDIT LOG TAB
   ================================================================ */

function AuditLogTab() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Audit Trail</CardTitle>
        <Button variant="outline" size="sm">
          <Download size={13} />
          Export
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[29px] top-4 bottom-4 w-px bg-[var(--border-default)]" />

          <div className="divide-y divide-[var(--border-default)]">
            {AUDIT_LOG.map((entry) => {
              const iconMap: Record<string, typeof Clock> = {
                "Case Created": Plus,
                "Resource Assigned": Users,
                "Stage Advanced": ChevronRight,
                "Evidence Added": Package,
                "Related Record Linked": Link2,
                "Task Completed": CheckCircle2,
                "Narrative Added": StickyNote,
                "Resource Deactivated": Eye,
                Viewed: Eye,
              };
              const Icon = iconMap[entry.action] ?? History;

              return (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-[31px] h-[31px] rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center shrink-0 z-10">
                    <Icon size={13} className="text-[var(--text-tertiary)]" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">
                          {entry.action}
                        </span>
                        <span className="text-[12px] text-[var(--text-tertiary)]">
                          by {entry.user}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap flex items-center gap-1">
                        <Clock size={10} />
                        {entry.timestamp}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{entry.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
          {AUDIT_LOG.length} audit entries
        </div>
      </CardContent>
    </Card>
  );
}
