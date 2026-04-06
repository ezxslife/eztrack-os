"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteLostFoundModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteLostFoundModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeleteLostFoundModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Entry"
      description="Are you sure you want to delete this lost & found entry? This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
