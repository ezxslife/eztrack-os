"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface LocationOption {
  value: string;
  label: string;
}

interface CreateLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    parentLocation: string;
    locationType: string;
    code: string;
    capacity: string;
    description: string;
  }) => void | Promise<void>;
  existingLocations?: LocationOption[];
}

const locationTypeOptions = [
  { value: "zone", label: "Zone" },
  { value: "gate", label: "Gate" },
  { value: "building", label: "Building" },
  { value: "stage", label: "Stage" },
  { value: "parking", label: "Parking" },
  { value: "medical", label: "Medical" },
  { value: "command_post", label: "Command Post" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
];

export function CreateLocationModal({
  open,
  onClose,
  onSubmit,
  existingLocations = [],
}: CreateLocationModalProps) {
  const [name, setName] = useState("");
  const [parentLocation, setParentLocation] = useState("none");
  const [locationType, setLocationType] = useState("zone");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentOptions: LocationOption[] = [
    { value: "none", label: "Top Level" },
    ...existingLocations,
  ];

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        parentLocation,
        locationType,
        code: code.trim(),
        capacity,
        description: description.trim(),
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setParentLocation("none");
    setLocationType("zone");
    setCode("");
    setCapacity("");
    setDescription("");
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
      title="Create Location"
      subtitle="Create a location within a property"
      size="sm"
      submitLabel="Create Location"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Name"
        placeholder="Location name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label="Parent Location"
        options={parentOptions}
        value={parentLocation}
        onChange={(e) => setParentLocation(e.target.value)}
      />

      <Select
        label="Location Type"
        options={locationTypeOptions}
        value={locationType}
        onChange={(e) => setLocationType(e.target.value)}
      />

      <Input
        label="Code"
        placeholder="Short code, e.g., GATE-A1"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <Input
        label="Capacity (optional)"
        type="number"
        placeholder="Maximum capacity..."
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="Location description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
