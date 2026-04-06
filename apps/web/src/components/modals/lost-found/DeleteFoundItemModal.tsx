"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteFoundItemModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  itemDescription: string;
  isLoading?: boolean;
}

export function DeleteFoundItemModal({
  open,
  onClose,
  onConfirm,
  itemDescription,
  isLoading = false,
}: DeleteFoundItemModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Found Item"
      variant="destructive"
      confirmLabel="Delete Item"
      isLoading={isLoading}
      requireReason
      reasonLabel="Reason"
      reasonPlaceholder="Why is this record being deleted?"
      description={
        <p>
          Are you sure you want to permanently delete the record for{" "}
          <span className="font-medium text-[var(--text-primary)]">
            {itemDescription}
          </span>
          ? This action cannot be undone.
        </p>
      }
    />
  );
}
