import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ─── Organization ────────────────────────────────── */

export interface OrganizationRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  logoUrl: string | null;
  subscriptionTier: string | null;
  [key: string]: unknown;
}

export async function fetchOrganization(orgId: string): Promise<OrganizationRow> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name ?? "",
    address: data.address ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    timezone: data.timezone ?? null,
    logoUrl: data.logo_url ?? null,
    subscriptionTier: data.plan ?? null,
  };
}

export async function updateOrganization(
  orgId: string,
  payload: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone?: string;
  },
) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      timezone: payload.timezone,
    })
    .eq("id", orgId);
  if (error) throw error;
}

/* ─── Properties ──────────────────────────────────── */

export interface PropertyRow {
  id: string;
  name: string;
  address: string | null;
  propertyType: string | null;
  status: string;
  orgId: string;
  [key: string]: unknown;
}

export async function fetchProperties(orgId: string): Promise<PropertyRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    address: row.address ?? null,
    propertyType: row.property_type ?? null,
    status: row.status ?? "active",
    orgId: row.org_id,
  }));
}

export async function createProperty(payload: {
  name: string;
  address?: string;
  propertyType?: string;
  orgId: string;
}) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("properties").insert({
    name: payload.name,
    address: payload.address,
    property_type: payload.propertyType,
    org_id: payload.orgId,
  });
  if (error) throw error;
}

export async function updateProperty(
  id: string,
  payload: { name?: string; address?: string; propertyType?: string; status?: string },
) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("properties")
    .update({
      name: payload.name,
      address: payload.address,
      property_type: payload.propertyType,
      status: payload.status,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProperty(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/* ─── Locations ───────────────────────────────────── */

export interface LocationRow {
  id: string;
  name: string;
  locationType: string | null;
  parentId: string | null;
  propertyId: string;
  [key: string]: unknown;
}

export async function fetchLocations(propertyId: string): Promise<LocationRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("property_id", propertyId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    locationType: row.location_type ?? null,
    parentId: row.parent_id ?? null,
    propertyId: row.property_id,
  }));
}

export async function fetchAllLocations(orgId: string): Promise<LocationRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("locations")
    .select("*, property:properties!property_id(id, name, org_id)")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  // Filter to org locations via joined property
  return (data || [])
    .filter((row: any) => row.property?.org_id === orgId)
    .map((row: any) => ({
      id: row.id,
      name: row.name,
      locationType: row.location_type ?? null,
      parentId: row.parent_id ?? null,
      propertyId: row.property_id,
    }));
}

export async function createLocation(payload: {
  name: string;
  locationType?: string;
  parentId?: string;
  propertyId: string;
}) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("locations").insert({
    name: payload.name,
    location_type: payload.locationType,
    parent_id: payload.parentId,
    property_id: payload.propertyId,
  });
  if (error) throw error;
}

export async function updateLocation(
  id: string,
  payload: { name?: string; locationType?: string; parentId?: string },
) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("locations")
    .update({
      name: payload.name,
      location_type: payload.locationType,
      parent_id: payload.parentId,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLocation(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("locations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/* ─── Users (profiles) ────────────────────────────── */

export interface OrgUserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string | null;
  [key: string]: unknown;
}

export async function fetchOrgUsers(orgId: string): Promise<OrgUserRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", orgId)
    .order("full_name");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    role: row.role ?? "staff",
    status: row.status ?? "active",
    lastLogin: row.last_login ?? null,
  }));
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("profiles")
    .update({ role: role as import("@/types").Enums<"staff_role"> })
    .eq("id", userId);
  if (error) throw error;
}

export async function deactivateUser(userId: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "inactive" })
    .eq("id", userId);
  if (error) throw error;
}

/* ─── Dropdown Categories & Values ────────────────── */

export interface DropdownCategoryRow {
  id: string;
  name: string;
  description: string | null;
  orgId: string;
  values: DropdownValueRow[];
  [key: string]: unknown;
}

export interface DropdownValueRow {
  id: string;
  displayLabel: string;
  sortOrder: number;
  categoryId: string;
  [key: string]: unknown;
}

export async function fetchDropdownCategories(
  orgId: string,
): Promise<DropdownCategoryRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("dropdown_categories")
    .select("*, dropdown_values(*)")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    orgId: row.org_id,
    values: (row.dropdown_values || [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((v: any) => ({
        id: v.id,
        displayLabel: v.display_label ?? v.value ?? "",
        sortOrder: v.sort_order ?? 0,
        categoryId: v.category_id,
      })),
  }));
}

export async function createDropdownValue(payload: {
  displayLabel: string;
  categoryId: string;
  sortOrder?: number;
}) {
  const supabase = getSupabaseBrowser();
  const slug = payload.displayLabel.toLowerCase().replace(/\s+/g, "_");
  const { error } = await supabase.from("dropdown_values").insert({
    display_label: payload.displayLabel,
    value: slug,
    category_id: payload.categoryId,
    sort_order: payload.sortOrder ?? 0,
  });
  if (error) throw error;
}

export async function deleteDropdownValue(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("dropdown_values")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/* ─── Notification Rules ──────────────────────────── */

export interface NotificationRuleRow {
  id: string;
  event: string;
  description: string | null;
  push: boolean;
  email: boolean;
  sms: boolean;
  orgId: string;
  [key: string]: unknown;
}

export async function fetchNotificationRules(
  orgId: string,
): Promise<NotificationRuleRow[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("org_id", orgId)
    .order("event");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    event: row.event ?? "",
    description: row.description ?? null,
    push: row.push ?? false,
    email: row.email ?? false,
    sms: row.sms ?? false,
    orgId: row.org_id,
  }));
}

export async function createNotificationRule(payload: {
  event: string;
  description?: string;
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  orgId: string;
}) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("notification_rules").insert({
    event_type: payload.event,
    description: payload.description,
    push_enabled: payload.push ?? false,
    email_enabled: payload.email ?? false,
    sms_enabled: payload.sms ?? false,
    org_id: payload.orgId,
  });
  if (error) throw error;
}

export async function updateNotificationRule(
  id: string,
  payload: { push?: boolean; email?: boolean; sms?: boolean },
) {
  const supabase = getSupabaseBrowser();
  const mapped: Record<string, boolean> = {};
  if (payload.push !== undefined) mapped.push_enabled = payload.push;
  if (payload.email !== undefined) mapped.email_enabled = payload.email;
  if (payload.sms !== undefined) mapped.sms_enabled = payload.sms;
  const { error } = await supabase
    .from("notification_rules")
    .update(mapped)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteNotificationRule(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("notification_rules")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
