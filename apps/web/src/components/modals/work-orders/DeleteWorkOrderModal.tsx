"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteWorkOrderModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeleteWorkOrderModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Work Order"
      description="Are you sure you want to delete this work order? This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
