import { getSupabaseBrowser } from "@/lib/supabase-browser";

export interface SearchResults {
  incidents: { id: string; record_number: string | null; synopsis: string | null; status: string | null }[];
  dispatches: { id: string; record_number: string | null; description: string | null; status: string | null }[];
  patrons: { id: string; first_name: string | null; last_name: string | null; flag: string | null }[];
  contacts: { id: string; first_name: string | null; last_name: string | null; organization_name: string | null }[];
  cases: { id: string; record_number: string | null; case_type: string | null; status: string | null }[];
}

export async function globalSearch(orgId: string, query: string): Promise<SearchResults> {
  const supabase = getSupabaseBrowser();
  const searchTerm = `%${query}%`;

  const [incidents, dispatches, patrons, contacts, cases] = await Promise.all([
    supabase
      .from("incidents")
      .select("id, record_number, synopsis, status")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`synopsis.ilike.${searchTerm},record_number.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from("dispatches")
      .select("id, record_number, description, status")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`description.ilike.${searchTerm},record_number.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from("patrons")
      .select("id, first_name, last_name, flag")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, organization_name")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},organization_name.ilike.${searchTerm}`)
      .limit(5),
    supabase
      .from("cases")
      .select("id, record_number, case_type, status")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .or(`case_type.ilike.${searchTerm},record_number.ilike.${searchTerm}`)
      .limit(5),
  ]);

  return {
    incidents: incidents.data ?? [],
    dispatches: dispatches.data ?? [],
    patrons: patrons.data ?? [],
    contacts: contacts.data ?? [],
    cases: cases.data ?? [],
  };
}
