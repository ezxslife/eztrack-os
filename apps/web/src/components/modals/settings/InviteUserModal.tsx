"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    sendWelcomeEmail: boolean;
  }) => void | Promise<void>;
}

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "officer", label: "Officer" },
  { value: "staff", label: "Staff" },
];

export function InviteUserModal({
  open,
  onClose,
  onSubmit,
}: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = email.trim().length > 0 && firstName.trim().length > 0 && role !== "";

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("");
    setSendWelcomeEmail(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        sendWelcomeEmail,
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
      title="Invite User"
      size="md"
      submitLabel="Send Invite"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Email"
        type="email"
        placeholder="user@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

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

      <Select
        label="Role"
        options={ROLE_OPTIONS}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Select role"
      />

      <Toggle
        label="Send welcome email"
        checked={sendWelcomeEmail}
        onChange={setSendWelcomeEmail}
      />
    </FormModal>
  );
}
