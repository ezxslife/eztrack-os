"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { editDailyLogSchema, type EditDailyLogValues } from "@/lib/validations/daily-logs";

interface EditDailyLogModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EditDailyLogValues) => void | Promise<void>;
  initialData: EditDailyLogValues | null;
}

const LOCATION_OPTIONS = [
  { value: "main-lobby", label: "Main Lobby" },
  { value: "parking-a", label: "Parking Lot A" },
  { value: "parking-b", label: "Parking Lot B" },
  { value: "building-north", label: "North Building" },
  { value: "building-south", label: "South Building" },
  { value: "pool-area", label: "Pool Area" },
  { value: "fitness-center", label: "Fitness Center" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function EditDailyLogModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditDailyLogModalProps) {
  const form = useFormState({
    initialValues: { topic: "", location: "", priority: "low", notes: "", staffInvolved: "" },
    schema: editDailyLogSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      form.setValues({
        topic: initialData.topic ?? "",
        location: initialData.location ?? "",
        priority: initialData.priority ?? "low",
        notes: initialData.notes ?? "",
        staffInvolved: initialData.staffInvolved ?? "",
      });
    }
  }, [initialData, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as EditDailyLogValues);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit Daily Log"
      subtitle="Update this log entry"
      size="md"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Topic"
        placeholder="What happened?"
        value={form.values.topic}
        onChange={(e) => form.setValue("topic", e.target.value)}
        error={form.touched.topic ? form.errors.topic : undefined}
      />

      <Select
        label="Location"
        options={LOCATION_OPTIONS}
        value={form.values.location}
        onChange={(e) => form.setValue("location", e.target.value)}
        placeholder="Select location..."
      />

      <Select
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={form.values.priority}
        onChange={(e) => form.setValue("priority", e.target.value)}
        error={form.touched.priority ? form.errors.priority : undefined}
      />

      <Textarea
        label="Notes"
        placeholder="Additional details..."
        value={form.values.notes}
        onChange={(e) => form.setValue("notes", e.target.value)}
        rows={3}
      />

      <Input
        label="Staff Involved"
        placeholder="Names of staff involved..."
        value={form.values.staffInvolved}
        onChange={(e) => form.setValue("staffInvolved", e.target.value)}
      />
    </FormModal>
  );
}
