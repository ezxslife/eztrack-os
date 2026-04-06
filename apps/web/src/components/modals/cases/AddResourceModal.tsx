"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => void | Promise<void>;
}

interface ResourceFormData {
  userSearch: string;
  role: string;
  alias: string;
  hourlyRate: string;
  aliasActive: boolean;
}

const ROLE_OPTIONS = [
  { value: "case_manager", label: "Case Manager" },
  { value: "investigator", label: "Investigator" },
  { value: "view_only", label: "View Only" },
];

export function AddResourceModal({
  open,
  onClose,
  onSubmit,
}: AddResourceModalProps) {
  const [userSearch, setUserSearch] = useState("");
  const [role, setRole] = useState("");
  const [alias, setAlias] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [aliasActive, setAliasActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = userSearch.trim() !== "" && role !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ userSearch, role, alias, hourlyRate, aliasActive });
      setUserSearch("");
      setRole("");
      setAlias("");
      setHourlyRate("");
      setAliasActive(false);
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
      title="Add Resource"
      subtitle="Add a team member to this case"
      size="md"
      submitLabel="Add Resource"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Search User"
        placeholder="Name or employee ID..."
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
      />

      <Select
        label="Role"
        options={ROLE_OPTIONS}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Select role..."
      />

      <Input
        label="Alias (optional)"
        placeholder="For sensitive cases"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        helperText="Use an alias to protect identity on sensitive cases"
      />

      <Input
        label="Hourly Rate"
        type="number"
        placeholder="0.00"
        value={hourlyRate}
        onChange={(e) => setHourlyRate(e.target.value)}
      />

      <Toggle
        checked={aliasActive}
        onChange={setAliasActive}
        label="Alias active"
      />
    </FormModal>
  );
}
