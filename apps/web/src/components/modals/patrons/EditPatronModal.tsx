"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useFormState } from "@/hooks/useFormState";
import { editPatronSchema, type EditPatronValues } from "@/lib/validations/patrons";

interface EditPatronModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EditPatronValues) => void | Promise<void>;
  patron?: EditPatronValues;
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
  const form = useFormState({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: "",
      ticketType: "",
      photoUrl: "",
      idType: "",
      idNumber: "",
    },
    schema: editPatronSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patron && open) {
      form.setValues({
        firstName: patron.firstName ?? "",
        lastName: patron.lastName ?? "",
        email: patron.email ?? "",
        phone: patron.phone ?? "",
        dob: patron.dob ?? "",
        ticketType: patron.ticketType ?? "",
        photoUrl: patron.photoUrl ?? "",
        idType: patron.idType ?? "",
        idNumber: patron.idNumber ?? "",
      });
    }
  }, [patron, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as EditPatronValues);
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
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={form.values.email}
          onChange={(e) => form.setValue("email", e.target.value)}
          error={form.touched.email ? form.errors.email : undefined}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={form.values.phone}
          onChange={(e) => form.setValue("phone", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          value={form.values.dob}
          onChange={(e) => form.setValue("dob", e.target.value)}
        />
        <Select
          label="Ticket Type"
          options={TICKET_TYPE_OPTIONS}
          value={form.values.ticketType}
          onChange={(e) => form.setValue("ticketType", e.target.value)}
          placeholder="Select ticket type"
        />
      </div>

      <div className="rounded-lg border-2 border-dashed border-[var(--border-default)] p-6 text-center">
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Click or drag to upload patron photo
        </p>
        {form.values.photoUrl && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">Photo uploaded</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="ID Type"
          options={ID_TYPE_OPTIONS}
          value={form.values.idType}
          onChange={(e) => form.setValue("idType", e.target.value)}
          placeholder="Select ID type"
        />
        <Input
          label="ID Number"
          placeholder="ID number"
          value={form.values.idNumber}
          onChange={(e) => form.setValue("idNumber", e.target.value)}
        />
      </div>
    </FormModal>
  );
}
