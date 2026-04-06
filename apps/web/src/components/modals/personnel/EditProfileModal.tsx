"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  badgeNumber: string;
  department: string;
  title: string;
  photoUrl: string;
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileData) => void | Promise<void>;
  profile?: ProfileData;
  departments?: { value: string; label: string }[];
}

export function EditProfileModal({
  open,
  onClose,
  onSubmit,
  profile,
  departments = [],
}: EditProfileModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setPhone(profile.phone);
      setBadgeNumber(profile.badgeNumber);
      setDepartment(profile.department);
      setTitle(profile.title);
      setPhotoUrl(profile.photoUrl);
    }
  }, [profile]);

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        badgeNumber: badgeNumber.trim(),
        department,
        title: title.trim(),
        photoUrl,
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
      title="Edit Profile"
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
          label="Badge Number"
          placeholder="Badge #"
          value={badgeNumber}
          onChange={(e) => setBadgeNumber(e.target.value)}
        />
        <Select
          label="Department"
          options={departments}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Select department"
        />
      </div>

      <Input
        label="Title"
        placeholder="Job title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="rounded-lg border-2 border-dashed border-[var(--border-default)] p-6 text-center">
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Click or drag to upload profile photo
        </p>
        {photoUrl && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">Photo uploaded</p>
        )}
      </div>
    </FormModal>
  );
}
