"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface CreateWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    category: string;
    priority: string;
    description: string;
    location: string;
    scheduledDate: string;
    dueDate: string;
    estimatedCost: number;
    assignTo: string;
  }) => void | Promise<void>;
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
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim().length > 0 && category !== "" && priority !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        priority,
        description: description.trim(),
        location,
        scheduledDate,
        dueDate,
        estimatedCost: parseFloat(estimatedCost) || 0,
        assignTo,
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setPriority("");
    setDescription("");
    setLocation("");
    setScheduledDate("");
    setDueDate("");
    setEstimatedCost("");
    setAssignTo("");
  };

  const handleClose = () => {
    resetForm();
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
      isValid={isValid}
    >
      <Input
        label="Title"
        placeholder="Work order title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Select category"
        />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          placeholder="Select priority"
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Describe the work to be done..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <Select
        label="Location"
        options={locations}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Select location"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Scheduled Date"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Estimated Cost ($)"
          type="number"
          placeholder="0.00"
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value)}
        />
        <Select
          label="Assign To"
          options={assignees}
          value={assignTo}
          onChange={(e) => setAssignTo(e.target.value)}
          placeholder="Select assignee"
        />
      </div>
    </FormModal>
  );
}
