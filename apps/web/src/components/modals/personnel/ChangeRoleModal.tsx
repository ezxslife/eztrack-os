"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface ChangeRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { newRole: string; reason: string }) => void | Promise<void>;
  currentRole?: string;
}

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "officer", label: "Officer" },
  { value: "staff", label: "Staff" },
];

export function ChangeRoleModal({
  open,
  onClose,
  onSubmit,
  currentRole,
}: ChangeRoleModalProps) {
  const [newRole, setNewRole] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = newRole !== "" && newRole !== currentRole;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ newRole, reason: reason.trim() });
      setNewRole("");
      setReason("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewRole("");
    setReason("");
    onClose();
  };

  const currentRoleLabel = ROLE_OPTIONS.find((r) => r.value === currentRole)?.label || currentRole || "None";

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Change Role"
      size="sm"
      submitLabel="Change Role"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="text-[13px]">
        <span className="text-[var(--text-tertiary)]">Current role: </span>
        <span className="font-medium text-[var(--text-primary)]">{currentRoleLabel}</span>
      </div>

      <Select
        label="New Role"
        options={ROLE_OPTIONS}
        value={newRole}
        onChange={(e) => setNewRole(e.target.value)}
        placeholder="Select new role"
      />

      <Textarea
        label="Reason"
        placeholder="Reason for role change..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
