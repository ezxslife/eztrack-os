"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { addPropertySchema, type AddPropertyValues } from "@/lib/validations/settings";

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddPropertyValues) => void | Promise<void>;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "venue", label: "Venue" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "other", label: "Other" },
];

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "UTC", label: "UTC" },
];

export function AddPropertyModal({
  open,
  onClose,
  onSubmit,
}: AddPropertyModalProps) {
  const form = useFormState({
    initialValues: {
      name: "",
      address: "",
      propertyType: "",
      timezone: "",
    },
    schema: addPropertySchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as AddPropertyValues);
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
      title="Add Property"
      size="md"
      submitLabel="Add Property"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Name"
        placeholder="Property name"
        value={form.values.name}
        onChange={(e) => form.setValue("name", e.target.value)}
        error={form.touched.name ? form.errors.name : undefined}
      />

      <Textarea
        label="Address"
        placeholder="Full address..."
        value={form.values.address}
        onChange={(e) => form.setValue("address", e.target.value)}
        rows={2}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Property Type"
          options={PROPERTY_TYPE_OPTIONS}
          value={form.values.propertyType}
          onChange={(e) => form.setValue("propertyType", e.target.value)}
          placeholder="Select type"
        />
        <Select
          label="Timezone"
          options={TIMEZONE_OPTIONS}
          value={form.values.timezone}
          onChange={(e) => form.setValue("timezone", e.target.value)}
          placeholder="Select timezone"
        />
      </div>
    </FormModal>
  );
}
