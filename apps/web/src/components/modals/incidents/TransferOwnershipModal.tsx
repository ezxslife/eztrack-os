"use client";

import { useState } from "react";
import { ArrowRight, UserCircle, AlertCircle } from "lucide-react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";

interface TransferOwnershipModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { newOwner: string }) => void | Promise<void>;
  currentOwner?: string;
}

export function TransferOwnershipModal({
  open,
  onClose,
  onSubmit,
  currentOwner = "You",
}: TransferOwnershipModalProps) {
  const [newOwner, setNewOwner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = newOwner.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ newOwner: newOwner.trim() });
      setNewOwner("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewOwner("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Transfer Ownership"
      size="sm"
      submitLabel="Transfer"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      {/* Current owner display */}
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)]">
        <div className="h-9 w-9 rounded-full bg-[var(--surface-tertiary)] flex items-center justify-center">
          <UserCircle className="h-5 w-5 text-[var(--text-tertiary)]" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-[var(--text-tertiary)]">Current Owner</p>
          <p className="text-[13px] font-medium text-[var(--text-primary)]">
            {currentOwner}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" />
      </div>

      <Input
        label="New Owner"
        placeholder="Search by name or email..."
        value={newOwner}
        onChange={(e) => setNewOwner(e.target.value)}
      />

      {/* Confirmation message */}
      <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
        <div className="text-[12px] text-yellow-700 leading-relaxed">
          <p className="font-medium mb-0.5">Transfer requires acceptance</p>
          <p>
            The new owner will receive a notification and must accept the
            transfer. You will retain access until the transfer is accepted.
          </p>
        </div>
      </div>
    </FormModal>
  );
}
