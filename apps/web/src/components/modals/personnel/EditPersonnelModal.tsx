"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createPersonnelSchema, type CreatePersonnelValues } from "@/lib/validations/personnel";

interface EditPersonnelModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePersonnelValues) => void | Promise<void>;
  initialData?: CreatePersonnelValues;
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
  const form = useFormState({
    initialValues: {
      firstName: "",
      lastName: "",
      role: "",
      badgeNumber: "",
      phone: "",
      email: "",
      shift: "",
      zone: "",
      certifications: "",
      startDate: "",
      emergencyContact: "",
      notes: "",
    },
    schema: createPersonnelSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      form.setValues({
        firstName: initialData.firstName ?? "",
        lastName: initialData.lastName ?? "",
        role: initialData.role ?? "",
        badgeNumber: initialData.badgeNumber ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        shift: initialData.shift ?? "",
        zone: initialData.zone ?? "",
        certifications: initialData.certifications ?? "",
        startDate: initialData.startDate ?? "",
        emergencyContact: initialData.emergencyContact ?? "",
        notes: initialData.notes ?? "",
      });
    }
  }, [initialData, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as CreatePersonnelValues);
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
      isValid={form.isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="First name"
          value={form.values.firstName}
          onChange={(e) => form.setValue("firstName", e.target.value)}
          error={form.touched.firstName ? form.errors.firstName : undefined}
        />
        <Input
          label="Last Name"
          placeholder="Last name"
          value={form.values.lastName}
          onChange={(e) => form.setValue("lastName", e.target.value)}
          error={form.touched.lastName ? form.errors.lastName : undefined}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={form.values.role}
          onChange={(e) => form.setValue("role", e.target.value)}
          placeholder="Select role"
          error={form.touched.role ? form.errors.role : undefined}
        />
        <Input
          label="Badge Number"
          placeholder="B-1234"
          value={form.values.badgeNumber}
          onChange={(e) => form.setValue("badgeNumber", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={form.values.phone}
          onChange={(e) => form.setValue("phone", e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={form.values.email}
          onChange={(e) => form.setValue("email", e.target.value)}
          error={form.touched.email ? form.errors.email : undefined}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Shift"
          options={SHIFT_OPTIONS}
          value={form.values.shift}
          onChange={(e) => form.setValue("shift", e.target.value)}
          placeholder="Select shift"
        />
        <Select
          label="Zone"
          options={ZONE_OPTIONS}
          value={form.values.zone}
          onChange={(e) => form.setValue("zone", e.target.value)}
          placeholder="Select zone"
        />
      </div>

      <Textarea
        label="Certifications"
        placeholder="List certifications, one per line"
        value={form.values.certifications}
        onChange={(e) => form.setValue("certifications", e.target.value)}
        rows={2}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={form.values.startDate}
          onChange={(e) => form.setValue("startDate", e.target.value)}
        />
        <Input
          label="Emergency Contact"
          placeholder="Name & phone"
          value={form.values.emergencyContact}
          onChange={(e) => form.setValue("emergencyContact", e.target.value)}
        />
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
