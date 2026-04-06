"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface CloseWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function CloseWorkOrderModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: CloseWorkOrderModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Close Work Order"
      description="Close this work order? This marks it as finalized."
      confirmLabel="Close Work Order"
      variant="info"
      requireReason
      reasonPlaceholder="Reason for closing..."
      isLoading={isLoading}
    />
  );
}
