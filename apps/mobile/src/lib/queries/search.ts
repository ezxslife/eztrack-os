import { useQuery } from "@tanstack/react-query";

import { useSessionContext } from "@/hooks/useSessionContext";
import { getSupabase } from "@/lib/supabase";
import {
  previewDailyLogs,
  previewDispatches,
  previewIncidents,
} from "@/data/mock";

export interface SearchResultGroupItem {
  id: string;
  subtitle: string | null;
  title: string;
}

export interface SearchResults {
  dailyLogs: SearchResultGroupItem[];
  dispatches: SearchResultGroupItem[];
  incidents: SearchResultGroupItem[];
}

async function globalSearch(orgId: string, query: string): Promise<SearchResults> {
  const supabase = getSupabase();
  const searchTerm = `%${query}%`;

  const [incidents, dispatches, dailyLogs] = await Promise.all([
    supabase
      .from("incidents")
      .select("id, record_number, synopsis")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`synopsis.ilike.${searchTerm},record_number.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from("dispatches")
      .select("id, record_number, description")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`description.ilike.${searchTerm},record_number.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from("daily_logs")
      .select("id, record_number, topic")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`topic.ilike.${searchTerm},record_number.ilike.${searchTerm},synopsis.ilike.${searchTerm}`)
      .limit(5),
  ]);

  return {
    dailyLogs: (dailyLogs.data ?? []).map((row) => ({
      id: row.id,
      subtitle: row.record_number,
      title: row.topic,
    })),
    dispatches: (dispatches.data ?? []).map((row) => ({
      id: row.id,
      subtitle: row.record_number,
      title: row.description ?? "Dispatch",
    })),
    incidents: (incidents.data ?? []).map((row) => ({
      id: row.id,
      subtitle: row.record_number,
      title: row.synopsis ?? "Incident",
    })),
  };
}

function previewSearch(query: string): SearchResults {
  const normalized = query.trim().toLowerCase();

  const incidents = previewIncidents
    .filter((incident) =>
      [incident.recordNumber, incident.type, incident.location, incident.synopsis]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    )
    .slice(0, 5)
    .map((incident) => ({
      id: incident.id,
      subtitle: incident.recordNumber,
      title: incident.type,
    }));

  const dispatches = previewDispatches
    .filter((dispatch) =>
      [dispatch.recordNumber, dispatch.location, dispatch.description]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    )
    .slice(0, 5)
    .map((dispatch) => ({
      id: dispatch.id,
      subtitle: dispatch.recordNumber,
      title: dispatch.description,
    }));

  const dailyLogs = previewDailyLogs
    .filter((log) =>
      [log.recordNumber, log.topic, log.synopsis].join(" ").toLowerCase().includes(normalized)
    )
    .slice(0, 5)
    .map((log) => ({
      id: log.id,
      subtitle: log.recordNumber,
      title: log.topic,
    }));

  return { dailyLogs, dispatches, incidents };
}

export function useOperationalSearch(query: string) {
  const { canAccessProtected, orgId, usePreviewData } = useSessionContext();
  const normalizedQuery = query.trim();

  return useQuery({
    enabled: canAccessProtected && normalizedQuery.length >= 2 && (usePreviewData || Boolean(orgId)),
    queryFn: () =>
      usePreviewData ? Promise.resolve(previewSearch(normalizedQuery)) : globalSearch(orgId!, normalizedQuery),
    queryKey: ["search", orgId ?? "preview", normalizedQuery],
  });
}
