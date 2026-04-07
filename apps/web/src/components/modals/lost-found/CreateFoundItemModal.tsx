"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createFoundItemSchema, type CreateFoundItemValues } from "@/lib/validations/lost-found";

interface CreateFoundItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFoundItemValues) => void | Promise<void>;
}

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "jewelry", label: "Jewelry" },
  { value: "clothing", label: "Clothing" },
  { value: "bags", label: "Bags" },
  { value: "documents", label: "Documents" },
  { value: "keys", label: "Keys" },
  { value: "other", label: "Other" },
];

export function CreateFoundItemModal({
  open,
  onClose,
  onSubmit,
}: CreateFoundItemModalProps) {
  const form = useFormState({
    initialValues: {
      description: "",
      category: "",
      foundLocation: "",
      foundBy: "",
      storageLocation: "",
      photoUrl: "",
      notes: "",
    },
    schema: createFoundItemSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as CreateFoundItemValues);
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
      title="Log Found Item"
      size="md"
      submitLabel="Log Item"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Item Description"
        placeholder="Describe the item..."
        value={form.values.description}
        onChange={(e) => form.setValue("description", e.target.value)}
        error={form.touched.description ? form.errors.description : undefined}
      />

      <Select
        label="Category"
        options={CATEGORY_OPTIONS}
        value={form.values.category}
        onChange={(e) => form.setValue("category", e.target.value)}
        placeholder="Select category"
        error={form.touched.category ? form.errors.category : undefined}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Found Location"
          placeholder="Where was it found?"
          value={form.values.foundLocation}
          onChange={(e) => form.setValue("foundLocation", e.target.value)}
        />
        <Input
          label="Found By"
          placeholder="Who found it?"
          value={form.values.foundBy}
          onChange={(e) => form.setValue("foundBy", e.target.value)}
        />
      </div>

      <Input
        label="Storage Location"
        placeholder="Where is it being stored?"
        value={form.values.storageLocation}
        onChange={(e) => form.setValue("storageLocation", e.target.value)}
      />

      <div className="rounded-lg border-2 border-dashed border-[var(--border-default)] p-6 text-center">
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Click or drag to upload item photo
        </p>
        {form.values.photoUrl && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">Photo selected</p>
        )}
      </div>

      <Textarea
        label="Notes"
        placeholder="Additional notes..."
        value={form.values.notes}
        onChange={(e) => form.setValue("notes", e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
