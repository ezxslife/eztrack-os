"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface FoundItemData {
  description: string;
  category: string;
  foundLocation: string;
  foundBy: string;
  storageLocation: string;
  condition: string;
  notes: string;
}

interface EditFoundItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FoundItemData) => void | Promise<void>;
  initialData?: Partial<FoundItemData>;
}

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "jewelry", label: "Jewelry" },
  { value: "wallet_purse", label: "Wallet / Purse" },
  { value: "keys", label: "Keys" },
  { value: "bags", label: "Bags" },
  { value: "documents", label: "Documents" },
  { value: "other", label: "Other" },
];

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "damaged", label: "Damaged" },
];

export function EditFoundItemModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditFoundItemModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [foundBy, setFoundBy] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setDescription(initialData.description ?? "");
      setCategory(initialData.category ?? "");
      setFoundLocation(initialData.foundLocation ?? "");
      setFoundBy(initialData.foundBy ?? "");
      setStorageLocation(initialData.storageLocation ?? "");
      setCondition(initialData.condition ?? "");
      setNotes(initialData.notes ?? "");
    }
  }, [open, initialData]);

  const isValid = description.trim().length > 0 && category !== "";

  const resetForm = () => {
    setDescription("");
    setCategory("");
    setFoundLocation("");
    setFoundBy("");
    setStorageLocation("");
    setCondition("");
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
        condition,
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
      title="Edit Found Item"
      size="md"
      submitLabel="Save Changes"
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

      <Select
        label="Condition"
        options={CONDITION_OPTIONS}
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
        placeholder="Select condition"
      />

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
