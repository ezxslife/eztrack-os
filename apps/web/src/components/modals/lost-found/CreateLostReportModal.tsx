"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface CreateLostReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    category: string;
    lastSeenLocation: string;
    reportedByName: string;
    reportedByPhone: string;
    reportedByEmail: string;
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

export function CreateLostReportModal({
  open,
  onClose,
  onSubmit,
}: CreateLostReportModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [reportedByName, setReportedByName] = useState("");
  const [reportedByPhone, setReportedByPhone] = useState("");
  const [reportedByEmail, setReportedByEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = description.trim().length > 0 && category !== "";

  const resetForm = () => {
    setDescription("");
    setCategory("");
    setLastSeenLocation("");
    setReportedByName("");
    setReportedByPhone("");
    setReportedByEmail("");
    setNotes("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        category,
        lastSeenLocation: lastSeenLocation.trim(),
        reportedByName: reportedByName.trim(),
        reportedByPhone: reportedByPhone.trim(),
        reportedByEmail: reportedByEmail.trim(),
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
      title="Report Lost Item"
      size="md"
      submitLabel="Submit Report"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Item Description"
        placeholder="Describe the lost item..."
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

      <Input
        label="Last Seen Location"
        placeholder="Where was it last seen?"
        value={lastSeenLocation}
        onChange={(e) => setLastSeenLocation(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Reported By"
          placeholder="Name"
          value={reportedByName}
          onChange={(e) => setReportedByName(e.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={reportedByPhone}
          onChange={(e) => setReportedByPhone(e.target.value)}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        value={reportedByEmail}
        onChange={(e) => setReportedByEmail(e.target.value)}
      />

      <Textarea
        label="Notes"
        placeholder="Any additional details..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
