"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteDailyLogModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  entryTitle?: string;
}

export function DeleteDailyLogModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  entryTitle,
}: DeleteDailyLogModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Log Entry"
      variant="destructive"
      confirmLabel="Delete"
      isLoading={isLoading}
      description={
        <p>
          Are you sure you want to delete
          {entryTitle ? ` "${entryTitle}"` : " this daily log entry"}? This action
          cannot be undone.
        </p>
      }
    />
  );
}
