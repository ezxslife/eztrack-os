"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeletePatronModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeletePatronModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeletePatronModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Patron"
      description="Are you sure you want to delete this patron? This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
