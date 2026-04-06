"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface PatronNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; category: string }) => void | Promise<void>;
}

const NOTE_CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "incident", label: "Incident" },
  { value: "medical", label: "Medical" },
  { value: "behavioral", label: "Behavioral" },
];

export function PatronNoteModal({
  open,
  onClose,
  onSubmit,
}: PatronNoteModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = content.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ content: content.trim(), category });
      setContent("");
      setCategory("general");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent("");
    setCategory("general");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Add Patron Note"
      size="sm"
      submitLabel="Add Note"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Textarea
        label="Note"
        placeholder="Enter note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />

      <Select
        label="Category"
        options={NOTE_CATEGORY_OPTIONS}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
    </FormModal>
  );
}
