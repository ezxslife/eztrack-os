"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeactivateUserModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function DeactivateUserModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeactivateUserModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Deactivate User"
      description="Deactivate this user? They will lose access to all modules."
      confirmLabel="Deactivate"
      variant="destructive"
      requireReason
      reasonPlaceholder="Reason for deactivation..."
      isLoading={isLoading}
    />
  );
}
