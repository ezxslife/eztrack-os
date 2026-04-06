"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteSettingModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteSettingModal({
  open,
  onClose,
  onConfirm,
  itemName = "this item",
  isLoading,
}: DeleteSettingModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Setting"
      description={`Are you sure you want to delete ${itemName}? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
