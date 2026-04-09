"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Building, MapPin, MoreHorizontal, Loader2, AlertCircle } from "lucide-react";
import { AppPage, PageSection } from "@/components/layout/AppPage";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AddPropertyModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchProperties,
  createProperty,
  deleteProperty,
  type PropertyRow,
} from "@/lib/queries/settings";

export default function PropertiesSettingsPage() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      if (!profile?.org_id) throw new Error("Organization not found");
      setOrgId(profile.org_id);
      const data = await fetchProperties(profile.org_id);
      setProperties(data);
    } catch (err: any) {
      setError(err.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <AppPage width="wide">
        <PageSection className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </PageSection>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage width="wide">
        <PageSection className="flex flex-col items-center justify-center gap-3 py-20">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Retry</Button>
        </PageSection>
      </AppPage>
    );
  }

  return (
    <SettingsLayout
      title="Properties"
      subtitle="Manage properties and venue sites."
      asideTitle="Property structure"
      asideDescription="Properties should stay discoverable and lightweight. Use this list to manage site-level organization before drilling into zones and locations."
      primaryAction={(
        <Button onClick={() => setAddPropertyOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Property
        </Button>
      )}
      secondaryActions={(
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Settings
          </Button>
        </Link>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {properties.map((prop) => (
          <Card key={prop.id}>
            <CardHeader>
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                    <Building className="h-5 w-5 text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <CardTitle>{prop.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge tone="default">{prop.propertyType ?? "Property"}</Badge>
                      <Badge tone={prop.status === "active" ? "success" : "default"} dot>{prop.status === "active" ? "Active" : "Inactive"}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <span className="text-[var(--text-secondary)]">{prop.address ?? "No address"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
                  <Link href="/settings/locations" className="text-[var(--action-primary)] hover:underline text-[12px]">
                    Manage Zones
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {properties.length === 0 && (
          <div className="col-span-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)]">
            <EmptyState
              icon={<Building className="h-5 w-5" />}
              title="No properties yet"
              description="Add your first property to start organizing locations and operations."
              action={{ label: "Add Property", onClick: () => setAddPropertyOpen(true), variant: "outline" }}
            />
          </div>
        )}
      </div>

      <AddPropertyModal
        open={addPropertyOpen}
        onClose={() => setAddPropertyOpen(false)}
        onSubmit={async (data) => {
          if (!orgId) return;
          try {
            await createProperty({ name: data.name, address: data.address, propertyType: data.propertyType, orgId });
            toast("Property created successfully", { variant: "success" });
            load();
          } catch (err: any) {
            toast(err.message || "Failed to create property", { variant: "error" });
          }
        }}
      />
    </SettingsLayout>
  );
}
