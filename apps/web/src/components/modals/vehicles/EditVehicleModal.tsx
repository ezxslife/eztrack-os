"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface VehicleData {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  licenseState: string;
  vin: string;
  vehicleType: string;
  ownerType: string;
  ownerId: string;
  notes: string;
}

interface EditVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VehicleData) => void | Promise<void>;
  vehicle?: VehicleData;
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

export function EditVehicleModal({
  open,
  onClose,
  onSubmit,
  vehicle,
  owners = [],
}: EditVehicleModalProps) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [ownerType, setOwnerType] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(String(vehicle.year));
      setColor(vehicle.color);
      setLicensePlate(vehicle.licensePlate);
      setLicenseState(vehicle.licenseState);
      setVin(vehicle.vin);
      setVehicleType(vehicle.vehicleType);
      setOwnerType(vehicle.ownerType);
      setOwnerId(vehicle.ownerId);
      setNotes(vehicle.notes);
    }
  }, [vehicle]);

  const isValid = licensePlate.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year) || 0,
        color: color.trim(),
        licensePlate: licensePlate.trim(),
        licenseState: licenseState.trim(),
        vin: vin.trim(),
        vehicleType,
        ownerType,
        ownerId,
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
      title="Edit Vehicle"
      size="md"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Make"
          placeholder="e.g. Toyota"
          value={make}
          onChange={(e) => setMake(e.target.value)}
        />
        <Input
          label="Model"
          placeholder="e.g. Camry"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Year"
          type="number"
          placeholder="e.g. 2024"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <Input
          label="Color"
          placeholder="e.g. Silver"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="License Plate (required)"
          placeholder="ABC-1234"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
        />
        <Input
          label="License State"
          placeholder="e.g. CA"
          value={licenseState}
          onChange={(e) => setLicenseState(e.target.value)}
        />
      </div>

      <Input
        label="VIN"
        placeholder="Vehicle Identification Number"
        value={vin}
        onChange={(e) => setVin(e.target.value)}
      />

      <Select
        label="Vehicle Type"
        options={VEHICLE_TYPE_OPTIONS}
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        placeholder="Select vehicle type"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Owner Type"
          options={OWNER_TYPE_OPTIONS}
          value={ownerType}
          onChange={(e) => setOwnerType(e.target.value)}
          placeholder="Select owner type"
        />
        {ownerType && (
          <Select
            label="Owner"
            options={owners}
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="Select owner"
          />
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
