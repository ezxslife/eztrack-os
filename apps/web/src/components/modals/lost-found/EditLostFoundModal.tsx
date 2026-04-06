"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface LostFoundData {
  description: string;
  category: string;
  location: string;
  reportedBy: string;
  storageLocation: string;
  notes: string;
}

interface EditLostFoundModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LostFoundData) => void | Promise<void>;
  item?: LostFoundData;
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

export function EditLostFoundModal({
  open,
  onClose,
  onSubmit,
  item,
}: EditLostFoundModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setDescription(item.description);
      setCategory(item.category);
      setLocation(item.location);
      setReportedBy(item.reportedBy);
      setStorageLocation(item.storageLocation);
      setNotes(item.notes);
    }
  }, [item]);

  const isValid = description.trim().length > 0 && category !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        category,
        location: location.trim(),
        reportedBy: reportedBy.trim(),
        storageLocation: storageLocation.trim(),
        notes: notes.trim(),
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
      title="Edit Lost & Found Entry"
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
          label="Location"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <Input
          label="Reported By"
          placeholder="Name"
          value={reportedBy}
          onChange={(e) => setReportedBy(e.target.value)}
        />
      </div>

      <Input
        label="Storage Location"
        placeholder="Where is it stored?"
        value={storageLocation}
        onChange={(e) => setStorageLocation(e.target.value)}
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
