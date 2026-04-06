"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    address: string;
    propertyType: string;
    timezone: string;
  }) => void | Promise<void>;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "venue", label: "Venue" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "other", label: "Other" },
];

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "UTC", label: "UTC" },
];

export function AddPropertyModal({
  open,
  onClose,
  onSubmit,
}: AddPropertyModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [timezone, setTimezone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length > 0;

  const resetForm = () => {
    setName("");
    setAddress("");
    setPropertyType("");
    setTimezone("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        address: address.trim(),
        propertyType,
        timezone,
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
      title="Add Property"
      size="md"
      submitLabel="Add Property"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Name"
        placeholder="Property name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Textarea
        label="Address"
        placeholder="Full address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        rows={2}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Property Type"
          options={PROPERTY_TYPE_OPTIONS}
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          placeholder="Select type"
        />
        <Select
          label="Timezone"
          options={TIMEZONE_OPTIONS}
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="Select timezone"
        />
      </div>
    </FormModal>
  );
}
