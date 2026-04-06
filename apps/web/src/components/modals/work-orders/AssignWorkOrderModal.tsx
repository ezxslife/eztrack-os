"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface AssignWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { assigneeId: string; notes: string }) => void | Promise<void>;
  currentAssignee?: string;
  assignees?: { value: string; label: string }[];
}

export function AssignWorkOrderModal({
  open,
  onClose,
  onSubmit,
  currentAssignee,
  assignees = [],
}: AssignWorkOrderModalProps) {
  const [assigneeId, setAssigneeId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = assigneeId !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ assigneeId, notes: notes.trim() });
      setAssigneeId("");
      setNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAssigneeId("");
    setNotes("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Assign Work Order"
      size="sm"
      submitLabel="Assign"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {currentAssignee && (
        <div className="text-[13px]">
          <span className="text-[var(--text-tertiary)]">Currently assigned to: </span>
          <span className="font-medium text-[var(--text-primary)]">{currentAssignee}</span>
        </div>
      )}

      <Select
        label="New Assignee"
        options={assignees}
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        placeholder="Search and select assignee"
      />

      <Textarea
        label="Notes"
        placeholder="Add assignment notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
