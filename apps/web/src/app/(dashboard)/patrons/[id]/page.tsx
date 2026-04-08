"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  ChevronDown,
  Lock,
  MapPin,
  Calendar,
  User,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchPatronById, updatePatron, updatePatronFlag, deletePatron, type PatronDetail as PatronDetailType } from "@/lib/queries/patrons";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToast } from "@/components/ui/Toast";

const EditPatronModal = dynamic(() => import("@/components/modals/patrons/EditPatronModal").then(m => ({ default: m.EditPatronModal })), { ssr: false });
const PatronFlagModal = dynamic(() => import("@/components/modals/patrons/PatronFlagModal").then(m => ({ default: m.PatronFlagModal })), { ssr: false });
const PatronBanModal = dynamic(() => import("@/components/modals/patrons/PatronBanModal").then(m => ({ default: m.PatronBanModal })), { ssr: false });
const PatronNoteModal = dynamic(() => import("@/components/modals/patrons/PatronNoteModal").then(m => ({ default: m.PatronNoteModal })), { ssr: false });
const DeletePatronModal = dynamic(() => import("@/components/modals/patrons/DeletePatronModal").then(m => ({ default: m.DeletePatronModal })), { ssr: false });

/* ── Flag config ── */
type PatronFlag = "banned" | "watch" | "vip" | "warning" | "none";

const FLAG_CONFIG: Record<
  PatronFlag,
  { label: string; tone: "critical" | "attention" | "info" | "warning" | "default"; color: string }
> = {
  banned: { label: "Banned", tone: "critical", color: "#dc2626" },
  watch: { label: "Watch", tone: "attention", color: "#ca8a04" },
  vip: { label: "VIP", tone: "info", color: "#2563eb" },
  warning: { label: "Warning", tone: "warning", color: "#d97706" },
  none: { label: "None", tone: "default", color: "#6b7280" },
};

/* ── Local PatronDetail shape (mapped from Supabase data) ── */

/* ── Entry & Incident types ── */
interface EntryRecord {
  dateTime: string;
  gate: string;
  method: string;
  outcome: string;
  officer: string;
}

/* ── Incident link type ── */
interface IncidentLink {
  id?: string;
  number: string;
  type: string;
  date: string;
  status: string;
}

/* Mock data removed — entries and incidents now fetched from Supabase */

/* ── Tab config ── */
const TAB_LIST = [
  { id: "overview", label: "Overview" },
  { id: "entries", label: "Entry History" },
  { id: "incidents", label: "Incidents" },
  { id: "notes", label: "Secure Notes" },
];

/* ── Avatar ── */
function Avatar({ firstName, lastName, color, size = 64 }: { firstName: string; lastName: string; color: string; size?: number }) {
  const initials = `${firstName[0]}${lastName[0]}`;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.28 }}
    >
      {initials}
    </div>
  );
}

/* ── Field helper ── */
function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
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

/* ── Outcome badge helper ── */
function OutcomeBadge({ outcome }: { outcome: string }) {
  const toneMap: Record<string, "success" | "critical" | "warning" | "default"> = {
    Allowed: "success",
    Denied: "critical",
    Flagged: "warning",
  };
  return <Badge tone={toneMap[outcome] ?? "default"}>{outcome}</Badge>;
}

export default function PatronDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [patronData, setPatronData] = useState<PatronDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [linkedIncidents, setLinkedIncidents] = useState<IncidentLink[]>([]);

  const loadPatron = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPatronById(id);
      setPatronData(data);

      // Fetch patron entries from patron_entries table
      const supabase = getSupabaseBrowser();
      const { data: entryData } = await supabase
        .from("patron_entries")
        .select("id, entry_type, entry_time, notes, location:locations(name)")
        .eq("patron_id", id)
        .order("entry_time", { ascending: false })
        .limit(50);

      if (entryData) {
        setEntries(
          entryData.map((e: any) => ({
            dateTime: new Date(e.entry_time).toLocaleString("en-US", {
              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
            }),
            gate: e.location?.name ?? "-",
            method: e.entry_type ?? "encounter",
            outcome: e.entry_type === "entry" ? "Allowed" : e.entry_type === "exit" ? "Exit" : "Encounter",
            officer: "-",
          }))
        );
      }

      // Fetch linked incidents via incident_participants (person_id references patron)
      const { data: incData } = await supabase
        .from("incident_participants")
        .select("incident:incidents(id, record_number, incident_type, status, created_at)")
        .eq("person_id", id);

      if (incData) {
        setLinkedIncidents(
          incData
            .filter((r: any) => r.incident)
            .map((r: any) => ({
              id: r.incident.id,
              number: r.incident.record_number ?? "-",
              type: r.incident.incident_type ?? "-",
              date: r.incident.created_at
                ? new Date(r.incident.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "-",
              status: r.incident.status ?? "open",
            }))
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to load patron");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatron();
  }, [loadPatron]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error || !patronData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={24} className="text-[var(--status-critical)]" />
        <p className="text-[13px] text-[var(--text-tertiary)]">{error || "Patron not found"}</p>
        <Link href="/patrons"><Button variant="outline" size="sm">Back to Patrons</Button></Link>
      </div>
    );
  }

  // Map real data to the shape the existing UI expects
  const patron = {
    id: patronData.id,
    firstName: patronData.firstName,
    lastName: patronData.lastName,
    dob: patronData.dob || "",
    gender: "",
    phone: patronData.phone || "",
    email: patronData.email || "",
    height: "", hair: "", eyes: "", build: "", distinguishing: "",
    idType: patronData.idType || "",
    idNumber: patronData.idNumber || "",
    idState: "",
    idVerified: false,
    flag: (patronData.flag || "none") as PatronFlag,
    flagReason: patronData.notes || "",
    flagSetBy: "",
    flagDate: "",
    flagExpiry: "",
  };

  const cfg = FLAG_CONFIG[patron.flag];
  // entries and linkedIncidents are now fetched from Supabase in loadPatron

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patrons">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <Avatar firstName={patron.firstName} lastName={patron.lastName} color={cfg.color} size={64} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {patron.firstName} {patron.lastName}
              </h1>
              <Badge tone={cfg.tone} dot>
                {cfg.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
              Patron ID: P-{id.padStart(4, "0")}
            </p>
          </div>
        </div>

        <Button variant="outline" size="md" onClick={() => setShowFlagModal(true)}>
          <Shield size={14} />
          Change Flag
          <ChevronDown size={12} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={TAB_LIST} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Personal Info */}
          <div className="surface-card p-5">
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
              <User size={14} className="text-[var(--text-tertiary)]" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <Field label="Full Name" value={`${patron.firstName} ${patron.lastName}`} />
              <Field label="Date of Birth" value={patron.dob} />
              <Field label="Gender" value={patron.gender} />
              <Field label="Phone" value={patron.phone} />
              <Field label="Email" value={patron.email} />
            </div>
          </div>

          {/* Physical Description */}
          <div className="surface-card p-5">
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
              Physical Description
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <Field label="Height" value={patron.height} />
              <Field label="Hair Color" value={patron.hair} />
              <Field label="Eye Color" value={patron.eyes} />
              <Field label="Build" value={patron.build} />
              <div className="sm:col-span-2">
                <Field label="Distinguishing Marks" value={patron.distinguishing} />
              </div>
            </div>
          </div>

          {/* ID Information */}
          <div className="surface-card p-5">
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
              ID Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <Field label="ID Type" value={patron.idType} />
              <Field label="ID Number" value={patron.idNumber} />
              <Field label="Issuing State" value={patron.idState} />
              <Field label="Verified">
                <Badge tone={patron.idVerified ? "success" : "critical"} dot>
                  {patron.idVerified ? "Verified" : "Not Verified"}
                </Badge>
              </Field>
            </div>
          </div>

          {/* Flag Details */}
          <div className="surface-card p-5">
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
              <Shield size={14} className="text-[var(--text-tertiary)]" />
              Flag Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <Field label="Current Flag">
                <Badge tone={cfg.tone} dot>{cfg.label}</Badge>
              </Field>
              <Field label="Reason" value={patron.flagReason || "No flag set"} />
              <Field label="Set By" value={patron.flagSetBy} />
              <Field label="Date Set" value={patron.flagDate} />
              <Field label="Expiry" value={patron.flagExpiry} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "entries" && (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Date/Time</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Gate</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Outcome</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">Officer</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={i} className="border-b border-[var(--border-default)] last:border-0">
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={10} className="text-[var(--text-tertiary)]" />
                      {entry.dateTime}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={10} className="text-[var(--text-tertiary)]" />
                      {entry.gate}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)] hidden sm:table-cell">{entry.method}</td>
                  <td className="px-4 py-2.5"><OutcomeBadge outcome={entry.outcome} /></td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)] hidden md:table-cell">{entry.officer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "incidents" && (
        <div>
          {linkedIncidents.length > 0 ? (
            <div className="space-y-2">
              {linkedIncidents.map((inc) => (
                <Link key={inc.id || inc.number} href={`/incidents/${inc.id}`}>
                  <div className="surface-card p-4 flex items-center justify-between hover:border-[var(--border-hover)] transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center">
                        <FileText size={14} className="text-[var(--text-tertiary)]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--text-primary)]">{inc.number}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{inc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-[var(--text-tertiary)]">{inc.date}</span>
                      <StatusBadge status={inc.status} dot />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="surface-card p-8 text-center">
              <FileText size={24} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p className="text-[13px] text-[var(--text-tertiary)]">No linked incidents</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="surface-card p-8 text-center">
          <Lock size={28} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">Secure Notes</p>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Manager access required to view secure notes for this patron.
          </p>
          <Button variant="outline" size="md" className="mt-4" disabled>
            <Lock size={12} />
            Request Access
          </Button>
        </div>
      )}

      {/* ── Modals ── */}
      <EditPatronModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={async (data: any) => {
          try {
            await updatePatron(id, {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              dob: data.dob,
              ticketType: data.ticketType,
              idType: data.idType,
              idNumber: data.idNumber,
            });
            toast("Patron updated", { variant: "success" });
            setShowEditModal(false);
            loadPatron();
          } catch (err: any) {
            toast(err.message || "Failed to update patron", { variant: "error" });
          }
        }}
        patron={{
          firstName: patron.firstName,
          lastName: patron.lastName,
          email: patron.email,
          phone: patron.phone,
          dob: patron.dob,
          ticketType: "",
          photoUrl: "",
          idType: patron.idType,
          idNumber: patron.idNumber,
        }}
      />
      <PatronFlagModal
        open={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        onSubmit={async (data: any) => {
          try {
            await updatePatronFlag(id, data.flag, data.reason || data.notes);
            toast("Patron flag updated", { variant: "success" });
            setShowFlagModal(false);
            loadPatron();
          } catch (err: any) {
            toast(err.message || "Failed to update flag", { variant: "error" });
          }
        }}
      />
      <PatronBanModal
        open={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={async (reason?: string) => {
          try {
            await updatePatronFlag(id, "banned" as any, reason || "Banned");
            toast("Patron banned", { variant: "success" });
            setShowBanModal(false);
            loadPatron();
          } catch (err: any) {
            toast(err.message || "Failed to ban patron", { variant: "error" });
          }
        }}
      />
      <PatronNoteModal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSubmit={async (data: any) => {
          try {
            await updatePatron(id, { notes: data.notes || data.note || data.content });
            toast("Note added", { variant: "success" });
            setShowNoteModal(false);
            loadPatron();
          } catch (err: any) {
            toast(err.message || "Failed to add note", { variant: "error" });
          }
        }}
      />
      <DeletePatronModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          try {
            await deletePatron(id);
            toast("Patron deleted", { variant: "info" });
            setShowDeleteModal(false);
            router.push("/patrons");
          } catch (err: any) {
            toast(err.message || "Failed to delete patron", { variant: "error" });
          }
        }}
      />
    </div>
  );
}
