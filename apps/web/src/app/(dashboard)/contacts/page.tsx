"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Phone,
  Mail,
  MoreHorizontal,
  Building2,
  User,
} from "lucide-react";
import { AppPage, PageSection } from "@/components/layout/AppPage";
import { IndexPageLayout } from "@/components/layout/IndexPageLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChipGroup } from "@/components/ui/FilterChipGroup";
import { IconButton } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { CreateContactModal } from "@/components/modals/contacts";
import { fetchContacts, createContact, type ContactRow } from "@/lib/queries/contacts";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
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
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ orgId: string; propertyId: string | null } | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContacts();
      setContacts(data);

      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id, property_id")
          .eq("id", user.id)
          .single();
        if (profile) setUserProfile({ orgId: profile.org_id, propertyId: profile.property_id });
      }
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
  }, [contacts, search, categoryFilter]);

  if (loading) {
    return (
      <AppPage width="full">
        <PageSection className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
        </PageSection>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage width="full">
        <PageSection className="flex flex-col items-center justify-center gap-3 py-20">
          <AlertCircle size={24} className="text-[var(--status-critical)]" />
          <p className="text-[13px] text-[var(--text-tertiary)]">{error}</p>
          <Button variant="outline" size="sm" onClick={loadContacts}>Retry</Button>
        </PageSection>
      </AppPage>
    );
  }

  return (
    <IndexPageLayout
      title="Contacts"
      subtitle="Contact directory and management."
      className="animate-fade-in"
      primaryAction={(
        <Button variant="default" size="md" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus size={14} />
          Add Contact
        </Button>
      )}
      summary={`${filtered.length} contact${filtered.length !== 1 ? "s" : ""}`}
      toolbar={(
        <>
          <div className="page-toolbar-search">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, organization, or email..."
            />
          </div>
          <FilterChipGroup
            ariaLabel="Filter contacts by category"
            options={CATEGORY_FILTERS}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </>
      )}
    >
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
                <tr
                  key={contact.id}
                  className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
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
                    <IconButton
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 rounded-lg text-[var(--text-secondary)] shadow-none"
                      label={`More actions for ${contact.firstName} ${contact.lastName}`}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <MoreHorizontal size={14} />
                    </IconButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="surface-card">
          <EmptyState
            icon={<User size={20} />}
            title="No contacts match your search"
            description="Try a broader search or clear the current category filter."
            action={{ label: "Add Contact", onClick: () => setCreateOpen(true), variant: "outline" }}
          />
        </div>
      )}

      <CreateContactModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          try {
            if (!userProfile) throw new Error("User profile not loaded");
            await createContact({
              orgId: userProfile.orgId,
              firstName: data.firstName || undefined,
              lastName: data.lastName || undefined,
              organizationName: data.organizationName || undefined,
              category: data.category,
              contactType: data.contactType,
              title: data.title || undefined,
              phone: data.phone || undefined,
              email: data.email || undefined,
              address: data.address || undefined,
            });
            toast("Contact created", { variant: "success" });
            setCreateOpen(false);
            loadContacts();
          } catch (err: any) {
            toast(err.message || "Failed to create contact", { variant: "error" });
          }
        }}
      />
    </IndexPageLayout>
  );
}
