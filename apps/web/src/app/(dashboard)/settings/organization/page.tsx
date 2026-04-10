"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Building2, Crown, Loader2, AlertCircle } from "lucide-react";
import { AppPage, PageSection } from "@/components/layout/AppPage";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { fetchOrganization, updateOrganization } from "@/lib/queries/settings";

const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Berlin", label: "Central European Time (CET)" },
];

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  const loadOrg = useCallback(async () => {
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
      const org = await fetchOrganization(profile.org_id);
      setOrgName(org.name);
      setAddress(org.address ?? "");
      setPhone(org.phone ?? "");
      setEmail(org.email ?? "");
      setTimezone(org.timezone ?? "America/Los_Angeles");
      setSubscriptionTier(org.subscriptionTier);
    } catch (err: any) {
      setError(err.message || "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrg(); }, [loadOrg]);

  const handleSave = async () => {
    if (!orgId) return;
    try {
      setSaving(true);
      await updateOrganization(orgId, { name: orgName, address, phone, email, timezone });
      toast("Organization settings saved", { variant: "success" });
    } catch (err: any) {
      toast(err.message || "Failed to save settings", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

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
          <Button variant="outline" size="sm" onClick={loadOrg}>Retry</Button>
        </PageSection>
      </AppPage>
    );
  }

  return (
    <SettingsLayout
      title="Organization Settings"
      subtitle="Company profile, branding, and preferences."
      asideTitle="Organization profile"
      asideDescription="Keep the workspace identity, contact details, and timezone readable and centralized. Subscription and branding stay adjacent, not buried in separate one-off forms."
      secondaryActions={(
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Settings
          </Button>
        </Link>
      )}
    >
      <div className="space-y-5">
        <PageSection>
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Subscription</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--action-primary-fill)] flex items-center justify-center">
              <Crown className="h-5 w-5 text-[var(--text-on-brand)]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{subscriptionTier ? `${subscriptionTier} Plan` : "Enterprise Plan"}</span>
                <Badge tone="success">Active</Badge>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                Unlimited users, properties, and integrations. Renews Jan 15, 2027.
              </p>
            </div>
            <Button variant="outline" size="sm">Manage Plan</Button>
          </div>
        </PageSection>

        <PageSection>
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Organization Details</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <Textarea
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Select
              label="Timezone"
              options={timezoneOptions}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
        </PageSection>

        <PageSection>
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Organization Logo</h2>
          </div>
          <div className="flex items-start gap-5">
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
              <Building2 className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <div className="space-y-2">
              <p className="text-[13px] text-[var(--text-secondary)]">
                Upload your organization logo. Recommended size: 256x256px. PNG or SVG format.
              </p>
              <Button variant="outline" size="sm">
                <Upload className="h-3.5 w-3.5" />
                Upload Logo
              </Button>
            </div>
          </div>
        </PageSection>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={loadOrg}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
}
