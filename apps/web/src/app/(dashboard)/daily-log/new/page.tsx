"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { AppPage, PageHeader, PageSection } from "@/components/layout/AppPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { createDailyLog } from "@/lib/queries/daily-logs";
import { fetchLocations } from "@/lib/queries/incidents";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function NewDailyLogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [synopsis, setSynopsis] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordNumber, setRecordNumber] = useState("");
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  async function resolveUserContext() {
    const supabase = getSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("org_id, property_id")
      .eq("id", user.id)
      .single();

    if (error || !profile?.org_id) {
      throw new Error("Unable to determine organization");
    }

    setOrgId(profile.org_id);
    setPropertyId(profile.property_id);

    return {
      orgId: profile.org_id,
      propertyId: profile.property_id,
    };
  }

  useEffect(() => {
    async function loadFormData() {
      try {
        const locations = await fetchLocations();
        setLocationOptions(locations.map((l) => ({ value: l.id, label: l.name })));
        await resolveUserContext();
      } catch {
        // Locations will fall back to empty
      } finally {
        setProfileLoading(false);
      }
    }
    loadFormData();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const context =
        orgId
          ? { orgId, propertyId }
          : await resolveUserContext();

      const result = await createDailyLog({
        orgId: context.orgId,
        propertyId: context.propertyId,
        topic,
        synopsis: synopsis || undefined,
        priority,
        locationId: location || null,
      });
      setRecordNumber(result.record_number);
      toast("Daily log entry created successfully", { variant: "success" });
      setSubmitted(true);
      setTimeout(() => {
        router.push("/daily-log");
      }, 1500);
    } catch (err: any) {
      toast(err.message || "Failed to create daily log", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AppPage width="form" className="animate-scale-in">
        <PageSection className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--green-500,#10b981)]/12">
            <CheckCircle size={24} className="text-[var(--green-500,#10b981)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Entry Created
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            {recordNumber ? `${recordNumber} — ` : ""}Redirecting to Daily Log...
          </p>
        </PageSection>
      </AppPage>
    );
  }

  return (
    <AppPage width="form" className="animate-fade-in">
      <PageHeader
        breadcrumbs={
          <Link
            href="/daily-log"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--action-primary)] transition-colors hover:text-[var(--action-primary-hover)]"
          >
            <ArrowLeft size={14} />
            Daily Log
          </Link>
        }
        title="New Daily Log Entry"
        subtitle="Create a new daily log entry."
      />

      <PageSection padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Topic"
            placeholder="Brief description of the log entry..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Location"
              options={locationOptions}
              placeholder="Select zone..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>

          <Textarea
            label="Synopsis"
            placeholder="Detailed notes about the event or observation..."
            rows={5}
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-subdued)]">
            <Link href="/daily-log">
              <Button variant="secondary" size="md" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="default"
              size="md"
              type="submit"
              disabled={submitting || profileLoading || locationOptions.length === 0}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Creating..." : profileLoading ? "Loading..." : "Submit Entry"}
            </Button>
          </div>
        </form>
      </PageSection>
    </AppPage>
  );
}
