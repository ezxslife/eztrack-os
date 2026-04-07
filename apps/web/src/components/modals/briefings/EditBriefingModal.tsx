"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createBriefingSchema, type CreateBriefingValues } from "@/lib/validations/briefings";

interface EditBriefingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBriefingValues) => void | Promise<void>;
  briefing?: CreateBriefingValues;
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

export function EditBriefingModal({
  open,
  onClose,
  onSubmit,
  briefing,
}: EditBriefingModalProps) {
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

  useEffect(() => {
    if (briefing && open) {
      form.setValues({
        title: briefing.title ?? "",
        content: briefing.content ?? "",
        priority: briefing.priority ?? "normal",
        recipients: briefing.recipients ?? "",
        sourceModule: briefing.sourceModule ?? "manual",
        linkUrl: briefing.linkUrl ?? "",
      });
    }
  }, [briefing, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as CreateBriefingValues);
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
      title="Edit Briefing"
      size="md"
      submitLabel="Save Changes"
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
