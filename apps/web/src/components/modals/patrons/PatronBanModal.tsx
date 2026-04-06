"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface PatronBanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function PatronBanModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: PatronBanModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Ban Patron"
      description="Ban this patron from all events? This adds a permanent flag to their record."
      confirmLabel="Ban Patron"
      variant="destructive"
      requireReason
      reasonPlaceholder="Reason for banning..."
      isLoading={isLoading}
    />
  );
}
