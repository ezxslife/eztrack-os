"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createVehicleSchema, type CreateVehicleValues } from "@/lib/validations/vehicles";

interface CreateVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVehicleValues & { year: number }) => void | Promise<void>;
  owners?: { value: string; label: string }[];
}

const VEHICLE_TYPE_OPTIONS = [
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bus", label: "Bus" },
  { value: "other", label: "Other" },
];

const OWNER_TYPE_OPTIONS = [
  { value: "patron", label: "Patron" },
  { value: "staff", label: "Staff" },
  { value: "contact", label: "Contact" },
  { value: "event", label: "Event" },
];

export function CreateVehicleModal({
  open,
  onClose,
  onSubmit,
  owners = [],
}: CreateVehicleModalProps) {
  const form = useFormState({
    initialValues: {
      make: "",
      model: "",
      year: "",
      color: "",
      licensePlate: "",
      licenseState: "",
      vin: "",
      vehicleType: "",
      ownerType: "",
      ownerId: "",
      notes: "",
    },
    schema: createVehicleSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form.values,
        year: parseInt(form.values.year ?? "0") || 0,
      } as CreateVehicleValues & { year: number });
      form.reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Add Vehicle"
      size="md"
      submitLabel="Add Vehicle"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Make"
          placeholder="e.g. Toyota"
          value={form.values.make}
          onChange={(e) => form.setValue("make", e.target.value)}
        />
        <Input
          label="Model"
          placeholder="e.g. Camry"
          value={form.values.model}
          onChange={(e) => form.setValue("model", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Year"
          type="number"
          placeholder="e.g. 2024"
          value={form.values.year}
          onChange={(e) => form.setValue("year", e.target.value)}
        />
        <Input
          label="Color"
          placeholder="e.g. Silver"
          value={form.values.color}
          onChange={(e) => form.setValue("color", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="License Plate (required)"
          placeholder="ABC-1234"
          value={form.values.licensePlate}
          onChange={(e) => form.setValue("licensePlate", e.target.value)}
          error={form.touched.licensePlate ? form.errors.licensePlate : undefined}
        />
        <Input
          label="License State"
          placeholder="e.g. CA"
          value={form.values.licenseState}
          onChange={(e) => form.setValue("licenseState", e.target.value)}
        />
      </div>

      <Input
        label="VIN"
        placeholder="Vehicle Identification Number"
        value={form.values.vin}
        onChange={(e) => form.setValue("vin", e.target.value)}
      />

      <Select
        label="Vehicle Type"
        options={VEHICLE_TYPE_OPTIONS}
        value={form.values.vehicleType}
        onChange={(e) => form.setValue("vehicleType", e.target.value)}
        placeholder="Select vehicle type"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Owner Type"
          options={OWNER_TYPE_OPTIONS}
          value={form.values.ownerType}
          onChange={(e) => form.setValue("ownerType", e.target.value)}
          placeholder="Select owner type"
        />
        {form.values.ownerType && (
          <Select
            label="Owner"
            options={owners}
            value={form.values.ownerId}
            onChange={(e) => form.setValue("ownerId", e.target.value)}
            placeholder="Select owner"
          />
        )}
      </div>

      <Textarea
        label="Notes"
        placeholder="Additional notes..."
        value={form.values.notes}
        onChange={(e) => form.setValue("notes", e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
