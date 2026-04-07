"use client";

import { use, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Edit,
  LinkIcon,
  User,
  Building2,
  FileText,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EditContactModal, DeleteContactModal } from "@/components/modals/contacts";

/* ── Category config ── */
type ContactCategory = "vendor" | "law_enforcement" | "emergency_services" | "media" | "other";

const CATEGORY_CONFIG: Record<
  ContactCategory,
  { label: string; tone: "info" | "critical" | "warning" | "attention" | "default" }
> = {
  vendor: { label: "Vendor", tone: "info" },
  law_enforcement: { label: "Law Enforcement", tone: "critical" },
  emergency_services: { label: "Emergency Services", tone: "warning" },
  media: { label: "Media", tone: "attention" },
  other: { label: "Other", tone: "default" },
};

/* ── Mock data ── */
interface ContactDetail {
  id: string;
  firstName: string;
  lastName: string;
  organization: string;
  category: ContactCategory;
  title: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  idType: string;
  idNumber: string;
  notes: string;
}

const MOCK_CONTACTS: Record<string, ContactDetail> = {
  "1": {
    id: "1",
    firstName: "Sgt. Carlos",
    lastName: "Rodriguez",
    organization: "Metro Police Department",
    category: "law_enforcement",
    title: "Patrol Sergeant",
    phone: "(555) 100-2000",
    secondaryPhone: "(555) 100-2001",
    email: "c.rodriguez@metropd.gov",
    address: "1200 Main Street, Metro City, CA 90001",
    idType: "Badge",
    idNumber: "MPD-4471",
    notes: "Primary law enforcement contact for all event-related incidents. Available 24/7 during event weekends. Prefers initial contact via phone for urgent matters. Has been our liaison for 3 years.",
  },
  "2": {
    id: "2",
    firstName: "Dana",
    lastName: "Mitchell",
    organization: "Apex Sound & Staging",
    category: "vendor",
    title: "Account Manager",
    phone: "(555) 234-5678",
    secondaryPhone: "",
    email: "dana@apexsound.com",
    address: "4500 Industrial Blvd, Suite 200, Metro City, CA 90015",
    idType: "Vendor ID",
    idNumber: "VND-0088",
    notes: "Manages all audio and staging equipment. Requires 48hr notice for changes.",
  },
  "3": {
    id: "3",
    firstName: "Lt. Karen",
    lastName: "Park",
    organization: "City Fire Station 7",
    category: "emergency_services",
    title: "Station Lieutenant",
    phone: "(555) 911-0007",
    secondaryPhone: "(555) 911-0008",
    email: "k.park@cityfire.gov",
    address: "700 Fire House Lane, Metro City, CA 90003",
    idType: "Badge",
    idNumber: "FD-1192",
    notes: "Fire safety lead. Conducts pre-event inspections. Must be notified of any pyrotechnic changes.",
  },
  "4": {
    id: "4",
    firstName: "Jordan",
    lastName: "Ellis",
    organization: "KXYZ News",
    category: "media",
    title: "Field Reporter",
    phone: "(555) 678-1234",
    secondaryPhone: "",
    email: "jellis@kxyz.com",
    address: "900 Broadcast Way, Metro City, CA 90010",
    idType: "Press ID",
    idNumber: "KXYZ-3345",
    notes: "Covers local events. Requires media credentials and escort in restricted areas.",
  },
  "5": {
    id: "5",
    firstName: "Rebecca",
    lastName: "Tran",
    organization: "GreenGate Fencing",
    category: "vendor",
    title: "Operations Lead",
    phone: "(555) 345-9876",
    secondaryPhone: "",
    email: "rtran@greengatefence.com",
    address: "1100 Commerce Rd, Metro City, CA 90020",
    idType: "Vendor ID",
    idNumber: "VND-0112",
    notes: "Handles perimeter fencing setup and teardown. On-site crew of 8.",
  },
  "6": {
    id: "6",
    firstName: "Mike",
    lastName: "O'Brien",
    organization: "O'Brien Towing",
    category: "other",
    title: "Owner",
    phone: "(555) 432-1111",
    secondaryPhone: "(555) 432-1112",
    email: "mike@obrientow.com",
    address: "2200 Auto Row, Metro City, CA 90025",
    idType: "Business License",
    idNumber: "BL-77890",
    notes: "Preferred towing service for unauthorized vehicles. 30-minute response time guaranteed.",
  },
};

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

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const contact = MOCK_CONTACTS[id] ?? {
    id,
    firstName: "Unknown",
    lastName: "Contact",
    organization: "Unknown Organization",
    category: "other" as ContactCategory,
    title: "-",
    phone: "-",
    secondaryPhone: "",
    email: "-",
    address: "-",
    idType: "-",
    idNumber: "-",
    notes: "",
  };

  const cfg = CATEGORY_CONFIG[contact.category];
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <div className="w-16 h-16 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
            <User size={24} className="text-[var(--text-tertiary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {contact.firstName} {contact.lastName}
              </h1>
              <Badge tone={cfg.tone} dot>
                {cfg.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)] flex items-center gap-1">
              <Building2 size={12} />
              {contact.organization}
              {contact.title && <span> &middot; {contact.title}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button variant="default" size="md">
          <Phone size={14} />
          Call
        </Button>
        <Button variant="outline" size="md">
          <Mail size={14} />
          Email
        </Button>
        <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
          <Edit size={14} />
          Edit
        </Button>
        <Button variant="outline" size="md">
          <LinkIcon size={14} />
          Link to Incident
        </Button>
        <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      {/* Contact Details */}
      <div className="surface-card p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <FileText size={14} className="text-[var(--text-tertiary)]" />
          Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <Field label="Email">
            <a href={`mailto:${contact.email}`} className="text-[var(--action-primary)] hover:underline">
              {contact.email}
            </a>
          </Field>
          <Field label="Phone">
            <a href={`tel:${contact.phone}`} className="text-[var(--action-primary)] hover:underline">
              {contact.phone}
            </a>
          </Field>
          <Field label="Secondary Phone" value={contact.secondaryPhone || "-"} />
          <Field label="Title" value={contact.title} />
          <div className="sm:col-span-2">
            <Field label="Address">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} className="text-[var(--text-tertiary)] shrink-0" />
                {contact.address}
              </span>
            </Field>
          </div>
          <Field label="ID Type" value={contact.idType} />
          <Field label="ID Number" value={contact.idNumber} />
        </div>
      </div>

      {/* Notes */}
      <div className="surface-card p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
          <StickyNote size={14} className="text-[var(--text-tertiary)]" />
          Notes
        </h3>
        {contact.notes ? (
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {contact.notes}
          </p>
        ) : (
          <p className="text-[13px] text-[var(--text-tertiary)] italic">
            No notes for this contact.
          </p>
        )}
      </div>

      {/* ── Modals ── */}
      <EditContactModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          toast("Contact updated successfully", { variant: "success" });
          setEditOpen(false);
        }}
        contact={{
          contactType: "individual",
          firstName: contact.firstName,
          lastName: contact.lastName,
          organizationName: contact.organization,
          category: contact.category,
          email: contact.email,
          phone: contact.phone,
          secondaryPhone: contact.secondaryPhone,
          address: contact.address,
          title: contact.title,
          idType: contact.idType,
          idNumber: contact.idNumber,
          notes: contact.notes,
        }}
      />
      <DeleteContactModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          toast("Contact deleted successfully", { variant: "success" });
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
