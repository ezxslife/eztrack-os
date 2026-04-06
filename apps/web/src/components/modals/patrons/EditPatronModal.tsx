"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface PatronData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  ticketType: string;
  photoUrl: string;
  idType: string;
  idNumber: string;
}

interface EditPatronModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PatronData) => void | Promise<void>;
  patron?: PatronData;
}

const TICKET_TYPE_OPTIONS = [
  { value: "ga", label: "General Admission" },
  { value: "vip", label: "VIP" },
  { value: "staff", label: "Staff" },
  { value: "media", label: "Media" },
  { value: "vendor", label: "Vendor" },
];

const ID_TYPE_OPTIONS = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "state_id", label: "State ID" },
  { value: "military", label: "Military ID" },
  { value: "other", label: "Other" },
];

export function EditPatronModal({
  open,
  onClose,
  onSubmit,
  patron,
}: EditPatronModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patron) {
      setFirstName(patron.firstName);
      setLastName(patron.lastName);
      setEmail(patron.email);
      setPhone(patron.phone);
      setDob(patron.dob);
      setTicketType(patron.ticketType);
      setPhotoUrl(patron.photoUrl);
      setIdType(patron.idType);
      setIdNumber(patron.idNumber);
    }
  }, [patron]);

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dob,
        ticketType,
        photoUrl,
        idType,
        idNumber: idNumber.trim(),
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
      title="Edit Patron"
      size="md"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
        <Select
          label="Ticket Type"
          options={TICKET_TYPE_OPTIONS}
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value)}
          placeholder="Select ticket type"
        />
      </div>

      <div className="rounded-lg border-2 border-dashed border-[var(--border-default)] p-6 text-center">
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Click or drag to upload patron photo
        </p>
        {photoUrl && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">Photo uploaded</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </FormModal>
  );
}
