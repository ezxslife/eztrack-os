"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface AddEvidenceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EvidenceFormData) => void | Promise<void>;
}

interface EvidenceFormData {
  title: string;
  description: string;
  type: string;
  storageLocation: string;
  storageFacility: string;
  itemNumber: string;
  externalIdentifier: string;
}

const EVIDENCE_TYPE_OPTIONS = [
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "document", label: "Document" },
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
];

export function AddEvidenceModal({
  open,
  onClose,
  onSubmit,
}: AddEvidenceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [storageFacility, setStorageFacility] = useState("");
  const [itemNumber, setItemNumber] = useState("");
  const [externalIdentifier, setExternalIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim() !== "" && type !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        type,
        storageLocation,
        storageFacility,
        itemNumber,
        externalIdentifier,
      });
      setTitle("");
      setDescription("");
      setType("");
      setStorageLocation("");
      setStorageFacility("");
      setItemNumber("");
      setExternalIdentifier("");
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
      title="Add Evidence"
      subtitle="Log a new evidence item for this case"
      size="md"
      submitLabel="Add Evidence"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Title"
        placeholder="Evidence title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="Describe the evidence item..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />

      <Select
        label="Type"
        options={EVIDENCE_TYPE_OPTIONS}
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Select type..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Storage Location"
          placeholder="Shelf, locker, etc."
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
        />
        <Input
          label="Storage Facility"
          placeholder="Building or facility"
          value={storageFacility}
          onChange={(e) => setStorageFacility(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Item Number"
          placeholder="Internal item #"
          value={itemNumber}
          onChange={(e) => setItemNumber(e.target.value)}
        />
        <Input
          label="External Identifier"
          placeholder="External ref #"
          value={externalIdentifier}
          onChange={(e) => setExternalIdentifier(e.target.value)}
        />
      </div>
    </FormModal>
  );
}
