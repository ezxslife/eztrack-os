import { useQuery } from "@tanstack/react-query";

import {
  previewBriefings,
  previewCases,
  previewContacts,
  previewFoundItems,
  previewLostReports,
  previewPatrons,
  previewVehicles,
  previewVisitors,
  previewWorkOrders,
} from "@/data/mock";
import { useSessionContext } from "@/hooks/useSessionContext";
import {
  readThroughCachedQuery,
  useHydrateQueryFromCache,
} from "@/lib/cache/sqlite-cache";
import { getSupabase } from "@/lib/supabase";

export interface PatronListRow {
  createdAt: string;
  email: string | null;
  firstName: string;
  flag: string;
  id: string;
  lastName: string;
  notes: string | null;
  phone: string | null;
}

export interface CaseListRow {
  caseNumber: string;
  caseType: string;
  created: string;
  id: string;
  leadInvestigator: string | null;
  priority: string | null;
  status: string;
  synopsis: string | null;
}

export interface FoundItemListRow {
  category: string;
  description: string;
  foundBy: string | null;
  foundDate: string;
  id: string;
  itemNumber: string;
  locationFound: string;
  photoUrl: string | null;
  status: string;
  storageLocation: string | null;
}

export interface LostReportListRow {
  category: string;
  date: string;
  description: string;
  id: string;
  lastSeenLocation: string | null;
  reportNumber: string;
  reportedBy: string | null;
  reportedByContact: string | null;
  status: string | null;
}

export interface BriefingListRow {
  author: string;
  createdAt: string;
  id: string;
  preview: string;
  priority: "high" | "low" | "medium";
  title: string;
}

export interface WorkOrderListRow {
  assignedTo: string | null;
  category: string;
  dueDate: string | null;
  id: string;
  priority: string;
  status: string;
  title: string;
  woNumber: string;
}

export interface VisitorListRow {
  checkedInAt: string | null;
  checkedOutAt: string | null;
  company: string | null;
  expectedDate: string | null;
  expectedTime: string | null;
  firstName: string;
  hostName: string | null;
  id: string;
  lastName: string;
  purpose: string;
  status: string;
}

export interface VehicleListRow {
  color: string | null;
  id: string;
  make: string;
  model: string;
  ownerId: string | null;
  ownerType: string | null;
  plate: string | null;
  type: string;
  year: number | null;
}

export interface ContactListRow {
  category: string;
  contactType: string;
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  organization: string;
  phone: string | null;
  title: string | null;
}

function useModuleListQuery<T>(options: {
  cacheKeyPrefix: string;
  fetcher: (orgId: string) => Promise<T[]>;
  previewData: T[];
  ttlMs?: number;
}) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const queryKey = [options.cacheKeyPrefix, "list", orgId ?? "preview"] as const;
  const cacheKey =
    usePreviewData || !orgId
      ? null
      : `${options.cacheKeyPrefix}:list:${orgId}`;

  useHydrateQueryFromCache<T[]>(
    queryKey,
    cacheKey,
    canAccessProtected && !usePreviewData && Boolean(orgId)
  );

  return useQuery<T[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(options.previewData)
        : readThroughCachedQuery({
            cacheKey: cacheKey!,
            fetcher: () => options.fetcher(orgId!),
            ttlMs: options.ttlMs ?? 5 * 60 * 1000,
          }),
    queryKey,
  });
}

async function fetchPatrons(orgId: string): Promise<PatronListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("patrons")
    .select(`
      id,
      first_name,
      last_name,
      flag,
      notes,
      phone,
      email,
      created_at
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    createdAt: row.created_at,
    email: row.email,
    firstName: row.first_name,
    flag: row.flag,
    id: row.id,
    lastName: row.last_name,
    notes: row.notes,
    phone: row.phone,
  }));
}

async function fetchCases(orgId: string): Promise<CaseListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cases")
    .select(`
      id,
      record_number,
      case_type,
      status,
      synopsis,
      escalation_level,
      created_at,
      investigator:profiles!lead_investigator(id, full_name)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    caseNumber: row.record_number,
    caseType: row.case_type,
    created: row.created_at,
    id: row.id,
    leadInvestigator: row.investigator?.full_name ?? null,
    priority: row.escalation_level,
    status: row.status,
    synopsis: row.synopsis,
  }));
}

async function fetchFoundItems(orgId: string): Promise<FoundItemListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("found_items")
    .select(`
      id,
      record_number,
      description,
      category,
      status,
      found_at,
      found_by,
      storage_location,
      photo_url,
      location:locations!found_location_id(id, name)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    category: row.category,
    description: row.description,
    foundBy: row.found_by,
    foundDate: row.found_at,
    id: row.id,
    itemNumber: row.record_number,
    locationFound: row.location?.name ?? "Unknown",
    photoUrl: row.photo_url,
    status: row.status,
    storageLocation: row.storage_location,
  }));
}

async function fetchLostReports(orgId: string): Promise<LostReportListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("lost_reports")
    .select(`
      id,
      record_number,
      description,
      category,
      reported_by_name,
      reported_by_contact,
      reported_at,
      created_at,
      status
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    category: row.category,
    date: row.reported_at ?? row.created_at,
    description: row.description,
    id: row.id,
    lastSeenLocation: null,
    reportNumber: row.record_number,
    reportedBy: row.reported_by_name,
    reportedByContact: row.reported_by_contact,
    status: row.status,
  }));
}

async function fetchBriefings(orgId: string): Promise<BriefingListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("briefings")
    .select(`
      id,
      title,
      content,
      priority,
      created_at,
      creator:profiles!created_by(id, full_name)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    author: row.creator?.full_name ?? "Unknown",
    createdAt: row.created_at,
    id: row.id,
    preview: row.content?.slice(0, 200) ?? "",
    priority: row.priority,
    title: row.title,
  }));
}

async function fetchWorkOrders(orgId: string): Promise<WorkOrderListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      id,
      record_number,
      title,
      category,
      priority,
      status,
      due_date,
      assigned:profiles!assigned_to(id, full_name)
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    assignedTo: row.assigned?.full_name ?? null,
    category: row.category,
    dueDate: row.due_date,
    id: row.id,
    priority: row.priority,
    status: row.status,
    title: row.title,
    woNumber: row.record_number,
  }));
}

async function fetchVisitors(orgId: string): Promise<VisitorListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("visitors")
    .select(`
      id,
      first_name,
      last_name,
      purpose,
      status,
      host_name,
      company,
      expected_date,
      expected_time,
      checked_in_at,
      checked_out_at
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
    company: row.company,
    expectedDate: row.expected_date,
    expectedTime: row.expected_time,
    firstName: row.first_name,
    hostName: row.host_name,
    id: row.id,
    lastName: row.last_name,
    purpose: row.purpose,
    status: row.status,
  }));
}

async function fetchVehicles(orgId: string): Promise<VehicleListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      id,
      license_plate,
      make,
      model,
      year,
      color,
      vehicle_type,
      owner_type,
      owner_id
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    color: row.color,
    id: row.id,
    make: row.make,
    model: row.model,
    ownerId: row.owner_id,
    ownerType: row.owner_type,
    plate: row.license_plate,
    type: row.vehicle_type,
    year: row.year,
  }));
}

async function fetchContacts(orgId: string): Promise<ContactListRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contacts")
    .select(`
      id,
      first_name,
      last_name,
      organization_name,
      category,
      contact_type,
      phone,
      email,
      title
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    category: row.category,
    contactType: row.contact_type,
    email: row.email,
    firstName: row.first_name ?? "",
    id: row.id,
    lastName: row.last_name ?? "",
    organization: row.organization_name ?? "",
    phone: row.phone,
    title: row.title,
  }));
}

export function usePatrons() {
  return useModuleListQuery({
    cacheKeyPrefix: "patrons",
    fetcher: fetchPatrons,
    previewData: previewPatrons,
  });
}

export function useCases() {
  return useModuleListQuery({
    cacheKeyPrefix: "cases",
    fetcher: fetchCases,
    previewData: previewCases,
  });
}

export function useFoundItems() {
  return useModuleListQuery({
    cacheKeyPrefix: "found-items",
    fetcher: fetchFoundItems,
    previewData: previewFoundItems,
  });
}

export function useLostReports() {
  return useModuleListQuery({
    cacheKeyPrefix: "lost-reports",
    fetcher: fetchLostReports,
    previewData: previewLostReports,
  });
}

export function useBriefings() {
  return useModuleListQuery({
    cacheKeyPrefix: "briefings",
    fetcher: fetchBriefings,
    previewData: previewBriefings,
  });
}

export function useWorkOrders() {
  return useModuleListQuery({
    cacheKeyPrefix: "work-orders",
    fetcher: fetchWorkOrders,
    previewData: previewWorkOrders,
  });
}

export function useVisitors() {
  return useModuleListQuery({
    cacheKeyPrefix: "visitors",
    fetcher: fetchVisitors,
    previewData: previewVisitors,
  });
}

export function useVehicles() {
  return useModuleListQuery({
    cacheKeyPrefix: "vehicles",
    fetcher: fetchVehicles,
    previewData: previewVehicles,
  });
}

export function useContacts() {
  return useModuleListQuery({
    cacheKeyPrefix: "contacts",
    fetcher: fetchContacts,
    previewData: previewContacts,
  });
}
