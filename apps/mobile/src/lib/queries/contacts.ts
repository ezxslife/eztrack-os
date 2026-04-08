import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { previewContacts } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import type { ContactListRow } from "@/lib/queries/secondary-modules";
import { getSupabase } from "@/lib/supabase";

export interface ContactDetail {
  address: string | null;
  category: string;
  contactType: string;
  createdAt: string;
  email: string | null;
  firstName: string | null;
  id: string;
  idNumber: string | null;
  idType: string | null;
  lastName: string | null;
  notes: string | null;
  orgId: string;
  organizationName: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  title: string | null;
  updatedAt: string;
}

export interface CreateContactInput {
  address?: string;
  category: string;
  contactType: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  phone?: string;
  title?: string;
}

export interface UpdateContactInput extends CreateContactInput {
  idNumber?: string;
  idType?: string;
  notes?: string;
  secondaryPhone?: string;
}

function mapPreviewDetail(id: string): ContactDetail {
  const match = previewContacts.find((row) => row.id === id) ?? previewContacts[0];

  return {
    address: null,
    category: match?.category ?? "other",
    contactType: match?.contactType ?? "individual",
    createdAt: new Date().toISOString(),
    email: match?.email ?? null,
    firstName: match?.firstName ?? null,
    id: match?.id ?? id,
    idNumber: null,
    idType: null,
    lastName: match?.lastName ?? null,
    notes: null,
    orgId: "preview-org",
    organizationName: match?.organization ?? null,
    phone: match?.phone ?? null,
    secondaryPhone: null,
    title: match?.title ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function toContactRow(detail: ContactDetail): ContactListRow {
  return {
    category: detail.category,
    contactType: detail.contactType,
    email: detail.email,
    firstName: detail.firstName ?? "",
    id: detail.id,
    lastName: detail.lastName ?? "",
    organization: detail.organizationName ?? "",
    phone: detail.phone,
    title: detail.title,
  };
}

function upsertContactRow(rows: ContactListRow[], nextRow: ContactListRow) {
  const filtered = rows.filter((row) => row.id !== nextRow.id);
  return [nextRow, ...filtered];
}

async function fetchContactById(
  orgId: string,
  id: string
): Promise<ContactDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    address: data.address ?? null,
    category: data.category,
    contactType: data.contact_type,
    createdAt: data.created_at,
    email: data.email ?? null,
    firstName: data.first_name ?? null,
    id: data.id,
    idNumber: data.id_number ?? null,
    idType: data.id_type ?? null,
    lastName: data.last_name ?? null,
    notes: data.notes ?? null,
    orgId: data.org_id,
    organizationName: data.organization_name ?? null,
    phone: data.phone ?? null,
    secondaryPhone: data.secondary_phone ?? null,
    title: data.title ?? null,
    updatedAt: data.updated_at,
  };
}

async function createContactRecord(
  input: CreateContactInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      address: input.address || null,
      category: input.category,
      contact_type: input.contactType,
      email: input.email || null,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      org_id: session.orgId,
      organization_name: input.organizationName || null,
      phone: input.phone || null,
      title: input.title || null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return fetchContactById(session.orgId, data.id);
}

async function updateContactRecord(
  id: string,
  input: UpdateContactInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("contacts")
    .update({
      address: input.address ?? null,
      category: input.category,
      contact_type: input.contactType,
      email: input.email ?? null,
      first_name: input.firstName ?? null,
      id_number: input.idNumber ?? null,
      id_type: input.idType ?? null,
      last_name: input.lastName ?? null,
      notes: input.notes ?? null,
      organization_name: input.organizationName ?? null,
      phone: input.phone ?? null,
      secondary_phone: input.secondaryPhone ?? null,
      title: input.title ?? null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchContactById(session.orgId, id);
}

async function deleteContactRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useContactDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["contacts", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `contacts:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<ContactDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery<ContactDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(mapPreviewDetail(id))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchContactById(orgId!, id),
            ttlMs: 10 * 60 * 1000,
          }),
    queryKey,
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(`preview-contact-${Date.now()}`),
          address: input.address ?? null,
          category: input.category,
          contactType: input.contactType,
          email: input.email ?? null,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          organizationName: input.organizationName ?? null,
          phone: input.phone ?? null,
          title: input.title ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies ContactDetail;
      }

      return createContactRecord(input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["contacts", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<ContactListRow[]>(
          ["contacts", "list", "preview"],
          (current) => upsertContactRow(current ?? [], toContactRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContactMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          address: input.address ?? null,
          category: input.category,
          contactType: input.contactType,
          email: input.email ?? null,
          firstName: input.firstName ?? null,
          idNumber: input.idNumber ?? null,
          idType: input.idType ?? null,
          lastName: input.lastName ?? null,
          notes: input.notes ?? null,
          organizationName: input.organizationName ?? null,
          phone: input.phone ?? null,
          secondaryPhone: input.secondaryPhone ?? null,
          title: input.title ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies ContactDetail;
      }

      return updateContactRecord(id, input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["contacts", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<ContactListRow[]>(
          ["contacts", "list", "preview"],
          (current) => upsertContactRow(current ?? [], toContactRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContactMutation(id: string) {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async () => {
      if (usePreviewData) {
        return;
      }

      await deleteContactRecord(id);
    },
    onSuccess: async () => {
      if (usePreviewData) {
        queryClient.setQueryData<ContactListRow[]>(
          ["contacts", "list", "preview"],
          (current) => (current ?? []).filter((row) => row.id !== id)
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
