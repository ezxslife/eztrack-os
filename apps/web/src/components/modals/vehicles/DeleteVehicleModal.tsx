"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteVehicleModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeleteVehicleModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Vehicle"
      description="Are you sure you want to delete this vehicle record? This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
