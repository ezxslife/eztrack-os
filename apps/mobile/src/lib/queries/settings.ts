import {
  mapUiRoleToStaffRole,
  type InviteUserPayload,
} from "@eztrack/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { requestServerApi } from "@/lib/server-api";
import { getSupabase } from "@/lib/supabase";

export interface OrganizationRow {
  address: string | null;
  email: string | null;
  id: string;
  logoUrl: string | null;
  name: string;
  phone: string | null;
  subscriptionTier: string | null;
  timezone: string | null;
}

export interface PropertyRow {
  address: string | null;
  id: string;
  name: string;
  orgId: string;
  propertyType: string | null;
  status: string;
}

export interface LocationRow {
  id: string;
  locationType: string | null;
  name: string;
  parentId: string | null;
  propertyId: string;
}

export interface OrgUserRow {
  email: string;
  fullName: string;
  id: string;
  lastLogin: string | null;
  role: string;
  status: string;
}

export interface DropdownValueRow {
  categoryId: string;
  displayLabel: string;
  id: string;
  sortOrder: number;
}

export interface DropdownCategoryRow {
  description: string | null;
  id: string;
  name: string;
  orgId: string;
  values: DropdownValueRow[];
}

export interface NotificationRuleRow {
  description: string | null;
  email: boolean;
  event: string;
  id: string;
  orgId: string;
  push: boolean;
  sms: boolean;
}

async function fetchOrganization(orgId: string): Promise<OrganizationRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    throw error;
  }

  return {
    address: data.address ?? null,
    email: data.email ?? null,
    id: data.id,
    logoUrl: data.logo_url ?? null,
    name: data.name ?? "",
    phone: data.phone ?? null,
    subscriptionTier: data.plan ?? null,
    timezone: data.timezone ?? null,
  };
}

async function updateOrganization(
  orgId: string,
  payload: {
    address?: string;
    email?: string;
    name?: string;
    phone?: string;
    timezone?: string;
  }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("organizations")
    .update({
      address: payload.address,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      timezone: payload.timezone,
    })
    .eq("id", orgId);

  if (error) {
    throw error;
  }
}

async function fetchProperties(orgId: string): Promise<PropertyRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    address: row.address ?? null,
    id: row.id,
    name: row.name,
    orgId: row.org_id,
    propertyType: row.property_type ?? null,
    status: row.status ?? "active",
  }));
}

async function createProperty(payload: {
  address?: string;
  name: string;
  orgId: string;
  propertyType?: string;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from("properties").insert({
    address: payload.address || null,
    name: payload.name,
    org_id: payload.orgId,
    property_type: payload.propertyType || null,
  });

  if (error) {
    throw error;
  }
}

async function updateProperty(
  id: string,
  payload: {
    address?: string;
    name?: string;
    propertyType?: string;
    status?: string;
  }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("properties")
    .update({
      address: payload.address,
      name: payload.name,
      property_type: payload.propertyType,
      status: payload.status,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function deleteProperty(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function fetchAllLocations(orgId: string): Promise<LocationRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("locations")
    .select("*, property:properties!property_id(id, org_id)")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((row: any) => row.property?.org_id === orgId)
    .map((row: any) => ({
      id: row.id,
      locationType: row.location_type ?? null,
      name: row.name,
      parentId: row.parent_id ?? null,
      propertyId: row.property_id,
    }));
}

async function createLocation(payload: {
  locationType?: string;
  name: string;
  parentId?: string;
  propertyId: string;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from("locations").insert({
    location_type: payload.locationType || null,
    name: payload.name,
    parent_id: payload.parentId || null,
    property_id: payload.propertyId,
  });

  if (error) {
    throw error;
  }
}

async function updateLocation(
  id: string,
  payload: {
    locationType?: string;
    name?: string;
    parentId?: string;
  }
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("locations")
    .update({
      location_type: payload.locationType,
      name: payload.name,
      parent_id: payload.parentId,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function deleteLocation(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("locations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function fetchOrgUsers(orgId: string): Promise<OrgUserRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", orgId)
    .order("full_name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    id: row.id,
    lastLogin: row.last_login ?? null,
    role: row.role ?? "staff",
    status: row.status ?? "active",
  }));
}

async function updateUserRole(userId: string, role: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ role: mapUiRoleToStaffRole(role) })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

async function inviteOrgUser(payload: InviteUserPayload) {
  return requestServerApi<{ user: OrgUserRow }>("/api/settings/invite", {
    body: payload,
    method: "POST",
  });
}

async function deactivateUser(userId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "inactive" })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

async function fetchDropdownCategories(
  orgId: string
): Promise<DropdownCategoryRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dropdown_categories")
    .select("*, dropdown_values(*)")
    .eq("org_id", orgId)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    description: row.description ?? null,
    id: row.id,
    name: row.name,
    orgId: row.org_id,
    values: (row.dropdown_values ?? [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((value: any) => ({
        categoryId: value.category_id,
        displayLabel: value.display_label ?? value.value ?? "",
        id: value.id,
        sortOrder: value.sort_order ?? 0,
      })),
  }));
}

async function createDropdownValue(payload: {
  categoryId: string;
  displayLabel: string;
  sortOrder?: number;
}) {
  const supabase = getSupabase();
  const slug = payload.displayLabel.toLowerCase().replace(/\s+/g, "_");
  const { error } = await supabase.from("dropdown_values").insert({
    category_id: payload.categoryId,
    display_label: payload.displayLabel,
    sort_order: payload.sortOrder ?? 0,
    value: slug,
  });

  if (error) {
    throw error;
  }
}

async function deleteDropdownValue(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("dropdown_values")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function fetchNotificationRules(
  orgId: string
): Promise<NotificationRuleRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("org_id", orgId)
    .order("event");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    description: row.description ?? null,
    email: row.email ?? row.email_enabled ?? false,
    event: row.event ?? row.event_type ?? "",
    id: row.id,
    orgId: row.org_id,
    push: row.push ?? row.push_enabled ?? false,
    sms: row.sms ?? row.sms_enabled ?? false,
  }));
}

async function createNotificationRule(payload: {
  description?: string;
  email?: boolean;
  event: string;
  orgId: string;
  push?: boolean;
  sms?: boolean;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from("notification_rules").insert({
    description: payload.description || null,
    email_enabled: payload.email ?? false,
    event_type: payload.event,
    org_id: payload.orgId,
    push_enabled: payload.push ?? false,
    sms_enabled: payload.sms ?? false,
  });

  if (error) {
    throw error;
  }
}

async function updateNotificationRule(
  id: string,
  payload: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  }
) {
  const supabase = getSupabase();
  const mapped: Record<string, boolean> = {};

  if (payload.email !== undefined) {
    mapped.email_enabled = payload.email;
  }

  if (payload.push !== undefined) {
    mapped.push_enabled = payload.push;
  }

  if (payload.sms !== undefined) {
    mapped.sms_enabled = payload.sms;
  }

  const { error } = await supabase
    .from("notification_rules")
    .update(mapped)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function deleteNotificationRule(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notification_rules")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export function useOrganization() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchOrganization(orgId!),
    queryKey: ["settings", "organization", orgId],
  });
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (payload: {
      address?: string;
      email?: string;
      name?: string;
      phone?: string;
      timezone?: string;
    }) => updateOrganization(orgId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "organization"] });
    },
  });
}

export function useProperties() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchProperties(orgId!),
    queryKey: ["settings", "properties", orgId],
  });
}

export function useCreatePropertyMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (payload: {
      address?: string;
      name: string;
      propertyType?: string;
    }) =>
      createProperty({
        ...payload,
        orgId: orgId!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "properties"] });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUpdatePropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      address?: string;
      id: string;
      name?: string;
      propertyType?: string;
      status?: string;
    }) => updateProperty(input.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "properties"] });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useDeletePropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "properties"] });
      await queryClient.invalidateQueries({ queryKey: ["settings", "locations"] });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useAllLocations() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchAllLocations(orgId!),
    queryKey: ["settings", "locations", orgId],
  });
}

export function useCreateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "locations"] });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUpdateLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      locationType?: string;
      name?: string;
      parentId?: string;
    }) => updateLocation(input.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "locations"] });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useDeleteLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "locations"] });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useOrgUsers() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchOrgUsers(orgId!),
    queryKey: ["settings", "users", orgId],
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      role: string;
      userId: string;
    }) => updateUserRole(input.userId, input.role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["personnel"] });
    },
  });
}

export function useDeactivateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["personnel"] });
    },
  });
}

export function useInviteOrgUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteOrgUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["personnel"] });
    },
  });
}

export function useResendInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteOrgUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
    },
  });
}

export function useDropdownCategories() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchDropdownCategories(orgId!),
    queryKey: ["settings", "dropdowns", orgId],
  });
}

export function useCreateDropdownValueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDropdownValue,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "dropdowns"] });
    },
  });
}

export function useDeleteDropdownValueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDropdownValue,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "dropdowns"] });
    },
  });
}

export function useNotificationRules() {
  const { canAccessProtected, orgId } = useSessionContext();

  return useQuery({
    enabled: canAccessProtected && Boolean(orgId),
    queryFn: () => fetchNotificationRules(orgId!),
    queryKey: ["settings", "notification-rules", orgId],
  });
}

export function useCreateNotificationRuleMutation() {
  const queryClient = useQueryClient();
  const { orgId } = useSessionContext();

  return useMutation({
    mutationFn: (payload: {
      description?: string;
      email?: boolean;
      event: string;
      push?: boolean;
      sms?: boolean;
    }) =>
      createNotificationRule({
        ...payload,
        orgId: orgId!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "notification-rules"],
      });
    },
  });
}

export function useUpdateNotificationRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      email?: boolean;
      id: string;
      push?: boolean;
      sms?: boolean;
    }) => updateNotificationRule(input.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "notification-rules"],
      });
    },
  });
}

export function useDeleteNotificationRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotificationRule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "notification-rules"],
      });
    },
  });
}
