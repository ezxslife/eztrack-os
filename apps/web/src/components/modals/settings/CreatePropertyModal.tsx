"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface CreatePropertyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    timezone: string;
    capacity: string;
    notes: string;
  }) => void | Promise<void>;
}

const propertyTypeOptions = [
  { value: "festival_grounds", label: "Festival Grounds" },
  { value: "arena", label: "Arena" },
  { value: "stadium", label: "Stadium" },
  { value: "convention_center", label: "Convention Center" },
  { value: "park", label: "Park" },
  { value: "campus", label: "Campus" },
  { value: "other", label: "Other" },
];

const timezoneOptions = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
];

export function CreatePropertyModal({
  open,
  onClose,
  onSubmit,
}: CreatePropertyModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("festival_grounds");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [capacity, setCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        timezone,
        capacity,
        notes: notes.trim(),
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setType("festival_grounds");
    setAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setTimezone("America/New_York");
    setCapacity("");
    setNotes("");
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
      title="Create Property"
      subtitle="Create a new property"
      size="md"
      submitLabel="Create Property"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Name"
        placeholder="Property name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label="Type"
        options={propertyTypeOptions}
        value={type}
        onChange={(e) => setType(e.target.value)}
      />

      <Input
        label="Address"
        placeholder="Street address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Input
          label="City"
          placeholder="City..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Input
          label="State"
          placeholder="State..."
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <Input
          label="Zip Code"
          placeholder="Zip..."
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
        />
      </div>

      <Select
        label="Timezone"
        options={timezoneOptions}
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
      />

      <Input
        label="Capacity"
        type="number"
        placeholder="Maximum capacity..."
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
      />

      <Textarea
        label="Notes"
        placeholder="Additional notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
