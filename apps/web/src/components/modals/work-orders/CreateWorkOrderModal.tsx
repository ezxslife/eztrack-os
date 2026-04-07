"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createWorkOrderSchema, type CreateWorkOrderValues } from "@/lib/validations/work-orders";

interface CreateWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkOrderValues & { estimatedCost: number }) => void | Promise<void>;
  locations?: { value: string; label: string }[];
  assignees?: { value: string; label: string }[];
}

const CATEGORY_OPTIONS = [
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "structural", label: "Structural" },
  { value: "cleanup", label: "Cleanup" },
  { value: "equipment", label: "Equipment" },
  { value: "hvac", label: "HVAC" },
  { value: "security", label: "Security" },
  { value: "lighting", label: "Lighting" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function CreateWorkOrderModal({
  open,
  onClose,
  onSubmit,
  locations = [],
  assignees = [],
}: CreateWorkOrderModalProps) {
  const form = useFormState({
    initialValues: {
      title: "",
      category: "",
      priority: "",
      description: "",
      location: "",
      scheduledDate: "",
      dueDate: "",
      estimatedCost: "",
      assignTo: "",
    },
    schema: createWorkOrderSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form.values,
        estimatedCost: parseFloat(form.values.estimatedCost ?? "0") || 0,
      } as CreateWorkOrderValues & { estimatedCost: number });
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
      title="Create Work Order"
      size="lg"
      submitLabel="Create"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Title"
        placeholder="Work order title..."
        value={form.values.title}
        onChange={(e) => form.setValue("title", e.target.value)}
        error={form.touched.title ? form.errors.title : undefined}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={form.values.category}
          onChange={(e) => form.setValue("category", e.target.value)}
          placeholder="Select category"
          error={form.touched.category ? form.errors.category : undefined}
        />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={form.values.priority}
          onChange={(e) => form.setValue("priority", e.target.value)}
          placeholder="Select priority"
          error={form.touched.priority ? form.errors.priority : undefined}
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Describe the work to be done..."
        value={form.values.description}
        onChange={(e) => form.setValue("description", e.target.value)}
        rows={3}
      />

      <Select
        label="Location"
        options={locations}
        value={form.values.location}
        onChange={(e) => form.setValue("location", e.target.value)}
        placeholder="Select location"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Scheduled Date"
          type="date"
          value={form.values.scheduledDate}
          onChange={(e) => form.setValue("scheduledDate", e.target.value)}
        />
        <Input
          label="Due Date"
          type="date"
          value={form.values.dueDate}
          onChange={(e) => form.setValue("dueDate", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Estimated Cost ($)"
          type="number"
          placeholder="0.00"
          value={form.values.estimatedCost}
          onChange={(e) => form.setValue("estimatedCost", e.target.value)}
        />
        <Select
          label="Assign To"
          options={assignees}
          value={form.values.assignTo}
          onChange={(e) => form.setValue("assignTo", e.target.value)}
          placeholder="Select assignee"
        />
      </div>
    </FormModal>
  );
}
