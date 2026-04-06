"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

interface EditUserRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    newRole: string;
    effectiveDate: string;
    notifyUser: boolean;
  }) => void | Promise<void>;
  currentRole?: string;
  userName?: string;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "officer", label: "Officer" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "readonly", label: "Read Only" },
];

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  supervisor: "Supervisor",
  officer: "Officer",
  dispatcher: "Dispatcher",
  readonly: "Read Only",
};

export function EditUserRoleModal({
  open,
  onClose,
  onSubmit,
  currentRole = "officer",
  userName,
}: EditUserRoleModalProps) {
  const [newRole, setNewRole] = useState(currentRole);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNewRole(currentRole);
      setEffectiveDate("");
      setNotifyUser(true);
    }
  }, [open, currentRole]);

  const isValid = newRole !== currentRole && effectiveDate.length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        newRole,
        effectiveDate,
        notifyUser,
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
      title={userName ? `Change Role: ${userName}` : "Change User Role"}
      size="sm"
      submitLabel="Update Role"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="w-full">
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">
          Current Role
        </label>
        <div className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 flex items-center text-[13px] text-[var(--text-tertiary)]">
          {roleLabelMap[currentRole] ?? currentRole}
        </div>
      </div>

      <Select
        label="New Role"
        options={roleOptions}
        value={newRole}
        onChange={(e) => setNewRole(e.target.value)}
      />

      <Input
        label="Effective Date"
        type="date"
        value={effectiveDate}
        onChange={(e) => setEffectiveDate(e.target.value)}
      />

      <Toggle
        label="Notify user of role change"
        checked={notifyUser}
        onChange={setNotifyUser}
      />
    </FormModal>
  );
}
