"use client";

import { use, useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/Skeleton";
import { EditContactModal, DeleteContactModal } from "@/components/modals/contacts";
import { useRouter } from "next/navigation";
import { fetchContactById, updateContact, deleteContact, type ContactDetail } from "@/lib/queries/contacts";

/* ── Category config ── */
const CATEGORY_CONFIG: Record<
  string,
  { label: string; tone: "info" | "critical" | "warning" | "attention" | "default" }
> = {
  vendor: { label: "Vendor", tone: "info" },
  law_enforcement: { label: "Law Enforcement", tone: "critical" },
  emergency_services: { label: "Emergency Services", tone: "warning" },
  media: { label: "Media", tone: "attention" },
  other: { label: "Other", tone: "default" },
};

/* ── Field helper ── */
function Field({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
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
  const { toast } = useToast();
  const router = useRouter();

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const data = await fetchContactById(id);
      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <User size={32} className="text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-secondary)]">{error || "Contact not found"}</p>
        <Link href="/contacts">
          <Button variant="secondary" size="sm">Back to Contacts</Button>
        </Link>
      </div>
    );
  }

  const displayName = contact.contactType === "organization"
    ? contact.organizationName ?? "Unnamed Organization"
    : `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || "Unnamed Contact";

  const cfg = CATEGORY_CONFIG[contact.category] ?? { label: contact.category, tone: "default" as const };

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
            {contact.contactType === "organization" ? (
              <Building2 size={24} className="text-[var(--text-tertiary)]" />
            ) : (
              <User size={24} className="text-[var(--text-tertiary)]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {displayName}
              </h1>
              <Badge tone={cfg.tone} dot>
                {cfg.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)] flex items-center gap-1">
              {contact.organizationName && contact.contactType !== "organization" && (
                <>
                  <Building2 size={12} />
                  {contact.organizationName}
                </>
              )}
              {contact.title && <span> &middot; {contact.title}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {contact.phone && (
          <a href={`tel:${contact.phone}`}>
            <Button variant="default" size="md">
              <Phone size={14} />
              Call
            </Button>
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`}>
            <Button variant="outline" size="md">
              <Mail size={14} />
              Email
            </Button>
          </a>
        )}
        <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
          <Edit size={14} />
          Edit
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
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="text-[var(--action-primary)] hover:underline">
                {contact.email}
              </a>
            ) : (
              "-"
            )}
          </Field>
          <Field label="Phone">
            {contact.phone ? (
              <a href={`tel:${contact.phone}`} className="text-[var(--action-primary)] hover:underline">
                {contact.phone}
              </a>
            ) : (
              "-"
            )}
          </Field>
          <Field label="Secondary Phone" value={contact.secondaryPhone} />
          <Field label="Title" value={contact.title} />
          <div className="sm:col-span-2">
            <Field label="Address">
              {contact.address ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="text-[var(--text-tertiary)] shrink-0" />
                  {contact.address}
                </span>
              ) : (
                "-"
              )}
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
        onSubmit={async (data: any) => {
          try {
            await updateContact(id, {
              firstName: data.firstName,
              lastName: data.lastName,
              organizationName: data.organizationName,
              category: data.category,
              contactType: data.contactType,
              title: data.title,
              phone: data.phone,
              secondaryPhone: data.secondaryPhone,
              email: data.email,
              address: data.address,
              idType: data.idType,
              idNumber: data.idNumber,
              notes: data.notes,
            });
            toast("Contact updated successfully", { variant: "success" });
            await loadData();
          } catch (err: any) {
            toast(err.message || "Failed to update contact", { variant: "error" });
            throw err;
          }
        }}
        contact={{
          contactType: contact.contactType,
          firstName: contact.firstName ?? "",
          lastName: contact.lastName ?? "",
          organizationName: contact.organizationName ?? "",
          category: contact.category,
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          secondaryPhone: contact.secondaryPhone ?? "",
          address: contact.address ?? "",
          title: contact.title ?? "",
          idType: contact.idType ?? "",
          idNumber: contact.idNumber ?? "",
          notes: contact.notes ?? "",
        }}
      />
      <DeleteContactModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteContact(id);
            toast("Contact deleted successfully", { variant: "success" });
            setDeleteOpen(false);
            router.push("/contacts");
          } catch (err: any) {
            toast(err.message || "Failed to delete contact", { variant: "error" });
          }
        }}
      />
    </div>
  );
}
