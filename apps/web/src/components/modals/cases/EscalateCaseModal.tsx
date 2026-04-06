"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface EscalateCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EscalateFormData) => void | Promise<void>;
}

interface EscalateFormData {
  escalateTo: string;
  priority: string;
  justification: string;
  attachEvidence: boolean;
}

const ESCALATE_TO_OPTIONS = [
  { value: "legal_department", label: "Legal Department" },
  { value: "senior_management", label: "Senior Management" },
  { value: "external_authority", label: "External Authority" },
  { value: "insurance", label: "Insurance" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
];

export function EscalateCaseModal({
  open,
  onClose,
  onSubmit,
}: EscalateCaseModalProps) {
  const [escalateTo, setEscalateTo] = useState("");
  const [priority, setPriority] = useState("");
  const [justification, setJustification] = useState("");
  const [attachEvidence, setAttachEvidence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    escalateTo !== "" && priority !== "" && justification.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ escalateTo, priority, justification, attachEvidence });
      setEscalateTo("");
      setPriority("");
      setJustification("");
      setAttachEvidence(false);
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
      title="Escalate Case"
      subtitle="Escalate this case for legal or management review"
      size="md"
      submitLabel="Escalate"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Select
        label="Escalate To"
        options={ESCALATE_TO_OPTIONS}
        value={escalateTo}
        onChange={(e) => setEscalateTo(e.target.value)}
        placeholder="Select department..."
      />

      <Select
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        placeholder="Select priority..."
      />

      <Textarea
        label="Justification"
        placeholder="Explain why this case needs escalation..."
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        rows={4}
      />

      <Toggle
        checked={attachEvidence}
        onChange={setAttachEvidence}
        label="Attach evidence to escalation"
      />
    </FormModal>
  );
}
