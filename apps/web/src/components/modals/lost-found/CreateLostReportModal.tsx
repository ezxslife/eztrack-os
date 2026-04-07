"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createLostReportSchema, type CreateLostReportValues } from "@/lib/validations/lost-found";

interface CreateLostReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLostReportValues) => void | Promise<void>;
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

export function CreateLostReportModal({
  open,
  onClose,
  onSubmit,
}: CreateLostReportModalProps) {
  const form = useFormState({
    initialValues: {
      description: "",
      category: "",
      lastSeenLocation: "",
      reportedByName: "",
      reportedByPhone: "",
      reportedByEmail: "",
      notes: "",
    },
    schema: createLostReportSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as CreateLostReportValues);
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
      title="Report Lost Item"
      size="md"
      submitLabel="Submit Report"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Item Description"
        placeholder="Describe the lost item..."
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

      <Input
        label="Last Seen Location"
        placeholder="Where was it last seen?"
        value={form.values.lastSeenLocation}
        onChange={(e) => form.setValue("lastSeenLocation", e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Reported By"
          placeholder="Name"
          value={form.values.reportedByName}
          onChange={(e) => form.setValue("reportedByName", e.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={form.values.reportedByPhone}
          onChange={(e) => form.setValue("reportedByPhone", e.target.value)}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        value={form.values.reportedByEmail}
        onChange={(e) => form.setValue("reportedByEmail", e.target.value)}
        error={form.touched.reportedByEmail ? form.errors.reportedByEmail : undefined}
      />

      <Textarea
        label="Notes"
        placeholder="Any additional details..."
        value={form.values.notes}
        onChange={(e) => form.setValue("notes", e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
