"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeletePersonnelModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  personnelName: string;
  badgeNumber: string;
  isLoading?: boolean;
}

export function DeletePersonnelModal({
  open,
  onClose,
  onConfirm,
  personnelName,
  badgeNumber,
  isLoading,
}: DeletePersonnelModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Remove Personnel"
      description={
        <>
          Are you sure you want to remove{" "}
          <strong>{personnelName}</strong> (Badge #{badgeNumber}) from the
          roster? All shift assignments, dispatch records, and incident
          associations will be affected. This action cannot be undone.
        </>
      }
      confirmLabel="Remove"
      variant="destructive"
      requireReason
      reasonLabel="Reason for Removal"
      reasonPlaceholder="Enter reason for removing this personnel..."
      isLoading={isLoading}
    />
  );
}
