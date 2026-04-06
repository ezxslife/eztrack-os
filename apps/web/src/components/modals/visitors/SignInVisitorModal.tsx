"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface SignInVisitorModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    idType: string;
    idNumber: string;
    vehiclePlate: string;
    parkingLocation: string;
  }) => void | Promise<void>;
  visitorName?: string;
  badgeNumber?: string;
}

const ID_TYPE_OPTIONS = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "state_id", label: "State ID" },
  { value: "military", label: "Military ID" },
  { value: "other", label: "Other" },
];

export function SignInVisitorModal({
  open,
  onClose,
  onSubmit,
  visitorName = "",
  badgeNumber = "",
}: SignInVisitorModalProps) {
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [parkingLocation, setParkingLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = idType !== "" && idNumber.trim().length > 0;

  const resetForm = () => {
    setIdType("");
    setIdNumber("");
    setVehiclePlate("");
    setParkingLocation("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        idType,
        idNumber: idNumber.trim(),
        vehiclePlate: vehiclePlate.trim(),
        parkingLocation: parkingLocation.trim(),
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
      title="Sign In Visitor"
      size="sm"
      submitLabel="Sign In"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="rounded-lg bg-[var(--surface-secondary)] p-3 space-y-1">
        <p className="text-[13px] font-medium text-[var(--text-primary)]">{visitorName}</p>
        {badgeNumber && (
          <p className="text-[12px] text-[var(--text-tertiary)]">Badge: {badgeNumber}</p>
        )}
      </div>

      <Select
        label="ID Type"
        options={ID_TYPE_OPTIONS}
        value={idType}
        onChange={(e) => setIdType(e.target.value)}
        placeholder="Select ID type"
      />

      <Input
        label="ID Number"
        placeholder="ID number"
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value)}
      />

      <Input
        label="Vehicle Plate (optional)"
        placeholder="License plate"
        value={vehiclePlate}
        onChange={(e) => setVehiclePlate(e.target.value)}
      />

      <Input
        label="Parking Location (optional)"
        placeholder="Lot or space number"
        value={parkingLocation}
        onChange={(e) => setParkingLocation(e.target.value)}
      />
    </FormModal>
  );
}
