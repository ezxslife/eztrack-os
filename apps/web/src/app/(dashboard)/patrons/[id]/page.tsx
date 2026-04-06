"use client";

import { useState, use } from "react";
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
import dynamic from "next/dynamic";

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

/* ── Mock patron data ── */
interface PatronDetail {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  height: string;
  hair: string;
  eyes: string;
  build: string;
  distinguishing: string;
  idType: string;
  idNumber: string;
  idState: string;
  idVerified: boolean;
  flag: PatronFlag;
  flagReason: string;
  flagSetBy: string;
  flagDate: string;
  flagExpiry: string;
  photo?: string;
}

const MOCK_PATRONS: Record<string, PatronDetail> = {
  "1": {
    id: "1", firstName: "Marcus", lastName: "Johnson", dob: "1988-03-15", gender: "Male",
    phone: "(555) 234-8901", email: "m.johnson@email.com", height: "6'1\"", hair: "Black",
    eyes: "Brown", build: "Athletic", distinguishing: "Tattoo on left forearm",
    idType: "Driver's License", idNumber: "D1234567", idState: "California", idVerified: true,
    flag: "banned", flagReason: "Repeat disruptive behavior", flagSetBy: "Lt. Nguyen",
    flagDate: "Apr 3, 2026", flagExpiry: "Permanent",
  },
  "2": {
    id: "2", firstName: "Sarah", lastName: "Chen", dob: "1995-07-22", gender: "Female",
    phone: "(555) 876-5432", email: "s.chen@email.com", height: "5'4\"", hair: "Black",
    eyes: "Brown", build: "Slim", distinguishing: "None",
    idType: "Passport", idNumber: "P9876543", idState: "N/A", idVerified: true,
    flag: "vip", flagReason: "Artist performer", flagSetBy: "Event Coordinator",
    flagDate: "Apr 1, 2026", flagExpiry: "Apr 7, 2026",
  },
  "3": {
    id: "3", firstName: "Jake", lastName: "Williams", dob: "1992-11-08", gender: "Male",
    phone: "(555) 345-6789", email: "j.williams@email.com", height: "5'10\"", hair: "Brown",
    eyes: "Blue", build: "Medium", distinguishing: "Scar above right eyebrow",
    idType: "Driver's License", idNumber: "W7654321", idState: "Oregon", idVerified: true,
    flag: "watch", flagReason: "Previous noise complaint", flagSetBy: "Officer Rivera",
    flagDate: "Apr 4, 2026", flagExpiry: "Apr 6, 2026",
  },
  "4": {
    id: "4", firstName: "Maria", lastName: "Rodriguez", dob: "1985-01-30", gender: "Female",
    phone: "(555) 567-1234", email: "m.rodriguez@email.com", height: "5'6\"", hair: "Brown",
    eyes: "Brown", build: "Medium", distinguishing: "None",
    idType: "Driver's License", idNumber: "R1122334", idState: "Texas", idVerified: true,
    flag: "none", flagReason: "", flagSetBy: "-", flagDate: "-", flagExpiry: "-",
  },
  "5": {
    id: "5", firstName: "Tyler", lastName: "Brooks", dob: "1999-06-12", gender: "Male",
    phone: "(555) 432-9876", email: "t.brooks@email.com", height: "5'9\"", hair: "Blonde",
    eyes: "Green", build: "Slim", distinguishing: "Ear piercing, left",
    idType: "State ID", idNumber: "B5566778", idState: "Nevada", idVerified: false,
    flag: "warning", flagReason: "ID mismatch flagged", flagSetBy: "Officer Martinez",
    flagDate: "Apr 5, 2026", flagExpiry: "Pending review",
  },
  "6": {
    id: "6", firstName: "Aisha", lastName: "Patel", dob: "1990-09-18", gender: "Female",
    phone: "(555) 654-3210", email: "a.patel@email.com", height: "5'5\"", hair: "Black",
    eyes: "Dark Brown", build: "Slim", distinguishing: "None",
    idType: "Driver's License", idNumber: "P4455667", idState: "New York", idVerified: true,
    flag: "vip", flagReason: "Sponsor guest", flagSetBy: "Event Coordinator",
    flagDate: "Apr 2, 2026", flagExpiry: "Apr 7, 2026",
  },
  "7": {
    id: "7", firstName: "David", lastName: "Kim", dob: "1993-04-25", gender: "Male",
    phone: "(555) 789-0123", email: "d.kim@email.com", height: "5'8\"", hair: "Black",
    eyes: "Brown", build: "Medium", distinguishing: "Glasses",
    idType: "Driver's License", idNumber: "K8899001", idState: "Washington", idVerified: true,
    flag: "none", flagReason: "", flagSetBy: "-", flagDate: "-", flagExpiry: "-",
  },
  "8": {
    id: "8", firstName: "Lisa", lastName: "Thompson", dob: "1987-12-03", gender: "Female",
    phone: "(555) 210-5678", email: "l.thompson@email.com", height: "5'7\"", hair: "Red",
    eyes: "Green", build: "Medium", distinguishing: "Tattoo on right wrist",
    idType: "Driver's License", idNumber: "T3344556", idState: "Colorado", idVerified: true,
    flag: "banned", flagReason: "Drug violation, ejected", flagSetBy: "Sgt. Patel",
    flagDate: "Apr 5, 2026", flagExpiry: "Permanent",
  },
};

/* ── Mock entry history ── */
interface EntryRecord {
  dateTime: string;
  gate: string;
  method: string;
  outcome: string;
  officer: string;
}

const MOCK_ENTRIES: Record<string, EntryRecord[]> = {
  "1": [
    { dateTime: "Apr 5, 2026 8:30 AM", gate: "North Gate", method: "ID Scan", outcome: "Denied", officer: "Officer Rivera" },
    { dateTime: "Apr 4, 2026 7:15 PM", gate: "Main Gate", method: "ID Scan", outcome: "Flagged", officer: "Officer Martinez" },
    { dateTime: "Apr 4, 2026 2:00 PM", gate: "South Gate", method: "Manual", outcome: "Allowed", officer: "Sgt. Patel" },
    { dateTime: "Apr 3, 2026 6:45 PM", gate: "Main Gate", method: "ID Scan", outcome: "Allowed", officer: "Officer Davis" },
    { dateTime: "Apr 3, 2026 11:00 AM", gate: "VIP Gate", method: "ID Scan", outcome: "Denied", officer: "Lt. Nguyen" },
  ],
};

/* ── Mock incidents ── */
interface IncidentLink {
  number: string;
  type: string;
  date: string;
  status: string;
}

const MOCK_INCIDENTS: Record<string, IncidentLink[]> = {
  "1": [
    { number: "INC-0042", type: "Disturbance", date: "Apr 4, 2026", status: "closed" },
    { number: "INC-0051", type: "Trespass", date: "Apr 5, 2026", status: "open" },
  ],
  "8": [
    { number: "INC-0048", type: "Drug Violation", date: "Apr 5, 2026", status: "in_progress" },
  ],
};

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
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const patron = MOCK_PATRONS[id] ?? {
    id,
    firstName: "Unknown",
    lastName: "Patron",
    dob: "-",
    gender: "-",
    phone: "-",
    email: "-",
    height: "-",
    hair: "-",
    eyes: "-",
    build: "-",
    distinguishing: "-",
    idType: "-",
    idNumber: "-",
    idState: "-",
    idVerified: false,
    flag: "none" as PatronFlag,
    flagReason: "",
    flagSetBy: "-",
    flagDate: "-",
    flagExpiry: "-",
  };

  const cfg = FLAG_CONFIG[patron.flag];
  const entries = MOCK_ENTRIES[id] ?? [
    { dateTime: "Apr 5, 2026 10:00 AM", gate: "Main Gate", method: "ID Scan", outcome: "Allowed", officer: "Officer Rivera" },
    { dateTime: "Apr 4, 2026 3:30 PM", gate: "South Gate", method: "Manual", outcome: "Allowed", officer: "Sgt. Patel" },
    { dateTime: "Apr 3, 2026 9:00 AM", gate: "North Gate", method: "ID Scan", outcome: "Allowed", officer: "Officer Davis" },
    { dateTime: "Apr 2, 2026 5:15 PM", gate: "Main Gate", method: "ID Scan", outcome: "Allowed", officer: "Officer Martinez" },
    { dateTime: "Apr 1, 2026 11:45 AM", gate: "VIP Gate", method: "Manual", outcome: "Allowed", officer: "Lt. Nguyen" },
  ];
  const incidents = MOCK_INCIDENTS[id] ?? [];

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
          {incidents.length > 0 ? (
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div key={inc.number} className="surface-card p-4 flex items-center justify-between">
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
        onSubmit={async (data) => {
          console.log("Edit patron:", data);
          setShowEditModal(false);
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
        onSubmit={async (data) => {
          console.log("Flag patron:", data);
          setShowFlagModal(false);
        }}
      />
      <PatronBanModal
        open={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={async (reason) => {
          console.log("Ban patron:", reason);
          setShowBanModal(false);
        }}
      />
      <PatronNoteModal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSubmit={async (data) => {
          console.log("Add patron note:", data);
          setShowNoteModal(false);
        }}
      />
      <DeletePatronModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          console.log("Delete patron:", id);
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
}
