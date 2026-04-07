"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { addNarrativeSchema, type AddNarrativeValues } from "@/lib/validations/incidents";

interface AddNarrativeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddNarrativeValues) => void | Promise<void>;
}

export function AddNarrativeModal({
  open,
  onClose,
  onSubmit,
}: AddNarrativeModalProps) {
  const form = useFormState({
    initialValues: { title: "", content: "" },
    schema: addNarrativeSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as AddNarrativeValues);
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
      title="Add Narrative Entry"
      subtitle="Add a chronological narrative entry to this incident"
      size="md"
      submitLabel="Add Entry"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Title (optional)"
        placeholder="Brief title for this entry..."
        value={form.values.title}
        onChange={(e) => form.setValue("title", e.target.value)}
      />

      <Textarea
        label="Content"
        placeholder="Describe what happened..."
        value={form.values.content}
        onChange={(e) => form.setValue("content", e.target.value)}
        rows={4}
        error={form.touched.content ? form.errors.content : undefined}
      />

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Supports basic markdown: **bold**, *italic*, - lists
      </p>
    </FormModal>
  );
}
