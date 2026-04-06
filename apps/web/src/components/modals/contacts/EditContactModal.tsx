"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface ContactData {
  contactType: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  category: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  title: string;
  idType: string;
  idNumber: string;
  notes: string;
}

interface EditContactModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactData) => void | Promise<void>;
  contact?: ContactData;
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
  const [contactType, setContactType] = useState("individual");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contact) {
      setContactType(contact.contactType);
      setFirstName(contact.firstName);
      setLastName(contact.lastName);
      setOrganizationName(contact.organizationName);
      setCategory(contact.category);
      setEmail(contact.email);
      setPhone(contact.phone);
      setSecondaryPhone(contact.secondaryPhone);
      setAddress(contact.address);
      setTitle(contact.title);
      setIdType(contact.idType);
      setIdNumber(contact.idNumber);
      setNotes(contact.notes);
    }
  }, [contact]);

  const isValid = phone.trim().length > 0 && (contactType === "individual" ? firstName.trim().length > 0 : organizationName.trim().length > 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        contactType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organizationName: organizationName.trim(),
        category,
        email: email.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        address: address.trim(),
        title: title.trim(),
        idType,
        idNumber: idNumber.trim(),
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
      title="Edit Contact"
      size="md"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="flex gap-3">
        {CONTACT_TYPE_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contactType"
              value={opt.value}
              checked={contactType === opt.value}
              onChange={(e) => setContactType(e.target.value)}
              className="accent-[var(--eztrack-primary-500,#6366f1)]"
            />
            <span className="text-[13px] text-[var(--text-primary)]">{opt.label}</span>
          </label>
        ))}
      </div>

      {contactType === "individual" ? (
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
      ) : null}

      <Input
        label="Organization Name"
        placeholder="Organization or company"
        value={organizationName}
        onChange={(e) => setOrganizationName(e.target.value)}
      />

      <Select
        label="Category"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Select category"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Phone (required)"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <Input
        label="Secondary Phone"
        type="tel"
        placeholder="(555) 987-6543"
        value={secondaryPhone}
        onChange={(e) => setSecondaryPhone(e.target.value)}
      />

      <Textarea
        label="Address"
        placeholder="Full address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        rows={2}
      />

      <Input
        label="Title"
        placeholder="Job title or role"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

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
