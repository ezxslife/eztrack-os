"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface BriefingData {
  title: string;
  content: string;
  priority: string;
  recipients: string;
  sourceModule: string;
  linkUrl: string;
}

interface EditBriefingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BriefingData) => void | Promise<void>;
  briefing?: BriefingData;
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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [recipients, setRecipients] = useState("");
  const [sourceModule, setSourceModule] = useState("manual");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (briefing) {
      setTitle(briefing.title);
      setContent(briefing.content);
      setPriority(briefing.priority);
      setRecipients(briefing.recipients);
      setSourceModule(briefing.sourceModule);
      setLinkUrl(briefing.linkUrl);
    }
  }, [briefing]);

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        priority,
        recipients,
        sourceModule,
        linkUrl: linkUrl.trim(),
      });
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
      isValid={isValid}
    >
      <Input
        label="Title"
        placeholder="Briefing title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        label="Content"
        placeholder="Briefing content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
        <Select
          label="Recipients"
          options={RECIPIENT_OPTIONS}
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="Select recipients"
        />
      </div>

      <Select
        label="Source Module"
        options={SOURCE_MODULE_OPTIONS}
        value={sourceModule}
        onChange={(e) => setSourceModule(e.target.value)}
      />

      <Input
        label="Link URL (optional)"
        type="url"
        placeholder="https://..."
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
      />
    </FormModal>
  );
}
