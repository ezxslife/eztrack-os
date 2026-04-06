"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface CloseCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CloseCaseFormData) => void | Promise<void>;
  openTaskCount?: number;
}

interface CloseCaseFormData {
  resolution: string;
  summary: string;
  recommendations: string;
  notifyParties: boolean;
}

const RESOLUTION_OPTIONS = [
  { value: "resolved", label: "Resolved" },
  { value: "unresolved", label: "Unresolved" },
  { value: "referred", label: "Referred" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "no_action", label: "No Action" },
];

export function CloseCaseModal({
  open,
  onClose,
  onSubmit,
  openTaskCount = 0,
}: CloseCaseModalProps) {
  const [resolution, setResolution] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [notifyParties, setNotifyParties] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = resolution !== "" && summary.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ resolution, summary, recommendations, notifyParties });
      setResolution("");
      setSummary("");
      setRecommendations("");
      setNotifyParties(true);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Close Case"
      subtitle="Close or archive this case"
      size="md"
      submitLabel="Close Case"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {openTaskCount > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-yellow-700 dark:text-yellow-300">
            This case has <strong>{openTaskCount}</strong> open task
            {openTaskCount !== 1 ? "s" : ""} remaining. Consider completing or
            reassigning them before closing.
          </p>
        </div>
      )}

      <Select
        label="Resolution"
        options={RESOLUTION_OPTIONS}
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder="Select resolution..."
      />

      <Textarea
        label="Summary"
        placeholder="Summarize the case outcome and key findings..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={4}
      />

      <Textarea
        label="Recommendations (optional)"
        placeholder="Any follow-up recommendations or preventive measures..."
        value={recommendations}
        onChange={(e) => setRecommendations(e.target.value)}
        rows={2}
      />

      <Toggle
        checked={notifyParties}
        onChange={setNotifyParties}
        label="Notify involved parties"
      />
    </FormModal>
  );
}
