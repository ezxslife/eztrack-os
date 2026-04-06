"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteBriefingModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteBriefingModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: DeleteBriefingModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Briefing"
      description="Are you sure you want to delete this briefing? This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
    />
  );
}
