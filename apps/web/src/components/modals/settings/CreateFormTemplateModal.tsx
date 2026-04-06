"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface CreateFormTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    module: string;
    category: string;
    isRequired: boolean;
    isActive: boolean;
  }) => void | Promise<void>;
}

const moduleOptions = [
  { value: "incidents", label: "Incidents" },
  { value: "cases", label: "Cases" },
  { value: "dispatch", label: "Dispatch" },
  { value: "work_orders", label: "Work Orders" },
];

const categoryOptions = [
  { value: "injury", label: "Injury" },
  { value: "witness", label: "Witness" },
  { value: "medical", label: "Medical" },
  { value: "use_of_force", label: "Use of Force" },
  { value: "property_damage", label: "Property Damage" },
  { value: "custom", label: "Custom" },
];

export function CreateFormTemplateModal({
  open,
  onClose,
  onSubmit,
}: CreateFormTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState("incidents");
  const [category, setCategory] = useState("custom");
  const [isRequired, setIsRequired] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        module,
        category,
        isRequired,
        isActive,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setDescription("");
    setModule("incidents");
    setCategory("custom");
    setIsRequired(false);
    setIsActive(true);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Create Form Template"
      subtitle="Create a new supplemental form template"
      size="md"
      submitLabel="Create Template"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Name"
        placeholder="Template name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="Template description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <Select
        label="Module"
        options={moduleOptions}
        value={module}
        onChange={(e) => setModule(e.target.value)}
      />

      <Select
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <Toggle
        label="Required"
        checked={isRequired}
        onChange={setIsRequired}
      />

      <Toggle
        label="Active"
        checked={isActive}
        onChange={setIsActive}
      />

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Form fields can be configured after creation.
      </p>
    </FormModal>
  );
}
