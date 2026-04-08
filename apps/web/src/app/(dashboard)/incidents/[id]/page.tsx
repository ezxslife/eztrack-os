"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useToast } from "@/components/ui/Toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import {
  fetchIncidentById,
  fetchIncidentNarratives,
  fetchIncidentParticipants,
  fetchIncidentFinancials,
  fetchRelatedIncidents,
  fetchIncidentShares,
  fetchIncidentForms,
  fetchIncidentDocLog,
  fetchIncidentMedia,
  createIncidentNarrative,
  updateIncidentNarrative,
  addIncidentParticipant,
  createIncidentFinancial,
  createIncidentShare,
  linkRelatedIncident,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
  createIncidentMedia,
  uploadIncidentMediaFile,
  type IncidentDetail,
  type IncidentNarrative,
  type IncidentParticipant,
  type IncidentFinancial,
  type RelatedIncident,
  type IncidentShare,
  type IncidentForm,
  type IncidentDocLogEntry,
  type IncidentMediaItem,
} from "@/lib/queries/incidents";
import { createCase } from "@/lib/queries/cases";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
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

type ChecklistItem = { id: string; label: string; checked: boolean; completedBy: string | null; completedAt: string | null };







/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function IncidentDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const incidentId = params.id as string;

  // Data state — loaded from Supabase
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [narratives, setNarratives] = useState<IncidentNarrative[]>([]);
  const [participants, setParticipants] = useState<IncidentParticipant[]>([]);
  const [financials, setFinancials] = useState<IncidentFinancial[]>([]);
  const [relatedIncidents, setRelatedIncidents] = useState<RelatedIncident[]>([]);
  const [shares, setShares] = useState<IncidentShare[]>([]);
  const [forms, setForms] = useState<IncidentForm[]>([]);
  const [docLog, setDocLog] = useState<IncidentDocLogEntry[]>([]);
  const [media, setMedia] = useState<IncidentMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("report");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

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

  // Reusable data loader
  const loadIncident = async () => {
    const [inc, narr, parts, fins, related, shareData, formData, logData, mediaData] = await Promise.all([
      fetchIncidentById(incidentId),
      fetchIncidentNarratives(incidentId),
      fetchIncidentParticipants(incidentId),
      fetchIncidentFinancials(incidentId),
      fetchRelatedIncidents(incidentId).catch(() => [] as RelatedIncident[]),
      fetchIncidentShares(incidentId).catch(() => [] as IncidentShare[]),
      fetchIncidentForms(incidentId).catch(() => [] as IncidentForm[]),
      fetchIncidentDocLog(incidentId).catch(() => [] as IncidentDocLogEntry[]),
      fetchIncidentMedia(incidentId).catch(() => [] as IncidentMediaItem[]),
    ]);
    setIncident(inc);
    setNarratives(narr);
    setParticipants(parts);
    setFinancials(fins);
    setRelatedIncidents(related);
    setShares(shareData);
    setForms(formData);
    setDocLog(logData);
    setMedia(mediaData);
  };

  // Fetch all incident data from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        await loadIncident();
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
    { id: "media", label: "Media" },
    { id: "related", label: "Related", count: relatedIncidents.length },
    { id: "attached", label: "Attached Records" },
    { id: "forms", label: "Forms", count: forms.length },
    { id: "financial", label: "Savings & Losses" },
    { id: "sharing", label: "Sharing", count: shares.filter((s) => !s.isExpired).length },
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
          <MediaTab media={media} onUploadMedia={() => setMediaModal(true)} />
        )}
        {activeTab === "related" && (
          <RelatedIncidentsTab relatedIncidents={relatedIncidents} onLinkIncident={() => setLinkModal(true)} />
        )}
        {activeTab === "attached" && <AttachedRecordsTab />}
        {activeTab === "forms" && <FormsTab forms={forms} />}
        {activeTab === "financial" && (
          <SavingsLossesTab financials={financials} totalLosses={totalLosses} totalSavings={totalSavings} onAddEntry={() => setFinancialModal(true)} />
        )}
        {activeTab === "sharing" && (
          <SharingTab shares={shares} onShare={() => setShareModal(true)} />
        )}
        {activeTab === "doccontrol" && (
          <DocumentControlTab
            incident={incident}
            onTransferOwnership={() => setTransferModal(true)}
            onDeleteIncident={() => setDeleteModal(true)}
            onLockIncident={() => setLockModal(true)}
            onRiskAssessment={() => setRiskModal(true)}
          />
        )}
        {activeTab === "doclog" && <DocumentLogTab docLog={docLog} />}
      </div>

      {/* ── Modals ── */}
      <AddNarrativeModal
        open={narrativeModal}
        onClose={() => setNarrativeModal(false)}
        onSubmit={async (data) => {
          try {
            await createIncidentNarrative(incident.id, {
              title: (data as any).title || "",
              content: (data as any).content || "",
            });
            toast("Narrative added", { variant: "success" });
            setNarrativeModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to add narrative", { variant: "error" });
          }
        }}
      />
      <EditNarrativeModal
        open={editNarrativeModal.open}
        onClose={() => setEditNarrativeModal({ open: false })}
        onSubmit={async (data) => {
          try {
            if (!editNarrativeModal.data?.id) throw new Error("No narrative selected");
            await updateIncidentNarrative(editNarrativeModal.data.id, {
              title: (data as any).title || "",
              content: (data as any).content || "",
            });
            toast("Narrative updated", { variant: "success" });
            setEditNarrativeModal({ open: false });
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to update narrative", { variant: "error" });
          }
        }}
        initialTitle={editNarrativeModal.data?.title ?? ""}
        initialContent={editNarrativeModal.data?.content ?? ""}
      />
      <AddParticipantWizard
        open={participantWizard}
        onClose={() => setParticipantWizard(false)}
        onSubmit={async (data) => {
          try {
            await addIncidentParticipant(incident.id, {
              personType: (data as any).personType,
              firstName: (data as any).firstName || "",
              lastName: (data as any).lastName || "",
              phone: (data as any).phone || undefined,
              email: (data as any).email || undefined,
              primaryRole: (data as any).primaryRole,
              secondaryRole: (data as any).secondaryRole || undefined,
              description: (data as any).description || undefined,
              policeContacted: (data as any).policeContacted,
              policeResult: (data as any).policeResult || undefined,
              medicalAttention: (data as any).medicalAttention,
              medicalDetails: (data as any).medicalDetails || undefined,
            });
            toast("Participant added", { variant: "success" });
            setParticipantWizard(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to add participant", { variant: "error" });
          }
        }}
      />
      <UploadMediaModal
        open={mediaModal}
        onClose={() => setMediaModal(false)}
        onSubmit={async (data) => {
          try {
            const filePath = await uploadIncidentMediaFile(incident.id, data.file);
            const mediaType = data.file.type.startsWith("image/")
              ? "image"
              : data.file.type.startsWith("video/")
                ? "video"
                : data.file.type === "application/pdf"
                  ? "document"
                  : "file";
            await createIncidentMedia(incident.id, incident.orgId, {
              title: data.title || undefined,
              description: data.description || undefined,
              mediaType,
              fileName: data.file.name,
              filePath,
              fileSize: data.file.size,
              mimeType: data.file.type,
            });
            toast("Media uploaded", { variant: "success" });
            setMediaModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to upload media", { variant: "error" });
          }
        }}
      />
      <AddFinancialEntryModal
        open={financialModal}
        onClose={() => setFinancialModal(false)}
        onSubmit={async (data) => {
          try {
            await createIncidentFinancial(incident.id, {
              entryType: (data as any).kind || "loss",
              amount: (data as any).amount,
              description: (data as any).description || undefined,
            });
            toast("Financial entry added", { variant: "success" });
            setFinancialModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to add financial entry", { variant: "error" });
          }
        }}
      />
      <ShareIncidentModal
        open={shareModal}
        onClose={() => setShareModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            const permMap: Record<string, string> = { view: "view", contributor: "comment", co_author: "edit" };
            let expiresAt: string | null = null;
            if (d.expiry === "specific_date" && d.expiryDate) {
              expiresAt = new Date(d.expiryDate).toISOString();
            }
            await createIncidentShare(incident.id, incident.orgId, {
              sharedWithUserId: d.targetType === "user" ? d.target : null,
              sharedWithRole: d.targetType === "role" ? d.target : null,
              permissionLevel: permMap[d.permission] || "view",
              expiresAt,
            });
            toast("Incident shared", { variant: "success" });
            setShareModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to share incident", { variant: "error" });
          }
        }}
      />
      <LinkIncidentModal
        open={linkModal}
        onClose={() => setLinkModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            const relMap: Record<string, string> = { related: "related_to", parent: "precursor", child: "follow_up", duplicate: "duplicate" };
            await linkRelatedIncident(incident.id, incident.orgId, {
              relatedIncidentId: d.linkedIncidentId,
              relationshipType: relMap[d.relationship] || "related_to",
              reason: d.notes || undefined,
            });
            toast("Incident linked", { variant: "success" });
            setLinkModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to link incident", { variant: "error" });
          }
        }}
      />
      <RiskAssessmentModal
        open={riskModal}
        onClose={() => setRiskModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            const severityMap: Record<string, string> = { critical: "critical", high: "high", medium: "medium", low: "low", informational: "low" };
            await updateIncident(incident.id, {
              severity: (severityMap[d.riskLevel] || "medium") as any,
              disposition: d.notes ? `Risk assessment: ${d.notes}` : incident.disposition,
            });
            toast("Risk assessment saved", { variant: "success" });
            setRiskModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to save risk assessment", { variant: "error" });
          }
        }}
      />
      <TransferOwnershipModal
        open={transferModal}
        onClose={() => setTransferModal(false)}
        onSubmit={async (data) => {
          try {
            const d = data as any;
            // newOwner is a search string — in a real implementation this would resolve to a user ID.
            // For now, we update created_by with the value provided (expected to be a UUID in production).
            await updateIncident(incident.id, { created_by: d.newOwner });
            toast("Ownership transferred", { variant: "success" });
            setTransferModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to transfer ownership", { variant: "error" });
          }
        }}
      />
      <DeleteIncidentModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={async () => {
          try {
            await deleteIncident(incident.id);
            toast("Incident deleted", { variant: "success" });
            setDeleteModal(false);
            router.push("/incidents");
          } catch (err: any) {
            toast(err.message || "Failed to delete incident", { variant: "error" });
          }
        }}
        incidentNumber={incident.recordNumber}
      />
      <LockIncidentModal
        open={lockModal}
        onClose={() => setLockModal(false)}
        onConfirm={async () => {
          try {
            const newStatus = incident.status === "closed" ? "open" : "closed";
            await updateIncidentStatus(incident.id, newStatus as any);
            toast(`Incident ${newStatus === "closed" ? "locked" : "unlocked"}`, { variant: "success" });
            setLockModal(false);
            await loadIncident();
          } catch (err: any) {
            toast(err.message || "Failed to update lock status", { variant: "error" });
          }
        }}
        isLocked={incident.status === "closed"}
        incidentNumber={incident.recordNumber}
      />
      <EscalationChainModal
        open={escalationChainModal}
        onClose={() => setEscalationChainModal(false)}
        onSubmit={async (data) => {
          try {
            const result = await createCase({
              orgId: incident.orgId,
              propertyId: incident.propertyId,
              caseType: (data as any).targetTitle || incident.type || "general",
              synopsis: (data as any).targetSynopsis || incident.synopsis || `Escalated from incident ${incident.recordNumber}`,
              escalationLevel: (data as any).targetPriority || incident.severity || "medium",
            });
            toast(`Case ${result.record_number} created`, { variant: "success" });
            setEscalationChainModal(false);
            router.push(`/cases/${result.id}`);
          } catch (err: any) {
            toast(err.message || "Failed to create case", { variant: "error" });
          }
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
  checklist: ChecklistItem[];
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
                  {incident.creator?.fullName || "Unknown"}
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
            <LinkedRecordRow label="Related" value="View all" href="#" />
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

function MediaTab({ media, onUploadMedia }: { media: IncidentMediaItem[]; onUploadMedia: () => void }) {
  const formatFileSize = (bytes: number | null) => {
    if (bytes == null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Media ({media.length})
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

      {media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-8 w-8 mx-auto text-[var(--text-tertiary)] opacity-40 mb-3" />
            <p className="text-[13px] text-[var(--text-secondary)]">No media files yet</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
              Upload photos, videos, or documents related to this incident
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2 border-b border-[var(--border-default)]">Type</th>
                    <th className="text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2 border-b border-[var(--border-default)]">Title</th>
                    <th className="text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2 border-b border-[var(--border-default)]">Filename</th>
                    <th className="text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2 border-b border-[var(--border-default)]">Size</th>
                    <th className="text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2 border-b border-[var(--border-default)]">Uploaded By</th>
                    <th className="text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2 border-b border-[var(--border-default)]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {media.map((m) => {
                    const typeIcon = m.mediaType === "image" || m.mimeType?.startsWith("image/")
                      ? <ImageIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                      : m.mediaType === "video" || m.mimeType?.startsWith("video/")
                        ? <Video className="h-4 w-4 text-[var(--text-tertiary)]" />
                        : <File className="h-4 w-4 text-[var(--text-tertiary)]" />;
                    return (
                      <tr key={m.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-3 py-2.5 border-b border-[var(--border-default)]">{typeIcon}</td>
                        <td className="px-3 py-2.5 text-[var(--text-primary)] border-b border-[var(--border-default)] font-medium">{m.title || "—"}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)] border-b border-[var(--border-default)] font-mono text-[12px]">{m.fileName}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)] border-b border-[var(--border-default)]">{formatFileSize(m.fileSize)}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)] border-b border-[var(--border-default)]">{m.uploadedByName || "—"}</td>
                        <td className="px-3 py-2.5 text-[var(--text-tertiary)] border-b border-[var(--border-default)] text-[12px]">{formatDateTime(m.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5: RELATED INCIDENTS
   ═══════════════════════════════════════════════════════════════ */

function RelatedIncidentsTab({ relatedIncidents, onLinkIncident }: { relatedIncidents: RelatedIncident[]; onLinkIncident: () => void }) {
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Related Incidents ({relatedIncidents.length})
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

      {relatedIncidents.map((ri) => (
        <Card key={ri.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Link
                    href={`/incidents/${ri.relatedIncidentId}`}
                    className="text-[13px] font-semibold text-[var(--action-primary)] hover:underline"
                  >
                    #{ri.recordNumber}
                  </Link>
                  <StatusBadge status={ri.status} dot />
                </div>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {ri.type}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <RelationshipBadge type={ri.relationshipType} />
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    Linked by {ri.linkedBy || "Unknown"} on {formatDateTime(ri.linkedAt)}
                  </span>
                </div>
                {ri.reason && (
                  <p className="text-[12px] text-[var(--text-tertiary)] mt-2 italic">
                    &ldquo;{ri.reason}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/incidents/${ri.relatedIncidentId}`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {relatedIncidents.length === 0 && (
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
    { title: "Daily Logs", icon: <ScrollText className="h-4 w-4" /> },
    { title: "Dispatches", icon: <Paperclip className="h-4 w-4" /> },
    { title: "Cases", icon: <FileText className="h-4 w-4" /> },
    { title: "Briefings", icon: <FileText className="h-4 w-4" /> },
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
                0
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="py-4 text-center">
              <p className="text-[12px] text-[var(--text-tertiary)]">
                No {section.title.toLowerCase()} linked
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 7: FORMS
   ═══════════════════════════════════════════════════════════════ */

function FormsTab({ forms }: { forms: IncidentForm[] }) {
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Supplemental Forms ({forms.length})
        </h3>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Form
        </Button>
      </div>

      {forms.length > 0 ? (
        forms.map((form) => (
          <Card key={form.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {form.completedAt ? (
                    <CheckSquare className="h-4 w-4 text-[var(--status-success,#059669)]" />
                  ) : (
                    <ClipboardList className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">
                    {form.formType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  {form.isOfficial && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600">Official</span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {form.completedAt
                    ? `Completed ${formatDateTime(form.completedAt)} by ${form.completedByName || "Unknown"}`
                    : `Created ${formatDateTime(form.createdAt)}`}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-8 w-8 mx-auto text-[var(--text-tertiary)] opacity-40 mb-3" />
            <p className="text-[13px] text-[var(--text-secondary)]">No forms attached yet</p>
          </CardContent>
        </Card>
      )}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

function SharingTab({ shares, onShare }: { shares: IncidentShare[]; onShare: () => void }) {
  const active = shares.filter((s) => !s.isExpired);
  const expired = shares.filter((s) => s.isExpired);

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
                    {share.sharedWithRole ? (
                      <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
                    ) : (
                      <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                        {(share.sharedWithName || "?")
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
                        {share.sharedWithName}
                      </span>
                      {share.sharedWithRole && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          Role
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <PermissionBadge level={share.permissionLevel} />
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        Shared {formatDateTime(share.sharedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-tertiary)]">
                      <span>
                        Expires: {share.expiresAt ? formatDateTime(share.expiresAt) : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm">
                    Revoke
                  </Button>
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
                        {(share.sharedWithName || "?")
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[13px] text-[var(--text-secondary)]">
                        {share.sharedWithName}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <PermissionBadge level={share.permissionLevel} />
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          Expired {share.expiresAt ? formatDateTime(share.expiresAt) : ""}
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
  incident,
  onTransferOwnership,
  onDeleteIncident,
  onLockIncident,
  onRiskAssessment,
}: {
  incident: IncidentDetail;
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
            Lock Incident
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
                  {incident.creator?.fullName || "Unknown"}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Document Owner · Created {formatDateTime(incident.createdAt)}
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
            <ToggleSwitch enabled={false} />
          </div>

          {false && (
            <div className="space-y-2 pl-4 border-l-2 border-[var(--border-default)]">
              <p className="text-[12px] font-medium text-[var(--text-secondary)]">
                Authorized access:
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--text-primary)]">
                  {incident.creator?.fullName || "Unknown"} (Owner — implicit)
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
            <ToggleSwitch enabled={false} />
          </div>

          {false && (
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
            <FieldRow label="Current Status" value={<StatusBadge status={incident.status} dot />} />
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

function DocumentLogTab({ docLog }: { docLog: IncidentDocLogEntry[] }) {
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Document Log ({docLog.length} entries)
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
          {docLog.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[29px] top-4 bottom-4 w-px bg-[var(--border-default)]" />
              <div className="divide-y divide-[var(--border-subdued,var(--border-default))]">
                {docLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="relative z-10 mt-1 h-6 w-6 rounded-full bg-[var(--surface-primary)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                      <Clock className="h-3 w-3 text-[var(--text-tertiary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">
                          {entry.action}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap shrink-0">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                      <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                        by {entry.actorName || "System"}
                      </p>
                      {entry.details && (
                        <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Clock className="h-8 w-8 mx-auto text-[var(--text-tertiary)] opacity-40 mb-3" />
              <p className="text-[13px] text-[var(--text-secondary)]">No activity logged yet</p>
            </div>
          )}
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
