"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface EditNarrativeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string }) => void | Promise<void>;
  initialTitle?: string;
  initialContent?: string;
}

export function EditNarrativeModal({
  open,
  onClose,
  onSubmit,
  initialTitle = "",
  initialContent = "",
}: EditNarrativeModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setContent(initialContent);
    }
  }, [open, initialTitle, initialContent]);

  const isValid = content.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim() });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayTitle = initialTitle
    ? `Editing: ${initialTitle}`
    : "Edit Narrative Entry";

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={displayTitle}
      size="md"
      submitLabel="Save Changes"
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
      />

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Supports basic markdown: **bold**, *italic*, - lists
      </p>
    </FormModal>
  );
}
