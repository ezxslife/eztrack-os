"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface CancelVisitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function CancelVisitModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: CancelVisitModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Cancel Visit"
      description="Are you sure you want to cancel this visit? The visitor and host will be notified."
      confirmLabel="Cancel Visit"
      variant="warning"
      requireReason
      reasonPlaceholder="Reason for cancellation..."
      isLoading={isLoading}
    />
  );
}
