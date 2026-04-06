"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";

interface PatronFlagModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { flagType: string; reason: string; expiryDate: string }) => void | Promise<void>;
}

const FLAG_TYPE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "watch", label: "Watch" },
  { value: "caution", label: "Caution" },
  { value: "banned", label: "Banned" },
  { value: "medical", label: "Medical" },
  { value: "vip", label: "VIP" },
];

export function PatronFlagModal({
  open,
  onClose,
  onSubmit,
}: PatronFlagModalProps) {
  const [flagType, setFlagType] = useState("");
  const [reason, setReason] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = flagType !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ flagType, reason: reason.trim(), expiryDate });
      setFlagType("");
      setReason("");
      setExpiryDate("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFlagType("");
    setReason("");
    setExpiryDate("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Flag Patron"
      size="sm"
      submitLabel="Save Flag"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Select
        label="Flag Type"
        options={FLAG_TYPE_OPTIONS}
        value={flagType}
        onChange={(e) => setFlagType(e.target.value)}
        placeholder="Select flag type"
      />

      <Textarea
        label="Reason"
        placeholder="Reason for flagging..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
      />

      <Input
        label="Expiry Date (optional)"
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
      />
    </FormModal>
  );
}
