import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { previewPatrons } from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import type { PatronListRow } from "@/lib/queries/secondary-modules";
import { getSupabase } from "@/lib/supabase";

export interface PatronDetail {
  createdAt: string;
  dob: string | null;
  email: string | null;
  firstName: string;
  flag: string;
  id: string;
  idNumber: string | null;
  idType: string | null;
  lastName: string;
  notes: string | null;
  orgId: string;
  phone: string | null;
  photoUrl: string | null;
  ticketType: string | null;
  updatedAt: string;
}

export interface CreatePatronInput {
  dob?: string;
  email?: string;
  firstName: string;
  flag?: string;
  idNumber?: string;
  idType?: string;
  lastName: string;
  notes?: string;
  phone?: string;
  ticketType?: string;
}

export interface UpdatePatronInput extends CreatePatronInput {}

function mapPreviewDetail(id: string): PatronDetail {
  const match = previewPatrons.find((row) => row.id === id) ?? previewPatrons[0];

  return {
    createdAt: match?.createdAt ?? new Date().toISOString(),
    dob: null,
    email: match?.email ?? null,
    firstName: match?.firstName ?? "Preview",
    flag: match?.flag ?? "none",
    id: match?.id ?? id,
    idNumber: null,
    idType: null,
    lastName: match?.lastName ?? "Patron",
    notes: match?.notes ?? null,
    orgId: "preview-org",
    phone: match?.phone ?? null,
    photoUrl: null,
    ticketType: null,
    updatedAt: new Date().toISOString(),
  };
}

function toPatronRow(detail: PatronDetail): PatronListRow {
  return {
    createdAt: detail.createdAt,
    email: detail.email,
    firstName: detail.firstName,
    flag: detail.flag,
    id: detail.id,
    lastName: detail.lastName,
    notes: detail.notes,
    phone: detail.phone,
  };
}

function upsertPatronRow(rows: PatronListRow[], nextRow: PatronListRow) {
  const filtered = rows.filter((row) => row.id !== nextRow.id);
  return [nextRow, ...filtered];
}

async function fetchPatronById(
  orgId: string,
  id: string
): Promise<PatronDetail> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("patrons")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return {
    createdAt: data.created_at,
    dob: data.dob ?? null,
    email: data.email ?? null,
    firstName: data.first_name,
    flag: data.flag,
    id: data.id,
    idNumber: data.id_number ?? null,
    idType: data.id_type ?? null,
    lastName: data.last_name,
    notes: data.notes ?? null,
    orgId: data.org_id,
    phone: data.phone ?? null,
    photoUrl: data.photo_url ?? null,
    ticketType: data.ticket_type ?? null,
    updatedAt: data.updated_at,
  };
}

async function createPatronRecord(
  input: CreatePatronInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("patrons")
    .insert({
      dob: input.dob || null,
      email: input.email || null,
      first_name: input.firstName,
      flag: input.flag || "none",
      id_number: input.idNumber || null,
      id_type: input.idType || null,
      last_name: input.lastName,
      notes: input.notes || null,
      org_id: session.orgId,
      phone: input.phone || null,
      ticket_type: input.ticketType || null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return fetchPatronById(session.orgId, data.id);
}

async function updatePatronRecord(
  id: string,
  input: UpdatePatronInput,
  session: { orgId: string }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("patrons")
    .update({
      dob: input.dob ?? null,
      email: input.email ?? null,
      first_name: input.firstName,
      id_number: input.idNumber ?? null,
      id_type: input.idType ?? null,
      last_name: input.lastName,
      notes: input.notes ?? null,
      phone: input.phone ?? null,
      ticket_type: input.ticketType ?? null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchPatronById(session.orgId, id);
}

async function updatePatronFlagRecord(
  id: string,
  flag: string,
  session: { orgId: string },
  notes?: string
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("patrons")
    .update({
      flag,
      ...(notes !== undefined ? { notes } : {}),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  return fetchPatronById(session.orgId, id);
}

async function deletePatronRecord(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("patrons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function usePatronDetail(id: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = ["patrons", "detail", id, orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId || !id ? null : `patrons:detail:${orgId}:${id}`;

  useHydrateQueryFromCache<PatronDetail>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId) && Boolean(id)
  );

  return useQuery<PatronDetail>({
    enabled: canAccessProtected && Boolean(id) && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(mapPreviewDetail(id))
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => fetchPatronById(orgId!, id),
            ttlMs: 10 * 60 * 1000,
          }),
    queryKey,
  });
}

export function useCreatePatronMutation() {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: CreatePatronInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(`preview-patron-${Date.now()}`),
          dob: input.dob ?? null,
          email: input.email ?? null,
          firstName: input.firstName,
          flag: input.flag ?? "none",
          idNumber: input.idNumber ?? null,
          idType: input.idType ?? null,
          lastName: input.lastName,
          notes: input.notes ?? null,
          phone: input.phone ?? null,
          ticketType: input.ticketType ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies PatronDetail;
      }

      return createPatronRecord(input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["patrons", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<PatronListRow[]>(
          ["patrons", "list", "preview"],
          (current) => upsertPatronRow(current ?? [], toPatronRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["patrons"] });
    },
  });
}

export function useUpdatePatronMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async (input: UpdatePatronInput) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          dob: input.dob ?? null,
          email: input.email ?? null,
          firstName: input.firstName,
          idNumber: input.idNumber ?? null,
          idType: input.idType ?? null,
          lastName: input.lastName,
          notes: input.notes ?? null,
          phone: input.phone ?? null,
          ticketType: input.ticketType ?? null,
          updatedAt: new Date().toISOString(),
        } satisfies PatronDetail;
      }

      return updatePatronRecord(id, input, { orgId });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["patrons", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<PatronListRow[]>(
          ["patrons", "list", "preview"],
          (current) => upsertPatronRow(current ?? [], toPatronRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["patrons"] });
    },
  });
}

export function useUpdatePatronFlagMutation(id: string) {
  const queryClient = useQueryClient();
  const { orgId, usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async ({
      flag,
      notes,
    }: {
      flag: string;
      notes?: string;
    }) => {
      if (usePreviewData || !orgId) {
        return {
          ...mapPreviewDetail(id),
          flag,
          notes: notes ?? mapPreviewDetail(id).notes,
          updatedAt: new Date().toISOString(),
        } satisfies PatronDetail;
      }

      return updatePatronFlagRecord(id, flag, { orgId }, notes);
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(
        ["patrons", "detail", detail.id, usePreviewData ? "preview" : detail.orgId],
        detail
      );

      if (usePreviewData) {
        queryClient.setQueryData<PatronListRow[]>(
          ["patrons", "list", "preview"],
          (current) => upsertPatronRow(current ?? [], toPatronRow(detail))
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["patrons"] });
    },
  });
}

export function useDeletePatronMutation(id: string) {
  const queryClient = useQueryClient();
  const { usePreviewData } = useSessionContext();

  return useMutation({
    mutationFn: async () => {
      if (usePreviewData) {
        return;
      }

      await deletePatronRecord(id);
    },
    onSuccess: async () => {
      if (usePreviewData) {
        queryClient.setQueryData<PatronListRow[]>(
          ["patrons", "list", "preview"],
          (current) => (current ?? []).filter((row) => row.id !== id)
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["patrons"] });
    },
  });
}
