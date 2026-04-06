"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface AddCaseNarrativeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NarrativeFormData) => void | Promise<void>;
}

interface NarrativeFormData {
  title: string;
  content: string;
  entryType: string;
  isConfidential: boolean;
}

const ENTRY_TYPE_OPTIONS = [
  { value: "investigation_note", label: "Investigation Note" },
  { value: "witness_summary", label: "Witness Summary" },
  { value: "evidence_analysis", label: "Evidence Analysis" },
  { value: "legal_note", label: "Legal Note" },
  { value: "supervisor_review", label: "Supervisor Review" },
];

const ENTRY_TYPE_COLORS: Record<string, string> = {
  investigation_note: "#6366f1",
  witness_summary: "#f59e0b",
  evidence_analysis: "#10b981",
  legal_note: "#ef4444",
  supervisor_review: "#8b5cf6",
};

export function AddCaseNarrativeModal({
  open,
  onClose,
  onSubmit,
}: AddCaseNarrativeModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim() !== "" && content.trim() !== "" && entryType !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ title, content, entryType, isConfidential });
      setTitle("");
      setContent("");
      setEntryType("");
      setIsConfidential(false);
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
      title="Add Narrative"
      subtitle="Add a narrative entry to the case"
      size="md"
      submitLabel="Add Narrative"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Title"
        placeholder="Narrative title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        label="Content"
        placeholder="Write the narrative entry..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
      />

      {/* Entry Type with color-coded indicator */}
      <div>
        <div className="flex items-center gap-2">
          {entryType && (
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: ENTRY_TYPE_COLORS[entryType] ?? "var(--text-tertiary)" }}
            />
          )}
          <div className="flex-1">
            <Select
              label="Entry Type"
              options={ENTRY_TYPE_OPTIONS}
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              placeholder="Select entry type..."
            />
          </div>
        </div>
        {entryType && (
          <div className="flex items-center gap-1.5 mt-1.5 ml-5">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ENTRY_TYPE_COLORS[entryType] }}
            />
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {ENTRY_TYPE_OPTIONS.find((o) => o.value === entryType)?.label}
            </span>
          </div>
        )}
      </div>

      <Toggle
        checked={isConfidential}
        onChange={setIsConfidential}
        label="Mark as confidential"
      />
    </FormModal>
  );
}
