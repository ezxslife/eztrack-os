"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface AddNarrativeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string }) => void | Promise<void>;
}

export function AddNarrativeModal({
  open,
  onClose,
  onSubmit,
}: AddNarrativeModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = content.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Add Narrative Entry"
      subtitle="Add a chronological narrative entry to this incident"
      size="md"
      submitLabel="Add Entry"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Title (optional)"
        placeholder="Brief title for this entry..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        label="Content"
        placeholder="Describe what happened..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        error={content.length === 0 ? undefined : undefined}
      />

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Supports basic markdown: **bold**, *italic*, - lists
      </p>
    </FormModal>
  );
}
