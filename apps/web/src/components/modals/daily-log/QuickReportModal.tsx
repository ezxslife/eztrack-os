"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { quickReportSchema, type QuickReportValues } from "@/lib/validations/daily-logs";

interface QuickReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuickReportValues) => void | Promise<void>;
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

export function QuickReportModal({
  open,
  onClose,
  onSubmit,
}: QuickReportModalProps) {
  const form = useFormState({
    initialValues: { topic: "", location: "", priority: "low", notes: "" },
    schema: quickReportSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as QuickReportValues);
      form.reset();
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
      title="Quick Report"
      subtitle="Rapid entry for daily log"
      size="sm"
      submitLabel="Log Entry"
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
        rows={2}
      />
    </FormModal>
  );
}
