"use client";

import { useState } from "react";
import { Upload, Image } from "lucide-react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface UploadMediaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    tags: string;
    isProtected: boolean;
    isPrimary: boolean;
  }) => void | Promise<void>;
}

export function UploadMediaModal({
  open,
  onClose,
  onSubmit,
}: UploadMediaModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        tags: tags.trim(),
        isProtected,
        isPrimary,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setTags("");
    setIsProtected(false);
    setIsPrimary(false);
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
      title="Upload Media"
      subtitle="Attach photos, videos, or documents to this incident"
      size="md"
      submitLabel="Upload"
      isSubmitting={isSubmitting}
    >
      {/* Drag-drop zone placeholder */}
      <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer">
        <div className="h-10 w-10 rounded-xl bg-[var(--surface-tertiary)] flex items-center justify-center">
          <Upload className="h-5 w-5 text-[var(--text-tertiary)]" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-[var(--text-primary)]">
            Drop files here or click to browse
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            PNG, JPG, PDF, MP4 up to 50MB
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <Image className="h-3.5 w-3.5" />
          <span>No file selected</span>
        </div>
      </div>

      <Input
        label="Title"
        placeholder="Name this attachment..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="What does this media show..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <Input
        label="Tags"
        placeholder="e.g. cctv, lobby, entrance (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        helperText="Separate multiple tags with commas"
      />

      <div className="flex flex-col gap-3 pt-1">
        <Toggle
          checked={isProtected}
          onChange={setIsProtected}
          label="Protected (restrict access to investigators)"
        />
        <Toggle
          checked={isPrimary}
          onChange={setIsPrimary}
          label="Mark as primary media"
        />
      </div>
    </FormModal>
  );
}
