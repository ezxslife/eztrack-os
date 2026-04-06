"use client";

import { useState } from "react";
import {
  ShieldOff,
  ChevronDown,
  ChevronRight,
  Search,
  Lock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";

/* ── Types ── */
type ReportCategory =
  | "safety_concern"
  | "misconduct"
  | "theft"
  | "harassment"
  | "drug_activity"
  | "other";

type ReportStatus = "submitted" | "under_review" | "investigating" | "resolved" | "closed";

interface AdminReport {
  id: string;
  code: string;
  category: ReportCategory;
  submitted: string;
  status: ReportStatus;
  location: string;
}

/* ── Category options ── */
const CATEGORY_OPTIONS = [
  { value: "", label: "Select a category" },
  { value: "safety_concern", label: "Safety Concern" },
  { value: "misconduct", label: "Misconduct" },
  { value: "theft", label: "Theft" },
  { value: "harassment", label: "Harassment" },
  { value: "drug_activity", label: "Drug Activity" },
  { value: "other", label: "Other" },
];

/* ── Status badge tone map ── */
const statusTone: Record<ReportStatus, "info" | "warning" | "success" | "default" | "critical"> = {
  submitted: "info",
  under_review: "warning",
  investigating: "attention" as "warning",
  resolved: "success",
  closed: "default",
};

const statusLabel: Record<ReportStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};

/* ── Category badge tone map ── */
const categoryTone: Record<ReportCategory, "critical" | "warning" | "info" | "default" | "attention"> = {
  safety_concern: "critical",
  misconduct: "warning",
  theft: "critical",
  harassment: "critical",
  drug_activity: "warning",
  other: "default",
};

const categoryLabel: Record<ReportCategory, string> = {
  safety_concern: "Safety Concern",
  misconduct: "Misconduct",
  theft: "Theft",
  harassment: "Harassment",
  drug_activity: "Drug Activity",
  other: "Other",
};

/* ── Mock admin reports ── */
const MOCK_ADMIN_REPORTS: AdminReport[] = [
  {
    id: "1",
    code: "ANON-2026-0015",
    category: "safety_concern",
    submitted: "Apr 4, 2026",
    status: "under_review",
    location: "Gate B - South Entrance",
  },
  {
    id: "2",
    code: "ANON-2026-0014",
    category: "theft",
    submitted: "Apr 3, 2026",
    status: "investigating",
    location: "Merchandise Tent A",
  },
  {
    id: "3",
    code: "ANON-2026-0013",
    category: "drug_activity",
    submitted: "Apr 1, 2026",
    status: "resolved",
    location: "Parking Lot C",
  },
];

export default function AnonymousReportsPage() {
  /* ── Submit form state ── */
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [contactExpanded, setContactExpanded] = useState(false);
  const [contactInfo, setContactInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  /* ── Status check state ── */
  const [statusCode, setStatusCode] = useState("");
  const [statusResult, setStatusResult] = useState<{
    code: string;
    status: string;
  } | null>(null);
  const [statusChecking, setStatusChecking] = useState(false);

  /* ── Form validation ── */
  const descriptionError =
    description.length > 0 && description.length < 20
      ? "Description must be at least 20 characters"
      : undefined;

  const canSubmit = category !== "" && description.length >= 20 && !submitting;

  /* ── Handlers ── */
  const handleSubmit = () => {
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      const code = `ANON-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      setTrackingCode(code);
      setSubmitted(true);
      setSubmitting(false);
    }, 1200);
  };

  const handleResetForm = () => {
    setCategory("");
    setLocation("");
    setDescription("");
    setContactInfo("");
    setContactExpanded(false);
    setSubmitted(false);
    setTrackingCode("");
  };

  const handleCheckStatus = () => {
    setStatusChecking(true);
    // Simulate lookup
    setTimeout(() => {
      setStatusResult({
        code: statusCode || "ANON-2026-0015",
        status: "Under Review",
      });
      setStatusChecking(false);
    }, 800);
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldOff className="h-5 w-5 text-[var(--text-tertiary)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Anonymous Reports
          </h1>
        </div>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
          Submit confidential tips and reports without revealing your identity. All submissions are encrypted and anonymized.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Submit a Report ── */}
        <Card>
          <CardHeader>
            <CardTitle>Submit a Report</CardTitle>
            <CardDescription>
              Your report will be reviewed by authorized personnel only.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!submitted ? (
              <div className="space-y-4">
                <Select
                  label="Category"
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Select a category"
                />

                <Input
                  label="Location (optional)"
                  placeholder="e.g., Gate B, Lot C, Main Stage"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <Textarea
                  label="Description"
                  placeholder="Describe what you observed in detail (minimum 20 characters)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  error={descriptionError}
                  helperText={
                    !descriptionError
                      ? `${description.length}/20 minimum characters`
                      : undefined
                  }
                />

                {/* ── Collapsible contact section ── */}
                <button
                  type="button"
                  onClick={() => setContactExpanded(!contactExpanded)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
                >
                  {contactExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  You may optionally provide contact info
                </button>

                {contactExpanded && (
                  <Input
                    placeholder="Email or phone (optional, not required)"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    helperText="Only used if investigators need clarification"
                  />
                )}

                <Button
                  size="md"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  isLoading={submitting}
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit Report
                </Button>

                {/* ── Privacy notice ── */}
                <div className="flex items-start gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-2.5">
                  <Lock className="h-3.5 w-3.5 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                    Reports are anonymous. No identifying information is collected.
                    Your IP address and browser fingerprint are not stored.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Submission Confirmation ── */
              <div className="space-y-4 text-center py-4">
                <div
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: "color-mix(in srgb, var(--status-success) 12%, transparent)" }}
                >
                  <ShieldOff className="h-5 w-5" style={{ color: "var(--status-success)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    Report Submitted Successfully
                  </p>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                    Your tracking code:
                  </p>
                  <p className="text-sm font-mono font-bold text-[var(--action-primary)] mt-1">
                    {trackingCode}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
                    Save this code to check the status of your report later.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleResetForm}>
                  Submit Another Report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Report Status Check ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Report Status</CardTitle>
              <CardDescription>
                Check the status of a previously submitted anonymous report using your tracking code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Tracking Code"
                      placeholder="e.g., ANON-2026-0015"
                      value={statusCode}
                      onChange={(e) => setStatusCode(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleCheckStatus}
                    disabled={statusCode.length === 0}
                    isLoading={statusChecking}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Check Status
                  </Button>
                </div>

                {statusResult && (
                  <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
                    <p className="text-[13px] text-[var(--text-primary)]">
                      Report{" "}
                      <span className="font-mono font-semibold">
                        #{statusResult.code}
                      </span>{" "}
                      &mdash; Status:{" "}
                      <Badge tone="warning" dot>
                        {statusResult.status}
                      </Badge>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Admin View: Recent Anonymous Reports ── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Anonymous Reports</CardTitle>
          <CardDescription>
            Admin view of submitted anonymous reports
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left font-medium text-[var(--text-tertiary)] px-5 py-2.5 text-[12px]">
                    Report #
                  </th>
                  <th className="text-left font-medium text-[var(--text-tertiary)] px-5 py-2.5 text-[12px]">
                    Category
                  </th>
                  <th className="text-left font-medium text-[var(--text-tertiary)] px-5 py-2.5 text-[12px]">
                    Submitted
                  </th>
                  <th className="text-left font-medium text-[var(--text-tertiary)] px-5 py-2.5 text-[12px]">
                    Status
                  </th>
                  <th className="text-left font-medium text-[var(--text-tertiary)] px-5 py-2.5 text-[12px]">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {MOCK_ADMIN_REPORTS.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-[var(--surface-hover)] transition-colors duration-100"
                  >
                    <td className="px-5 py-2.5 font-mono font-medium text-[var(--text-primary)]">
                      {report.code}
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge tone={categoryTone[report.category]}>
                        {categoryLabel[report.category]}
                      </Badge>
                    </td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">
                      {report.submitted}
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge tone={statusTone[report.status]} dot>
                        {statusLabel[report.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-2.5 text-[var(--text-secondary)]">
                      {report.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
