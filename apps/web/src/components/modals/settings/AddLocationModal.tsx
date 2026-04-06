"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface AddLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    parentPropertyId: string;
    zone: string;
    locationType: string;
    description: string;
  }) => void | Promise<void>;
  properties?: { value: string; label: string }[];
}

const LOCATION_TYPE_OPTIONS = [
  { value: "building", label: "Building" },
  { value: "gate", label: "Gate" },
  { value: "stage", label: "Stage" },
  { value: "tent", label: "Tent" },
  { value: "parking", label: "Parking" },
  { value: "other", label: "Other" },
];

export function AddLocationModal({
  open,
  onClose,
  onSubmit,
  properties = [],
}: AddLocationModalProps) {
  const [name, setName] = useState("");
  const [parentPropertyId, setParentPropertyId] = useState("");
  const [zone, setZone] = useState("");
  const [locationType, setLocationType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length > 0;

  const resetForm = () => {
    setName("");
    setParentPropertyId("");
    setZone("");
    setLocationType("");
    setDescription("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        parentPropertyId,
        zone: zone.trim(),
        locationType,
        description: description.trim(),
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
      title="Add Location"
      size="md"
      submitLabel="Add Location"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Name"
        placeholder="Location name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label="Parent Property"
        options={properties}
        value={parentPropertyId}
        onChange={(e) => setParentPropertyId(e.target.value)}
        placeholder="Select property"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Zone / Area"
          placeholder="e.g. North Wing"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        />
        <Select
          label="Location Type"
          options={LOCATION_TYPE_OPTIONS}
          value={locationType}
          onChange={(e) => setLocationType(e.target.value)}
          placeholder="Select type"
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Description of this location..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
