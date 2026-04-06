"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";

interface AddDropdownValueModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    value: string;
    displayLabel: string;
    sortOrder: number;
  }) => void | Promise<void>;
  dropdownCategory?: string;
}

export function AddDropdownValueModal({
  open,
  onClose,
  onSubmit,
  dropdownCategory = "",
}: AddDropdownValueModalProps) {
  const [value, setValue] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = value.trim().length > 0 && displayLabel.trim().length > 0;

  const resetForm = () => {
    setValue("");
    setDisplayLabel("");
    setSortOrder("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        value: value.trim(),
        displayLabel: displayLabel.trim(),
        sortOrder: parseInt(sortOrder) || 0,
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
      title="Add Dropdown Value"
      size="sm"
      submitLabel="Add Value"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {dropdownCategory && (
        <div className="text-[13px]">
          <span className="text-[var(--text-tertiary)]">Category: </span>
          <span className="font-medium text-[var(--text-primary)]">{dropdownCategory}</span>
        </div>
      )}

      <Input
        label="Value"
        placeholder="Internal value (e.g. high_priority)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <Input
        label="Display Label"
        placeholder="Display text (e.g. High Priority)"
        value={displayLabel}
        onChange={(e) => setDisplayLabel(e.target.value)}
      />

      <Input
        label="Sort Order"
        type="number"
        placeholder="0"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
      />
    </FormModal>
  );
}
