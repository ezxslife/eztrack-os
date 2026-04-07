import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";
import { previewLocations } from "@/data/mock";

export interface LocationOption {
  id: string;
  name: string;
  propertyId: string;
}

async function fetchLocations(orgId: string, propertyId: string | null): Promise<LocationOption[]> {
  const supabase = getSupabase();

  let propertyIds = propertyId ? [propertyId] : [];

  if (!propertyIds.length) {
    const { data: properties, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("org_id", orgId)
      .order("name", { ascending: true });

    if (propertyError) {
      throw propertyError;
    }

    propertyIds = (properties ?? []).map((property) => property.id);
  }

  if (!propertyIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("locations")
    .select("id, name, property_id")
    .in("property_id", propertyIds)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    propertyId: row.property_id,
  }));
}

export function useLocations() {
  const { canAccessProtected, orgId, propertyId, usePreviewData } = useSessionContext();

  return useQuery<LocationOption[]>({
    enabled: canAccessProtected && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData
        ? Promise.resolve(previewLocations.map((location) => ({ ...location })))
        : fetchLocations(orgId!, propertyId),
    queryKey: ["locations", orgId ?? "preview", propertyId ?? "all"],
  });
}
