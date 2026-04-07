"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MoreHorizontal,
  Building2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateContactModal } from "@/components/modals/contacts";
import { fetchContacts, type ContactRow } from "@/lib/queries/contacts";
import { useToast } from "@/components/ui/Toast";
import { Loader2, AlertCircle } from "lucide-react";

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

const CATEGORY_FILTERS: { value: ContactCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vendor", label: "Vendor" },
  { value: "law_enforcement", label: "Law Enforcement" },
  { value: "emergency_services", label: "Emergency" },
  { value: "media", label: "Media" },
  { value: "other", label: "Other" },
];

/* ── Contact interface for display ── */
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  organization: string;
  category: ContactCategory;
  phone: string;
  email: string;
  title: string;
}

export default function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContacts();
      setContacts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = useMemo(() => {
    const mapped: Contact[] = contacts.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      organization: c.organization,
      category: (c.category || "other") as ContactCategory,
      phone: c.phone || "",
      email: c.email || "",
      title: c.title || "",
    }));
    return mapped.filter((c) => {
      const matchesSearch =
        !search ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        c.organization.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={24} className="text-[var(--status-critical)]" />
        <p className="text-[13px] text-[var(--text-tertiary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={loadContacts}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Contacts
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
            Contact directory and management
          </p>
        </div>
        <Button variant="default" size="md" onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          Add Contact
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, organization, or email..."
          className="w-full h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--border-focused)] hover:border-[var(--border-hover)]"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {CATEGORY_FILTERS.map((f) => {
          const isActive = categoryFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[var(--action-primary)] text-white border-[var(--action-primary)]"
                  : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-[12px] text-[var(--text-tertiary)]">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden sm:table-cell">
                Organization
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">
                Phone
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden lg:table-cell">
                Email
              </th>
              <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => {
              const cfg = CATEGORY_CONFIG[contact.category];
              return (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="contents"
                >
                  <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                          <User size={14} className="text-[var(--text-tertiary)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-[11px] text-[var(--text-tertiary)] truncate sm:hidden">
                            {contact.organization}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={10} className="text-[var(--text-tertiary)]" />
                        {contact.organization}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={cfg.tone} dot>
                        {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] hidden md:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Phone size={10} className="text-[var(--text-tertiary)]" />
                        {contact.phone}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={10} className="text-[var(--text-tertiary)]" />
                        {contact.email}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                </Link>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-[13px] text-[var(--text-tertiary)]">
            No contacts match your search or filter.
          </p>
        </div>
      )}

      {/* ── Modals ── */}
      <CreateContactModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          toast("Contact created", { variant: "success" });
          setCreateOpen(false);
          loadContacts();
        }}
      />
    </div>
  );
}
