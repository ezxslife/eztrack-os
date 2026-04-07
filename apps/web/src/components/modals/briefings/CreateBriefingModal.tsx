"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createBriefingSchema, type CreateBriefingValues } from "@/lib/validations/briefings";

interface CreateBriefingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBriefingValues) => void | Promise<void>;
}

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
];

const RECIPIENT_OPTIONS = [
  { value: "all_staff", label: "All Staff" },
  { value: "managers", label: "Managers" },
  { value: "specific_role", label: "Specific Role" },
];

const SOURCE_MODULE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "incident", label: "Incident" },
  { value: "dispatch", label: "Dispatch" },
];

export function CreateBriefingModal({
  open,
  onClose,
  onSubmit,
}: CreateBriefingModalProps) {
  const form = useFormState({
    initialValues: {
      title: "",
      content: "",
      priority: "normal",
      recipients: "",
      sourceModule: "manual",
      linkUrl: "",
    },
    schema: createBriefingSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as CreateBriefingValues);
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
      title="Create Briefing"
      size="md"
      submitLabel="Publish"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Input
        label="Title"
        placeholder="Briefing title..."
        value={form.values.title}
        onChange={(e) => form.setValue("title", e.target.value)}
        error={form.touched.title ? form.errors.title : undefined}
      />

      <Textarea
        label="Content"
        placeholder="Briefing content..."
        value={form.values.content}
        onChange={(e) => form.setValue("content", e.target.value)}
        rows={6}
        error={form.touched.content ? form.errors.content : undefined}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={form.values.priority}
          onChange={(e) => form.setValue("priority", e.target.value)}
          error={form.touched.priority ? form.errors.priority : undefined}
        />
        <Select
          label="Recipients"
          options={RECIPIENT_OPTIONS}
          value={form.values.recipients}
          onChange={(e) => form.setValue("recipients", e.target.value)}
          placeholder="Select recipients"
        />
      </div>

      <Select
        label="Source Module"
        options={SOURCE_MODULE_OPTIONS}
        value={form.values.sourceModule}
        onChange={(e) => form.setValue("sourceModule", e.target.value)}
      />

      <Input
        label="Link URL (optional)"
        type="url"
        placeholder="https://..."
        value={form.values.linkUrl}
        onChange={(e) => form.setValue("linkUrl", e.target.value)}
      />
    </FormModal>
  );
}
