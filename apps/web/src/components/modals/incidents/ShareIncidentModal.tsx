"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type ShareTargetType = "user" | "role";
type PermissionLevel = "view" | "contributor" | "co_author";
type ExpiryOption = "never" | "specific_date" | "on_close";

const ROLE_OPTIONS = [
  { value: "security_manager", label: "Security Manager" },
  { value: "shift_supervisor", label: "Shift Supervisor" },
  { value: "investigator", label: "Investigator" },
  { value: "legal_counsel", label: "Legal Counsel" },
  { value: "hr_manager", label: "HR Manager" },
];

const PERMISSION_OPTIONS: { value: PermissionLevel; label: string }[] = [
  { value: "view", label: "View Only" },
  { value: "contributor", label: "Contributor" },
  { value: "co_author", label: "Co-Author" },
];

const PERMISSION_DESCRIPTIONS: Record<PermissionLevel, string> = {
  view: "Can view the incident and all associated records. Cannot make changes.",
  contributor: "Can add narratives, participants, and media. Cannot modify core fields.",
  co_author: "Full editing access including core incident fields and status changes.",
};

interface ShareIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    targetType: ShareTargetType;
    target: string;
    permission: PermissionLevel;
    expiry: ExpiryOption;
    expiryDate: string;
    instructions: string;
  }) => void | Promise<void>;
}

export function ShareIncidentModal({
  open,
  onClose,
  onSubmit,
}: ShareIncidentModalProps) {
  const [targetType, setTargetType] = useState<ShareTargetType>("user");
  const [userSearch, setUserSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("security_manager");
  const [permission, setPermission] = useState<PermissionLevel>("view");
  const [expiry, setExpiry] = useState<ExpiryOption>("never");
  const [expiryDate, setExpiryDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    targetType === "user" ? userSearch.trim().length > 0 : !!selectedRole;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        targetType,
        target: targetType === "user" ? userSearch.trim() : selectedRole,
        permission,
        expiry,
        expiryDate,
        instructions: instructions.trim(),
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTargetType("user");
    setUserSearch("");
    setSelectedRole("security_manager");
    setPermission("view");
    setExpiry("never");
    setExpiryDate("");
    setInstructions("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Share Incident"
      subtitle="Grant access to another user or role"
      size="md"
      submitLabel="Share"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {/* Target type radio */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
          Share With
        </label>
        <SegmentedControl
          ariaLabel="Share target type"
          stretch
          value={targetType}
          onChange={setTargetType}
          options={[
            { value: "user", label: "User" },
            { value: "role", label: "Role" },
          ]}
        />
      </div>

      {/* Conditional: user search or role select */}
      {targetType === "user" ? (
        <Input
          label="Search User"
          placeholder="Search by name or email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
      ) : (
        <Select
          label="Select Role"
          options={ROLE_OPTIONS}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        />
      )}

      {/* Permission level */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
          Permission Level
        </label>
        <Select
          options={PERMISSION_OPTIONS}
          value={permission}
          onChange={(e) => setPermission(e.target.value as PermissionLevel)}
        />
        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
          {PERMISSION_DESCRIPTIONS[permission]}
        </p>
      </div>

      {/* Expiry radio */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
          Access Expiry
        </label>
        <SegmentedControl
          ariaLabel="Access expiry"
          size="sm"
          stretch
          value={expiry}
          onChange={setExpiry}
          options={[
            { value: "never", label: "Never" },
            { value: "specific_date", label: "Specific Date" },
            { value: "on_close", label: "On Incident Close" },
          ]}
        />
      </div>

      {/* Conditional date input */}
      {expiry === "specific_date" && (
        <Input
          label="Expiry Date"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
      )}

      <Textarea
        label="Instructions (optional)"
        placeholder="Any notes or instructions for the recipient..."
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
