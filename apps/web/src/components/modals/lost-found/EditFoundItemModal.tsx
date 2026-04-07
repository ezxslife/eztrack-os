"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { editFoundItemSchema, type EditFoundItemValues } from "@/lib/validations/lost-found";

interface EditFoundItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EditFoundItemValues) => void | Promise<void>;
  initialData?: Partial<EditFoundItemValues>;
}

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "jewelry", label: "Jewelry" },
  { value: "wallet_purse", label: "Wallet / Purse" },
  { value: "keys", label: "Keys" },
  { value: "bags", label: "Bags" },
  { value: "documents", label: "Documents" },
  { value: "other", label: "Other" },
];

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "damaged", label: "Damaged" },
];

export function EditFoundItemModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditFoundItemModalProps) {
  const form = useFormState({
    initialValues: {
      description: "",
      category: "",
      foundLocation: "",
      foundBy: "",
      storageLocation: "",
      condition: "",
      notes: "",
    },
    schema: editFoundItemSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      form.setValues({
        description: initialData.description ?? "",
        category: initialData.category ?? "",
        foundLocation: initialData.foundLocation ?? "",
        foundBy: initialData.foundBy ?? "",
        storageLocation: initialData.storageLocation ?? "",
        condition: initialData.condition ?? "",
        notes: initialData.notes ?? "",
      });
    }
  }, [open, initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as EditFoundItemValues);
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
      title="Edit Found Item"
      size="md"
      submitLabel="Save Changes"
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

      <Select
        label="Condition"
        options={CONDITION_OPTIONS}
        value={form.values.condition}
        onChange={(e) => form.setValue("condition", e.target.value)}
        placeholder="Select condition"
      />

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
