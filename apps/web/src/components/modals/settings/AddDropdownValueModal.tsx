"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { useFormState } from "@/hooks/useFormState";
import { addDropdownValueSchema, type AddDropdownValues } from "@/lib/validations/settings";

interface AddDropdownValueModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddDropdownValues & { sortOrder: number }) => void | Promise<void>;
  dropdownCategory?: string;
}

export function AddDropdownValueModal({
  open,
  onClose,
  onSubmit,
  dropdownCategory = "",
}: AddDropdownValueModalProps) {
  const form = useFormState({
    initialValues: { value: "", displayLabel: "", sortOrder: "" },
    schema: addDropdownValueSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form.values,
        sortOrder: parseInt(form.values.sortOrder ?? "0") || 0,
      } as AddDropdownValues & { sortOrder: number });
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
      title="Add Dropdown Value"
      size="sm"
      submitLabel="Add Value"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      {dropdownCategory && (
        <div className="text-[13px]">
          <span className="text-[var(--text-tertiary)]">Category: </span>
          <span className="font-medium text-[var(--text-primary)]">{dropdownCategory}</span>
        </div>
      )}

      <Input
        label="Value"
        placeholder="Internal value (e.g. high_priority)"
        value={form.values.value}
        onChange={(e) => form.setValue("value", e.target.value)}
        error={form.touched.value ? form.errors.value : undefined}
      />

      <Input
        label="Display Label"
        placeholder="Display text (e.g. High Priority)"
        value={form.values.displayLabel}
        onChange={(e) => form.setValue("displayLabel", e.target.value)}
        error={form.touched.displayLabel ? form.errors.displayLabel : undefined}
      />

      <Input
        label="Sort Order"
        type="number"
        placeholder="0"
        value={form.values.sortOrder}
        onChange={(e) => form.setValue("sortOrder", e.target.value)}
      />
    </FormModal>
  );
}
