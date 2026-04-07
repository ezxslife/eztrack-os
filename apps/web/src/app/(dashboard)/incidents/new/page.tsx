"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { INCIDENT_TYPES } from "@eztrack/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { createIncident, fetchLocations } from "@/lib/queries/incidents";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ── Constants ── */
const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const TYPE_OPTIONS = INCIDENT_TYPES.map((t) => ({ value: t, label: t }));

interface FormData {
  incidentType: string;
  severity: string;
  location: string;
  synopsis: string;
  description: string;
  reporterName: string;
}

interface FormErrors {
  incidentType?: string;
  severity?: string;
  location?: string;
  synopsis?: string;
}

export default function CreateIncidentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [createdRecord, setCreatedRecord] = useState<{ id: string; record_number: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);
  const [userProfile, setUserProfile] = useState<{ orgId: string; propertyId: string | null } | null>(null);

  const [form, setForm] = useState<FormData>({
    incidentType: "",
    severity: "",
    location: "",
    synopsis: "",
    description: "",
    reporterName: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load locations and user profile on mount
  useEffect(() => {
    async function load() {
      try {
        // Fetch real locations from Supabase
        const locations = await fetchLocations();
        setLocationOptions(
          locations.map((loc: any) => ({ value: loc.id, label: loc.name }))
        );

        // Get current user's org_id and property_id
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("org_id, property_id")
            .eq("id", user.id)
            .single();
          if (profile) {
            setUserProfile({ orgId: profile.org_id, propertyId: profile.property_id });
          }
        }
      } catch (err) {
        console.error("Failed to load form data:", err);
      }
    }
    load();
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.incidentType) next.incidentType = "Incident type is required";
    if (!form.severity) next.severity = "Severity is required";
    if (!form.location) next.location = "Location is required";
    if (!form.synopsis.trim()) next.synopsis = "Synopsis is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!userProfile) {
      toast("Unable to determine your organization. Please refresh.", { variant: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createIncident({
        orgId: userProfile.orgId,
        propertyId: userProfile.propertyId,
        incidentType: form.incidentType,
        severity: form.severity,
        locationId: form.location || null,
        synopsis: form.synopsis,
        description: form.description || undefined,
        reportedBy: form.reporterName || undefined,
      });
      setCreatedRecord(result);
      toast("Incident created successfully", { variant: "success" });
      setSubmitted(true);
    } catch (err: any) {
      toast(err.message || "Failed to create incident", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--status-success-surface,#ecfdf5)] mb-4">
            <CheckCircle className="h-6 w-6 text-[var(--status-success,#059669)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Incident Created
          </h2>
          <p className="text-[13px] text-[var(--text-tertiary)] mb-1">
            {createdRecord?.record_number
              ? `Record ${createdRecord.record_number} has been logged and is ready for assignment.`
              : "The incident has been logged and is ready for assignment."}
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            {createdRecord && (
              <Button variant="default" size="md" onClick={() => router.push(`/incidents/${createdRecord.id}`)}>
                View Incident
              </Button>
            )}
            <Button variant="outline" size="md" onClick={() => router.push("/incidents")}>
              Back to Incidents
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSubmitted(false);
                setCreatedRecord(null);
                setForm({
                  incidentType: "",
                  severity: "",
                  location: "",
                  synopsis: "",
                  description: "",
                  reporterName: "",
                });
              }}
            >
              Create Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Back + Title ── */}
      <div className="mb-6">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Incidents
        </Link>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Create Incident</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
          Report a new security incident for tracking and investigation
        </p>
      </div>

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 space-y-5">
          {/* Row: Type + Severity */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Incident Type"
              options={TYPE_OPTIONS}
              value={form.incidentType}
              onChange={(e) => updateField("incidentType", e.target.value)}
              placeholder="Select type..."
              error={errors.incidentType}
            />
            <Select
              label="Severity"
              options={SEVERITY_OPTIONS}
              value={form.severity}
              onChange={(e) => updateField("severity", e.target.value)}
              placeholder="Select severity..."
              error={errors.severity}
            />
          </div>

          {/* Location */}
          <Select
            label="Location"
            options={locationOptions}
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder={locationOptions.length === 0 ? "Loading locations…" : "Select zone or area..."}
            error={errors.location}
          />

          {/* Synopsis */}
          <Textarea
            label="Synopsis"
            placeholder="Brief summary of the incident..."
            rows={2}
            value={form.synopsis}
            onChange={(e) => updateField("synopsis", e.target.value)}
            error={errors.synopsis}
          />

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Full details, observations, and context (optional)..."
            rows={5}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            helperText="Include any relevant details: physical descriptions, witness info, environmental conditions"
          />

          {/* Reporter Name */}
          <Input
            label="Reporter Name"
            placeholder="Name of the person reporting (optional)"
            value={form.reporterName}
            onChange={(e) => updateField("reporterName", e.target.value)}
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 mt-5">
          <Link href="/incidents">
            <Button variant="outline" size="md" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="destructive" size="md" type="submit" isLoading={isSubmitting}>
            Create Incident
          </Button>
        </div>
      </form>
    </div>
  );
}
