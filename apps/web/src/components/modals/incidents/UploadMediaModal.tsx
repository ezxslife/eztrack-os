"use client";

import { useRef, useState } from "react";
import { Upload, Image, FileText, X } from "lucide-react";
import { FormModal } from "@/components/modals/FormModal";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface UploadMediaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    file: File;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!selectedFile) {
      setFileError("Select a file to upload.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        file: selectedFile,
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
    setSelectedFile(null);
    setFileError(null);
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
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,video/*"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setSelectedFile(file);
          setFileError(null);
        }}
      />

      <div
        className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
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
        {selectedFile ? (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
            <FileText className="h-3.5 w-3.5" />
            <span className="max-w-[220px] truncate">{selectedFile.name}</span>
            <IconButton
              className="h-7 w-7 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              label="Clear selected file"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedFile(null);
              }}
              size="sm"
              variant="ghost"
            >
              <X className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
            <Image className="h-3.5 w-3.5" />
            <span>No file selected</span>
          </div>
        )}
      </div>
      {fileError && <p className="text-[11px] text-red-400 -mt-2">{fileError}</p>}

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
