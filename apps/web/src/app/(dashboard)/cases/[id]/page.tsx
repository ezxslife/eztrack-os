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
import {
  fetchCaseById,
  updateCaseStatus,
  updateCase,
  deleteCase,
  fetchCaseEvidence,
  fetchCaseTasks,
  fetchCaseNarratives,
  fetchCaseCosts,
  fetchCaseRelatedRecords,
  fetchCaseAudit,
  fetchCaseResources,
  createCaseEvidence,
  createCaseTask,
  createCaseNarrative,
  createEvidenceTransfer,
  createCaseRelatedRecord,
  createCaseCost,
  createCaseResource,
  type CaseDetail,
  type CaseEvidenceItem,
  type CaseTask,
  type CaseNarrativeItem,
  type CaseCostEntry,
  type CaseRelatedRecord,
  type CaseAuditEntry,
  type CaseResource,
} from "@/lib/queries/cases";
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






/* ================================================================
   TAB DEFINITIONS
   ================================================================ */

/* TAB_LIST is built dynamically in the component with real counts */

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
  const [evidence, setEvidence] = useState<CaseEvidenceItem[]>([]);
  const [tasks, setTasks] = useState<CaseTask[]>([]);
  const [narratives, setNarratives] = useState<CaseNarrativeItem[]>([]);
  const [costs, setCosts] = useState<CaseCostEntry[]>([]);
  const [relatedRecords, setRelatedRecords] = useState<CaseRelatedRecord[]>([]);
  const [auditLog, setAuditLog] = useState<CaseAuditEntry[]>([]);
  const [resources, setResources] = useState<CaseResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, ev, tk, nr, co, rr, al, res] = await Promise.all([
        fetchCaseById(id),
        fetchCaseEvidence(id).catch(() => [] as CaseEvidenceItem[]),
        fetchCaseTasks(id).catch(() => [] as CaseTask[]),
        fetchCaseNarratives(id).catch(() => [] as CaseNarrativeItem[]),
        fetchCaseCosts(id).catch(() => [] as CaseCostEntry[]),
        fetchCaseRelatedRecords(id).catch(() => [] as CaseRelatedRecord[]),
        fetchCaseAudit(id).catch(() => [] as CaseAuditEntry[]),
        fetchCaseResources(id).catch(() => [] as CaseResource[]),
      ]);
      setCaseData(data);
      setEvidence(ev);
      setTasks(tk);
      setNarratives(nr);
      setCosts(co);
      setRelatedRecords(rr);
      setAuditLog(al);
      setResources(res);
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

  // Map real DB data → template shape
  const tasksCompleted = tasks.filter((t) => t.status === "done").length;
  const c = {
    id: caseData.recordNumber,
    title: caseData.caseType,
    stage: caseData.stage || "assessment",
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
    evidenceCount: evidence.length,
    taskCount: tasks.length,
    tasksCompleted,
    resourceCount: resources.length,
    narrativeCount: narratives.length,
  };
  const currentStageIndex = STAGES.findIndex((s) => s.key === c.stage);

  const TAB_LIST = [
    { id: "overview", label: "Overview" },
    { id: "resources", label: "Resources" },
    { id: "related", label: "Related Records", count: relatedRecords.length },
    { id: "evidence", label: "Evidence", count: evidence.length },
    { id: "tasks", label: "Tasks", count: tasks.length },
    { id: "narratives", label: "Narratives", count: narratives.length },
    { id: "financial", label: "Financial" },
    { id: "outcome", label: "Outcome" },
    { id: "audit", label: "Audit Log", count: auditLog.length },
  ];

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
      {activeTab === "overview" && <OverviewTab c={c} stageIndex={currentStageIndex} relatedRecords={relatedRecords} auditLog={auditLog} costs={costs} tasks={tasks} />}
      {activeTab === "resources" && <ResourcesTab resources={resources} onAddResource={() => setAddResourceModal(true)} />}
      {activeTab === "related" && <RelatedRecordsTab relatedRecords={relatedRecords} onLinkRecord={() => setLinkRecordModal(true)} />}
      {activeTab === "evidence" && <EvidenceTab evidence={evidence} onAddEvidence={() => setAddEvidenceModal(true)} onTransferCustody={() => setChainOfCustodyModal(true)} />}
      {activeTab === "tasks" && <TasksTab tasks={tasks} onAddTask={() => setAddTaskModal(true)} />}
      {activeTab === "narratives" && <NarrativesTab narratives={narratives} onAddNarrative={() => setAddNarrativeModal(true)} />}
      {activeTab === "financial" && <FinancialTab costs={costs} onAddEntry={() => setAddFinancialModal(true)} />}
      {activeTab === "outcome" && <OutcomeTab onDocumentOutcome={() => setOutcomeModal(true)} />}
      {activeTab === "audit" && <AuditLogTab auditLog={auditLog} />}

      {/* ── Modals ── */}
      <AddResourceModal
        open={addResourceModal}
        onClose={() => setAddResourceModal(false)}
        onSubmit={async (data) => {
          try {
            await createCaseResource(caseData.id, caseData.orgId, {
              name: data.userSearch,
              alias: data.aliasActive ? data.alias : undefined,
              role: data.role,
              hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
            });
            toast("Resource added to case", { variant: "success" });
            setAddResourceModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to add resource", { variant: "error" });
          }
        }}
      />

      <AddEvidenceModal
        open={addEvidenceModal}
        onClose={() => setAddEvidenceModal(false)}
        onSubmit={async (data) => {
          try {
            await createCaseEvidence(caseData.id, {
              title: (data as any).title,
              description: (data as any).description,
              type: (data as any).type,
              storageLocation: (data as any).storageLocation,
              storageFacility: (data as any).storageFacility,
              itemNumber: (data as any).itemNumber,
              externalIdentifier: (data as any).externalIdentifier,
            });
            toast("Evidence added to case", { variant: "success" });
            setAddEvidenceModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to add evidence", { variant: "error" });
          }
        }}
      />

      <AddTaskModal
        open={addTaskModal}
        onClose={() => setAddTaskModal(false)}
        onSubmit={async (data) => {
          try {
            await createCaseTask(caseData.id, caseData.orgId, {
              title: (data as any).title,
              description: (data as any).description,
              priority: (data as any).priority,
              assignedTo: (data as any).assignee || null,
              dueDate: (data as any).dueDate || null,
            });
            toast("Task added", { variant: "success" });
            setAddTaskModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to add task", { variant: "error" });
          }
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
          try {
            await createCaseNarrative(caseData.id, {
              title: (data as any).title,
              content: (data as any).content,
            });
            toast("Narrative added", { variant: "success" });
            setAddNarrativeModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to add narrative", { variant: "error" });
          }
        }}
      />

      <ChainOfCustodyModal
        open={chainOfCustodyModal}
        onClose={() => setChainOfCustodyModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            const selectedItems: string[] = d.selectedItems || [];
            for (const evidenceId of selectedItems) {
              await createEvidenceTransfer(caseData.orgId, {
                evidenceId,
                transferredToId: d.receivedBy,
                transferReason: d.transferReason,
                notes: d.notes || undefined,
              });
            }
            toast("Chain of custody transferred", { variant: "success" });
            setChainOfCustodyModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to transfer custody", { variant: "error" });
          }
        }}
        caseId={c.id}
        evidenceItems={evidence.map((ev) => ({
          id: ev.id,
          label: ev.title,
          type: ev.type,
        }))}
      />

      <LinkRecordModal
        open={linkRecordModal}
        onClose={() => setLinkRecordModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            await createCaseRelatedRecord(caseData.id, caseData.orgId, {
              relatedRecordId: d.recordId,
              relatedRecordType: d.recordType,
              relationshipDescription: d.relationship + (d.notes ? ` — ${d.notes}` : ""),
            });
            toast("Record linked to case", { variant: "success" });
            setLinkRecordModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to link record", { variant: "error" });
          }
        }}
      />

      <EscalateCaseModal
        open={escalateCaseModal}
        onClose={() => setEscalateCaseModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            await updateCase(caseData.id, {
              escalation_level: d.priority || "high",
            });
            toast("Case escalated", { variant: "success" });
            setEscalateCaseModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to escalate case", { variant: "error" });
          }
        }}
      />

      <CloseCaseModal
        open={closeCaseModal}
        onClose={() => setCloseCaseModal(false)}
        onSubmit={async (data) => {
          try {
            await updateCaseStatus(caseData.id, "closed" as any);
            toast("Case closed", { variant: "success" });
            setCloseCaseModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to close case", { variant: "error" });
          }
        }}
        openTaskCount={tasks.filter((t) => t.status !== "done").length}
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
          try {
            const nextStageKey = STAGES[currentStageIndex + 1]?.key;
            if (!nextStageKey) {
              toast("Case is already at the final stage.", { variant: "info" });
              setAdvanceStageModal(false);
              return;
            }
            await updateCase(caseData.id, { stage: nextStageKey });
            toast(`Case advanced to ${STAGES[currentStageIndex + 1]?.label}`, { variant: "success" });
            setAdvanceStageModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to advance stage", { variant: "error" });
          }
        }}
        currentStage={STAGES[currentStageIndex]?.label ?? ""}
        nextStage={STAGES[currentStageIndex + 1]?.label ?? "Complete"}
      />

      <AddCaseFinancialModal
        open={addFinancialModal}
        onClose={() => setAddFinancialModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            await createCaseCost(caseData.id, caseData.orgId, {
              costType: d.category || "other",
              amount: parseFloat(d.amount) || 0,
              description: d.description || d.type || "",
              vendor: d.type || undefined,
            });
            toast("Financial entry added", { variant: "success" });
            setAddFinancialModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to add financial entry", { variant: "error" });
          }
        }}
      />

      <TransferEvidenceWizard
        open={transferEvidenceModal}
        onClose={() => setTransferEvidenceModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            // The wizard provides newCustodian (name/id) and reason
            // We create a transfer record for the first evidence item if available
            if (evidence.length > 0) {
              await createEvidenceTransfer(caseData.orgId, {
                evidenceId: evidence[0].id,
                transferredToId: d.newCustodian,
                transferReason: "storage",
                notes: d.reason || d.notes || undefined,
              });
            }
            toast("Evidence transferred", { variant: "success" });
            setTransferEvidenceModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to transfer evidence", { variant: "error" });
          }
        }}
        evidence={null}
      />

      <OutcomeDocumentationModal
        open={outcomeModal}
        onClose={() => setOutcomeModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            await updateCase(caseData.id, {
              synopsis: d.outcomeNotes || caseData.synopsis,
            });
            toast("Outcome documented", { variant: "success" });
            setOutcomeModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to document outcome", { variant: "error" });
          }
        }}
      />

      <CaseClosureWizard
        open={closureWizardModal}
        onClose={() => setClosureWizardModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            await updateCase(caseData.id, {
              status: "closed",
              synopsis: d.closureNotes
                ? `${caseData.synopsis || ""}\n\n[Closure Notes] ${d.closureNotes}`.trim()
                : caseData.synopsis,
            });
            toast("Case closure completed", { variant: "success" });
            setClosureWizardModal(false);
            loadCase();
          } catch (err: any) {
            toast(err.message || "Failed to close case", { variant: "error" });
          }
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

function OverviewTab({ c, stageIndex, relatedRecords, auditLog, costs, tasks }: { c: any; stageIndex: number; relatedRecords: CaseRelatedRecord[]; auditLog: CaseAuditEntry[]; costs: CaseCostEntry[]; tasks: CaseTask[] }) {
  const totalCosts = costs.reduce((s, e) => s + e.amount, 0);

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
        <MetricCard icon={Clock} label="Days Open" value={c.daysOpen} />
        <MetricCard icon={Users} label="Resources" value={c.resourceCount} />
        <MetricCard icon={Package} label="Evidence Items" value={c.evidenceCount} />
        <MetricCard icon={ListChecks} label="Tasks" value={`${c.tasksCompleted}/${c.taskCount}`} sub={c.taskCount > 0 ? `${Math.round((c.tasksCompleted / c.taskCount) * 100)}% complete` : "No tasks"} />
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
                <span className="text-[12px] font-medium text-[var(--text-primary)]">{relatedRecords.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Audit Entries</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">{auditLog.length}</span>
              </div>
            </div>
          </div>

          <div className="surface-card p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Task Completion
            </h3>
            <ProgressBar
              value={c.taskCount > 0 ? Math.round((c.tasksCompleted / c.taskCount) * 100) : 0}
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
                  ${totalCosts.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--text-secondary)]">Entries</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  {costs.length}
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

function ResourcesTab({ resources, onAddResource }: { resources: CaseResource[]; onAddResource: () => void }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Assigned Resources ({resources.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={onAddResource}>
          <Plus size={13} />
          Add Resource
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">No resources assigned yet</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
              Assign team members and investigators to this case
            </p>
          </div>
        ) : (
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
              {resources.map((r) => {
                const totalCost = (r.hourlyRate ?? 0) * r.hoursLogged;
                return (
                  <tr key={r.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <Td>
                      <span className="font-medium">{r.name}</span>
                    </Td>
                    <Td>
                      <span className="text-[12px] text-[var(--text-secondary)]">{r.alias || "—"}</span>
                    </Td>
                    <Td>
                      <span className="capitalize text-[12px]">{r.role.replace(/_/g, " ")}</span>
                    </Td>
                    <Td>
                      {r.hourlyRate != null ? `$${r.hourlyRate.toFixed(2)}` : "—"}
                    </Td>
                    <Td>{r.hoursLogged.toFixed(1)}</Td>
                    <Td>
                      <span className="font-medium">${totalCost.toFixed(2)}</span>
                    </Td>
                    <Td>
                      <StatusBadge status={r.status} dot />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================
   3. RELATED RECORDS TAB
   ================================================================ */

function RelatedRecordsTab({ relatedRecords, onLinkRecord }: { relatedRecords: CaseRelatedRecord[]; onLinkRecord: () => void }) {
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
        {relatedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Link2 size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">No linked records</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Link incidents, dispatches, or other records to this case</p>
          </div>
        ) : (
          <>
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Record ID</Th>
                  <Th>Type</Th>
                  <Th>Relationship</Th>
                  <Th>Linked By</Th>
                  <Th>Linked At</Th>
                  <Th className="w-10">{""}</Th>
                </tr>
              </thead>
              <tbody>
                {relatedRecords.map((r) => {
                  const tc = typeConfig[r.relatedRecordType] ?? { icon: FileText, tone: "info" as const, label: r.relatedRecordType };
                  const TypeIcon = tc.icon;
                  return (
                    <tr key={r.id} className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
                      <Td>
                        <span className="font-mono text-[12px] text-[var(--action-primary)]">{r.relatedRecordId.slice(0, 8)}</span>
                      </Td>
                      <Td>
                        <Badge tone={tc.tone}>
                          <TypeIcon size={10} />
                          {tc.label}
                        </Badge>
                      </Td>
                      <Td>{r.relationshipDescription || "—"}</Td>
                      <Td><span className="text-[12px] text-[var(--text-secondary)]">{r.linkedByName || "—"}</span></Td>
                      <Td><span className="text-[12px] text-[var(--text-secondary)]">{formatDateTime(r.linkedAt)}</span></Td>
                      <Td>
                        <ChevronRight size={13} className="text-[var(--text-tertiary)]" />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrapper>
            <div className="px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
              {relatedRecords.length} linked records
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================
   4. EVIDENCE TAB
   ================================================================ */

function EvidenceTab({ evidence, onAddEvidence, onTransferCustody }: { evidence: CaseEvidenceItem[]; onAddEvidence: () => void; onTransferCustody: () => void }) {
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
        {evidence.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">No evidence logged</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Log physical or digital evidence items for this case</p>
          </div>
        ) : (
          <>
            <TableWrapper>
              <thead>
                <tr>
                  <Th>Item #</Th>
                  <Th>Type</Th>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Storage</Th>
                  <Th>Logged By</Th>
                  <Th>Collected</Th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((ev) => {
                  const tc = typeConfig[ev.type] ?? { icon: Package, tone: "default" as const };
                  const EvIcon = tc.icon;
                  return (
                    <tr key={ev.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <Td>
                        <span className="font-mono text-[12px]">{ev.itemNumber || "—"}</span>
                      </Td>
                      <Td>
                        <Badge tone={tc.tone}>
                          <EvIcon size={10} />
                          {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="max-w-[240px] truncate block">{ev.title}</span>
                        {ev.description && <span className="text-[11px] text-[var(--text-tertiary)] block truncate max-w-[240px]">{ev.description}</span>}
                      </Td>
                      <Td><StatusBadge status={ev.status} /></Td>
                      <Td>
                        <span className="text-[12px] text-[var(--text-secondary)]">{ev.storageLocation || "—"}</span>
                      </Td>
                      <Td><span className="text-[12px] text-[var(--text-secondary)]">{ev.createdByName || "—"}</span></Td>
                      <Td>
                        <span className="text-[12px] text-[var(--text-secondary)]">{formatDateTime(ev.createdAt)}</span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrapper>
            <div className="px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
              {evidence.length} evidence items
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================
   5. TASKS TAB
   ================================================================ */

function TasksTab({ tasks, onAddTask }: { tasks: CaseTask[]; onAddTask: () => void }) {
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const overallPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const highPriorityCount = tasks.filter((t) => t.priority === "critical" || t.priority === "high").length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard icon={ListChecks} label="Overall Completion" value={`${overallPercent}%`} />
        <MetricCard icon={Timer} label="Total Tasks" value={tasks.length} sub={`${completedCount} completed`} />
        <MetricCard icon={Flag} label="High Priority" value={highPriorityCount} sub={`of ${tasks.length} total`} />
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
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListChecks size={32} className="text-[var(--text-tertiary)] mb-3" />
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">No tasks created</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Create tasks to track investigation activities</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-default)]">
              {tasks.map((task) => (
                <div key={task.id} className="px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={task.priority as "critical" | "high" | "medium" | "low" | "none"} />
                        {task.status === "done" && (
                          <Badge tone="success">
                            <CheckCircle2 size={9} />
                            Complete
                          </Badge>
                        )}
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{task.title}</p>
                      {task.description && (
                        <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate max-w-lg">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-[12px] text-[var(--text-tertiary)]">
                        {task.assignedToName && (
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {task.assignedToName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            Due: {formatDateTime(task.dueDate)}
                          </span>
                        )}
                        {task.completedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Completed: {formatDateTime(task.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================
   6. NARRATIVES TAB
   ================================================================ */

function NarrativesTab({ narratives, onAddNarrative }: { narratives: CaseNarrativeItem[]; onAddNarrative: () => void }) {
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
        {narratives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <StickyNote size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">No narratives written</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Document investigation findings and observations</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border-default)]">
              {narratives.map((n) => (
                <div key={n.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 shrink-0 rounded-full self-stretch"
                      style={{ backgroundColor: "#bfdbfe" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{n.title}</span>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                          <span>{n.authorName || "Unknown"}</span>
                          <span>{formatDateTime(n.createdAt)}</span>
                        </div>
                      </div>
                      <div
                        className="rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-primary)] leading-relaxed"
                        style={{ backgroundColor: "#eff6ff", borderLeft: "3px solid #bfdbfe" }}
                      >
                        {n.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
              {narratives.length} narratives
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================
   7. FINANCIAL TAB
   ================================================================ */

function FinancialTab({ costs, onAddEntry }: { costs: CaseCostEntry[]; onAddEntry: () => void }) {
  const totalAmount = costs.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard icon={DollarSign} label="Total Costs" value={`$${totalAmount.toLocaleString()}`} sub={`${costs.length} entries`} />
        <MetricCard icon={BarChart3} label="Entries" value={costs.length} />
        <MetricCard icon={TrendingUp} label="Avg per Entry" value={costs.length > 0 ? `$${Math.round(totalAmount / costs.length).toLocaleString()}` : "$0"} />
      </div>

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
          {costs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign size={32} className="text-[var(--text-tertiary)] mb-3" />
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">No financial entries</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Track costs, recoveries, and other financial data</p>
            </div>
          ) : (
            <>
              <TableWrapper>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Description</Th>
                    <Th>Vendor</Th>
                    <Th>Logged By</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <Td><span className="text-[12px] text-[var(--text-secondary)]">{formatDateTime(entry.createdAt)}</span></Td>
                      <Td>
                        <Badge tone="default">{entry.costType}</Badge>
                      </Td>
                      <Td>{entry.description}</Td>
                      <Td><span className="text-[12px] text-[var(--text-secondary)]">{entry.vendor || "—"}</span></Td>
                      <Td><span className="text-[12px] text-[var(--text-secondary)]">{entry.createdByName || "—"}</span></Td>
                      <Td className="text-right">
                        <span className="font-medium text-[var(--text-primary)]">
                          ${entry.amount.toLocaleString()}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
              <div className="px-4 py-3 border-t border-[var(--border-default)] flex justify-between text-[12px] text-[var(--text-secondary)]">
                <span>{costs.length} entries</span>
                <span>Total: <span className="font-medium text-[var(--text-primary)]">${totalAmount.toLocaleString()}</span></span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================
   8. OUTCOME TAB
   ================================================================ */

function OutcomeTab({ onDocumentOutcome }: { onDocumentOutcome: () => void }) {
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
            </FieldRow>
            <FieldRow label="Classification" value="—" />
            <div className="sm:col-span-2">
              <FieldRow label="Formal Notes" value="No outcome notes documented yet." />
            </div>
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
                Outcome pending
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

function AuditLogTab({ auditLog }: { auditLog: CaseAuditEntry[] }) {
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
        {auditLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History size={32} className="text-[var(--text-tertiary)] mb-3" />
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">No audit entries</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Activity will be logged here automatically</p>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[29px] top-4 bottom-4 w-px bg-[var(--border-default)]" />

              <div className="divide-y divide-[var(--border-default)]">
                {auditLog.map((entry) => {
                  const iconMap: Record<string, typeof Clock> = {
                    created: Plus,
                    updated: Edit,
                    assigned: Users,
                    advanced: ChevronRight,
                    evidence_added: Package,
                    linked: Link2,
                    completed: CheckCircle2,
                    narrative_added: StickyNote,
                    viewed: Eye,
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
                            {entry.actorName && (
                              <span className="text-[12px] text-[var(--text-tertiary)]">
                                by {entry.actorName}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap flex items-center gap-1">
                            <Clock size={10} />
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                        {entry.details && (
                          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{entry.details}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-secondary)]">
              {auditLog.length} audit entries
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
