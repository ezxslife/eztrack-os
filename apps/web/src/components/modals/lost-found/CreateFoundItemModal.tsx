"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface CreateFoundItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    category: string;
    foundLocation: string;
    foundBy: string;
    storageLocation: string;
    photoUrl: string;
    notes: string;
  }) => void | Promise<void>;
}

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "jewelry", label: "Jewelry" },
  { value: "clothing", label: "Clothing" },
  { value: "bags", label: "Bags" },
  { value: "documents", label: "Documents" },
  { value: "keys", label: "Keys" },
  { value: "other", label: "Other" },
];

export function CreateFoundItemModal({
  open,
  onClose,
  onSubmit,
}: CreateFoundItemModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [foundBy, setFoundBy] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = description.trim().length > 0 && category !== "";

  const resetForm = () => {
    setDescription("");
    setCategory("");
    setFoundLocation("");
    setFoundBy("");
    setStorageLocation("");
    setPhotoUrl("");
    setNotes("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        category,
        foundLocation: foundLocation.trim(),
        foundBy: foundBy.trim(),
        storageLocation: storageLocation.trim(),
        photoUrl,
        notes: notes.trim(),
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
      title="Log Found Item"
      size="md"
      submitLabel="Log Item"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Item Description"
        placeholder="Describe the item..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Select
        label="Category"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Select category"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Found Location"
          placeholder="Where was it found?"
          value={foundLocation}
          onChange={(e) => setFoundLocation(e.target.value)}
        />
        <Input
          label="Found By"
          placeholder="Who found it?"
          value={foundBy}
          onChange={(e) => setFoundBy(e.target.value)}
        />
      </div>

      <Input
        label="Storage Location"
        placeholder="Where is it being stored?"
        value={storageLocation}
        onChange={(e) => setStorageLocation(e.target.value)}
      />

      <div className="rounded-lg border-2 border-dashed border-[var(--border-default)] p-6 text-center">
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Click or drag to upload item photo
        </p>
        {photoUrl && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">Photo selected</p>
        )}
      </div>

      <Textarea
        label="Notes"
        placeholder="Additional notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
