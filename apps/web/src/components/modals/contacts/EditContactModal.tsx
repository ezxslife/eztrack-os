"use client";

import { useState, useLayoutEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useFormState } from "@/hooks/useFormState";
import { createContactSchema, type CreateContactValues } from "@/lib/validations/contacts";

interface EditContactModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactValues) => void | Promise<void>;
  contact?: CreateContactValues;
}

const CONTACT_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
];

const CATEGORY_OPTIONS = [
  { value: "vendor", label: "Vendor" },
  { value: "law_enforcement", label: "Law Enforcement" },
  { value: "emergency_services", label: "Emergency Services" },
  { value: "media", label: "Media" },
  { value: "other", label: "Other" },
];

const ID_TYPE_OPTIONS = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "state_id", label: "State ID" },
  { value: "badge", label: "Badge Number" },
  { value: "other", label: "Other" },
];

export function EditContactModal({
  open,
  onClose,
  onSubmit,
  contact,
}: EditContactModalProps) {
  const emptyValues: CreateContactValues = {
    contactType: "individual",
    firstName: "",
    lastName: "",
    organizationName: "",
    category: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    address: "",
    title: "",
    idType: "",
    idNumber: "",
    notes: "",
  };
  const form = useFormState({
    initialValues: emptyValues,
    schema: createContactSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    if (!open) {
      setIsReady(false);
      form.reset();
      return;
    }

    setIsReady(false);
    form.setValues(
      contact
        ? {
            contactType: contact.contactType ?? "individual",
            firstName: contact.firstName ?? "",
            lastName: contact.lastName ?? "",
            organizationName: contact.organizationName ?? "",
            category: contact.category ?? "",
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            secondaryPhone: contact.secondaryPhone ?? "",
            address: contact.address ?? "",
            title: contact.title ?? "",
            idType: contact.idType ?? "",
            idNumber: contact.idNumber ?? "",
            notes: contact.notes ?? "",
          }
        : emptyValues
    );

    const timer = window.setTimeout(() => setIsReady(true), 0);
    return () => window.clearTimeout(timer);
  }, [contact, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setIsReady(false);
    form.reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!isReady || !form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as CreateContactValues);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Edit Contact"
      size="md"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isValid={isReady && form.isValid}
    >
      <div className="flex gap-3">
        {CONTACT_TYPE_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contactType"
              value={opt.value}
              checked={form.values.contactType === opt.value}
              onChange={(e) => form.setValue("contactType", e.target.value)}
              disabled={!isReady || isSubmitting}
              className="accent-[var(--eztrack-primary-500,#6366f1)]"
            />
            <span className="text-[13px] text-[var(--text-primary)]">{opt.label}</span>
          </label>
        ))}
      </div>

      {form.values.contactType === "individual" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="First name"
            value={form.values.firstName}
            onChange={(e) => form.setValue("firstName", e.target.value)}
            error={form.touched.firstName ? form.errors.firstName : undefined}
            disabled={!isReady || isSubmitting}
          />
          <Input
            label="Last Name"
            placeholder="Last name"
            value={form.values.lastName}
            onChange={(e) => form.setValue("lastName", e.target.value)}
            disabled={!isReady || isSubmitting}
          />
        </div>
      ) : null}

      <Input
        label="Organization Name"
        placeholder="Organization or company"
        value={form.values.organizationName}
        onChange={(e) => form.setValue("organizationName", e.target.value)}
        error={form.touched.organizationName ? form.errors.organizationName : undefined}
        disabled={!isReady || isSubmitting}
      />

      <Select
        label="Category"
        options={CATEGORY_OPTIONS}
        value={form.values.category}
        onChange={(e) => form.setValue("category", e.target.value)}
        placeholder="Select category"
        error={form.touched.category ? form.errors.category : undefined}
        disabled={!isReady || isSubmitting}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={form.values.email}
          onChange={(e) => form.setValue("email", e.target.value)}
          error={form.touched.email ? form.errors.email : undefined}
          disabled={!isReady || isSubmitting}
        />
        <Input
          label="Phone (required)"
          type="tel"
          placeholder="(555) 123-4567"
          value={form.values.phone}
          onChange={(e) => form.setValue("phone", e.target.value)}
          error={form.touched.phone ? form.errors.phone : undefined}
          disabled={!isReady || isSubmitting}
        />
      </div>

      <Input
        label="Secondary Phone"
        type="tel"
        placeholder="(555) 987-6543"
        value={form.values.secondaryPhone}
        onChange={(e) => form.setValue("secondaryPhone", e.target.value)}
        disabled={!isReady || isSubmitting}
      />

      <Textarea
        label="Address"
        placeholder="Full address..."
        value={form.values.address}
        onChange={(e) => form.setValue("address", e.target.value)}
        rows={2}
        disabled={!isReady || isSubmitting}
      />

      <Input
        label="Title"
        placeholder="Job title or role"
        value={form.values.title}
        onChange={(e) => form.setValue("title", e.target.value)}
        disabled={!isReady || isSubmitting}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="ID Type"
          options={ID_TYPE_OPTIONS}
          value={form.values.idType}
          onChange={(e) => form.setValue("idType", e.target.value)}
          placeholder="Select ID type"
          disabled={!isReady || isSubmitting}
        />
        <Input
          label="ID Number"
          placeholder="ID number"
          value={form.values.idNumber}
          onChange={(e) => form.setValue("idNumber", e.target.value)}
          disabled={!isReady || isSubmitting}
        />
      </div>

      <Textarea
        label="Notes"
        placeholder="Additional notes..."
        value={form.values.notes}
        onChange={(e) => form.setValue("notes", e.target.value)}
        rows={2}
        disabled={!isReady || isSubmitting}
      />
    </FormModal>
  );
}
