"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { InlineAction } from "@/components/ui/InlineAction";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { X } from "lucide-react";

interface OutcomeDocumentationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: OutcomeFormData) => void | Promise<void>;
}

interface OutcomeFormData {
  outcomeType: string;
  outcomeClassification: string;
  outcomeNotes: string;
  keyFindings: string[];
}

const OUTCOME_TYPE_OPTIONS = [
  { value: "founded", label: "Founded" },
  { value: "unfounded", label: "Unfounded" },
  { value: "inconclusive", label: "Inconclusive" },
  { value: "unresolved", label: "Unresolved" },
];

export function OutcomeDocumentationModal({
  open,
  onClose,
  onSubmit,
}: OutcomeDocumentationModalProps) {
  const [outcomeType, setOutcomeType] = useState("");
  const [outcomeClassification, setOutcomeClassification] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [keyFindings, setKeyFindings] = useState([
    "Subject identified via surveillance footage",
    "Multiple witnesses corroborate timeline",
    "Physical evidence collected from scene",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = outcomeType !== "" && outcomeNotes.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        outcomeType,
        outcomeClassification,
        outcomeNotes,
        keyFindings: keyFindings.filter((f) => f.trim() !== ""),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFinding = (index: number, value: string) => {
    setKeyFindings((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const removeFinding = (index: number) => {
    setKeyFindings((prev) => prev.filter((_, i) => i !== index));
  };

  const addFinding = () => {
    setKeyFindings((prev) => [...prev, ""]);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Outcome Documentation"
      subtitle="Document the final outcome of this case"
      size="lg"
      submitLabel="Save Outcome"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Select
        label="Outcome Type"
        options={OUTCOME_TYPE_OPTIONS}
        value={outcomeType}
        onChange={(e) => setOutcomeType(e.target.value)}
        placeholder="Select outcome..."
      />

      <Input
        label="Outcome Classification"
        placeholder="e.g., Theft, Vandalism, Policy Violation"
        value={outcomeClassification}
        onChange={(e) => setOutcomeClassification(e.target.value)}
      />

      <Textarea
        label="Outcome Notes"
        placeholder="Detailed notes about the outcome..."
        value={outcomeNotes}
        onChange={(e) => setOutcomeNotes(e.target.value)}
        rows={6}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
            Key Findings
          </label>
          <InlineAction onClick={addFinding}>
            + Add finding
          </InlineAction>
        </div>
        <div className="space-y-2">
          {keyFindings.map((finding, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className="flex-1 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                value={finding}
                onChange={(e) => updateFinding(idx, e.target.value)}
                placeholder={`Finding ${idx + 1}...`}
              />
              <IconButton
                onClick={() => removeFinding(idx)}
                className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--status-critical)]"
                label="Remove finding"
                variant="ghost"
              >
                <X size={14} />
              </IconButton>
            </div>
          ))}
        </div>
      </div>
    </FormModal>
  );
}
