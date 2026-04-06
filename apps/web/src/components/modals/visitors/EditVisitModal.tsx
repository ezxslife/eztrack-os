"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface VisitData {
  purpose: string;
  hostName: string;
  hostDepartment: string;
  expectedDate: string;
  expectedTime: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  vehiclePlate: string;
}

interface EditVisitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VisitData) => void | Promise<void>;
  initialData?: Partial<VisitData>;
}

const PURPOSE_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "delivery", label: "Delivery" },
  { value: "contractor", label: "Contractor" },
  { value: "interview", label: "Interview" },
  { value: "tour", label: "Tour" },
  { value: "other", label: "Other" },
];

const ID_TYPE_OPTIONS = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "badge", label: "Badge" },
  { value: "other", label: "Other" },
];

export function EditVisitModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditVisitModalProps) {
  const [purpose, setPurpose] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostDepartment, setHostDepartment] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [expectedTime, setExpectedTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setPurpose(initialData.purpose ?? "");
      setHostName(initialData.hostName ?? "");
      setHostDepartment(initialData.hostDepartment ?? "");
      setExpectedDate(initialData.expectedDate ?? "");
      setExpectedTime(initialData.expectedTime ?? "");
      setFirstName(initialData.firstName ?? "");
      setLastName(initialData.lastName ?? "");
      setCompany(initialData.company ?? "");
      setPhone(initialData.phone ?? "");
      setEmail(initialData.email ?? "");
      setIdType(initialData.idType ?? "");
      setIdNumber(initialData.idNumber ?? "");
      setVehiclePlate(initialData.vehiclePlate ?? "");
    }
  }, [open, initialData]);

  const isValid =
    purpose !== "" &&
    hostName.trim().length > 0 &&
    expectedDate.trim().length > 0 &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0;

  const resetForm = () => {
    setPurpose("");
    setHostName("");
    setHostDepartment("");
    setExpectedDate("");
    setExpectedTime("");
    setFirstName("");
    setLastName("");
    setCompany("");
    setPhone("");
    setEmail("");
    setIdType("");
    setIdNumber("");
    setVehiclePlate("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        purpose,
        hostName: hostName.trim(),
        hostDepartment: hostDepartment.trim(),
        expectedDate: expectedDate.trim(),
        expectedTime: expectedTime.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        idType,
        idNumber: idNumber.trim(),
        vehiclePlate: vehiclePlate.trim(),
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
      title="Edit Visit"
      size="md"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {/* Visit Details */}
      <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
        Visit Details
      </p>

      <Select
        label="Purpose of Visit"
        options={PURPOSE_OPTIONS}
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Select purpose"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Host Name"
          placeholder="Who are they visiting?"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />
        <Input
          label="Host Department"
          placeholder="Department"
          value={hostDepartment}
          onChange={(e) => setHostDepartment(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Expected Date"
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
        />
        <Input
          label="Expected Time"
          type="time"
          value={expectedTime}
          onChange={(e) => setExpectedTime(e.target.value)}
        />
      </div>

      {/* Visitor Info */}
      <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide pt-2">
        Visitor Information
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="First Name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          label="Last Name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <Input
        label="Company"
        placeholder="Company or organization"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Phone"
          placeholder="+1 (555) 000-0000"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Email"
          placeholder="email@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>

      <Input
        label="Vehicle Plate (Optional)"
        placeholder="License plate number"
        value={vehiclePlate}
        onChange={(e) => setVehiclePlate(e.target.value)}
      />
    </FormModal>
  );
}
