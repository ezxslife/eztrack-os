"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { addLocationSchema, type AddLocationValues } from "@/lib/validations/settings";

interface AddLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddLocationValues) => void | Promise<void>;
  properties?: { value: string; label: string }[];
}

const LOCATION_TYPE_OPTIONS = [
  { value: "building", label: "Building" },
  { value: "gate", label: "Gate" },
  { value: "stage", label: "Stage" },
  { value: "tent", label: "Tent" },
  { value: "parking", label: "Parking" },
  { value: "other", label: "Other" },
];

export function AddLocationModal({
  open,
  onClose,
  onSubmit,
  properties = [],
}: AddLocationModalProps) {
  const form = useFormState({
    initialValues: {
      name: "",
      parentPropertyId: "",
      zone: "",
      locationType: "",
      description: "",
    },
    schema: addLocationSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as AddLocationValues);
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
      title="Add Location"
      size="md"
      submitLabel="Add Location"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Name"
        placeholder="Location name"
        value={form.values.name}
        onChange={(e) => form.setValue("name", e.target.value)}
        error={form.touched.name ? form.errors.name : undefined}
      />

      <Select
        label="Parent Property"
        options={properties}
        value={form.values.parentPropertyId}
        onChange={(e) => form.setValue("parentPropertyId", e.target.value)}
        placeholder="Select property"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Zone / Area"
          placeholder="e.g. North Wing"
          value={form.values.zone}
          onChange={(e) => form.setValue("zone", e.target.value)}
        />
        <Select
          label="Location Type"
          options={LOCATION_TYPE_OPTIONS}
          value={form.values.locationType}
          onChange={(e) => form.setValue("locationType", e.target.value)}
          placeholder="Select type"
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Description of this location..."
        value={form.values.description}
        onChange={(e) => form.setValue("description", e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
