"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface LinkRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LinkRecordFormData) => void | Promise<void>;
}

interface LinkRecordFormData {
  recordType: string;
  recordId: string;
  relationship: string;
  notes: string;
}

const RECORD_TYPE_OPTIONS = [
  { value: "incident", label: "Incident" },
  { value: "dispatch", label: "Dispatch" },
  { value: "daily_log", label: "Daily Log" },
  { value: "work_order", label: "Work Order" },
  { value: "briefing", label: "Briefing" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "primary_evidence", label: "Primary Evidence" },
  { value: "supporting", label: "Supporting" },
  { value: "related", label: "Related" },
  { value: "contradicts", label: "Contradicts" },
];

export function LinkRecordModal({
  open,
  onClose,
  onSubmit,
}: LinkRecordModalProps) {
  const [recordType, setRecordType] = useState("");
  const [recordId, setRecordId] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = recordType !== "" && recordId.trim() !== "" && relationship !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ recordType, recordId, relationship, notes });
      setRecordType("");
      setRecordId("");
      setRelationship("");
      setNotes("");
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
      title="Link Record"
      subtitle="Link an external record to this case"
      size="md"
      submitLabel="Link Record"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Select
        label="Record Type"
        options={RECORD_TYPE_OPTIONS}
        value={recordType}
        onChange={(e) => setRecordType(e.target.value)}
        placeholder="Select record type..."
      />

      <div className="relative">
        <Input
          label="Record ID"
          placeholder="Search by ID or reference number..."
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
        />
        <div className="absolute right-3 top-[34px] pointer-events-none">
          <Search size={14} className="text-[var(--text-tertiary)]" />
        </div>
      </div>

      <Select
        label="Relationship"
        options={RELATIONSHIP_OPTIONS}
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
        placeholder="Select relationship..."
      />

      <Textarea
        label="Notes (optional)"
        placeholder="Additional context about this link..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
