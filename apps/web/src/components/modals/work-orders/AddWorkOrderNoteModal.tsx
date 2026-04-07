"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { addWorkOrderNoteSchema, type AddWorkOrderNoteValues } from "@/lib/validations/work-orders";

interface AddWorkOrderNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddWorkOrderNoteValues) => void | Promise<void>;
}

export function AddWorkOrderNoteModal({
  open,
  onClose,
  onSubmit,
}: AddWorkOrderNoteModalProps) {
  const form = useFormState({
    initialValues: { content: "" },
    schema: addWorkOrderNoteSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as AddWorkOrderNoteValues);
      form.reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
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
      isValid={form.isValid}
    >
      <Textarea
        label="Note"
        placeholder="Enter note content..."
        value={form.values.content}
        onChange={(e) => form.setValue("content", e.target.value)}
        rows={4}
        error={form.touched.content ? form.errors.content : undefined}
      />
    </FormModal>
  );
}
