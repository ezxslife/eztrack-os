"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface PersonnelData {
  firstName: string;
  lastName: string;
  role: string;
  badgeNumber: string;
  phone: string;
  email: string;
  shift: string;
  zone: string;
  certifications: string;
  startDate: string;
  emergencyContact: string;
  notes: string;
}

interface EditPersonnelModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PersonnelData) => void | Promise<void>;
  initialData?: PersonnelData;
}

const ROLE_OPTIONS = [
  { value: "security_officer", label: "Security Officer" },
  { value: "supervisor", label: "Supervisor" },
  { value: "manager", label: "Manager" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "medical", label: "Medical" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "coordinator", label: "Coordinator" },
  { value: "volunteer", label: "Volunteer" },
];

const SHIFT_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "swing", label: "Swing" },
  { value: "night", label: "Night" },
  { value: "on_call", label: "On Call" },
];

const ZONE_OPTIONS = [
  { value: "zone_a", label: "Zone A" },
  { value: "zone_b", label: "Zone B" },
  { value: "zone_c", label: "Zone C" },
  { value: "zone_d", label: "Zone D" },
  { value: "roaming", label: "Roaming" },
  { value: "command_post", label: "Command Post" },
];

export function EditPersonnelModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditPersonnelModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shift, setShift] = useState("");
  const [zone, setZone] = useState("");
  const [certifications, setCertifications] = useState("");
  const [startDate, setStartDate] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName);
      setLastName(initialData.lastName);
      setRole(initialData.role);
      setBadgeNumber(initialData.badgeNumber);
      setPhone(initialData.phone);
      setEmail(initialData.email);
      setShift(initialData.shift);
      setZone(initialData.zone);
      setCertifications(initialData.certifications);
      setStartDate(initialData.startDate);
      setEmergencyContact(initialData.emergencyContact);
      setNotes(initialData.notes);
    }
  }, [initialData]);

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    role.length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        badgeNumber: badgeNumber.trim(),
        phone: phone.trim(),
        email: email.trim(),
        shift,
        zone,
        certifications: certifications.trim(),
        startDate,
        emergencyContact: emergencyContact.trim(),
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
      title="Edit Personnel"
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
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Select role"
        />
        <Input
          label="Badge Number"
          placeholder="B-1234"
          value={badgeNumber}
          onChange={(e) => setBadgeNumber(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Shift"
          options={SHIFT_OPTIONS}
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          placeholder="Select shift"
        />
        <Select
          label="Zone"
          options={ZONE_OPTIONS}
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder="Select zone"
        />
      </div>

      <Textarea
        label="Certifications"
        placeholder="List certifications, one per line"
        value={certifications}
        onChange={(e) => setCertifications(e.target.value)}
        rows={2}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Emergency Contact"
          placeholder="Name & phone"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
        />
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
