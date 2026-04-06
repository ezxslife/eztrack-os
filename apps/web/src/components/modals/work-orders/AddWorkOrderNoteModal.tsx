"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Textarea } from "@/components/ui/Textarea";

interface AddWorkOrderNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string }) => void | Promise<void>;
}

export function AddWorkOrderNoteModal({
  open,
  onClose,
  onSubmit,
}: AddWorkOrderNoteModalProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = content.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ content: content.trim() });
      setContent("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Add Note"
      size="sm"
      submitLabel="Add Note"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Textarea
        label="Note"
        placeholder="Enter note content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />
    </FormModal>
  );
}
