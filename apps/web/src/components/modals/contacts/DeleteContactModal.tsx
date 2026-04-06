"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteContactModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteContactModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeleteContactModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Contact"
      description="Are you sure you want to delete this contact? This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
