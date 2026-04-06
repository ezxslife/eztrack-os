"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteVisitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  visitorName: string;
  visitDate: string;
  isLoading?: boolean;
}

export function DeleteVisitModal({
  open,
  onClose,
  onConfirm,
  visitorName,
  visitDate,
  isLoading = false,
}: DeleteVisitModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Visit"
      variant="destructive"
      confirmLabel="Delete Visit"
      isLoading={isLoading}
      requireReason
      reasonLabel="Reason"
      reasonPlaceholder="Why is this visit record being deleted?"
      description={
        <p>
          Are you sure you want to permanently delete the visit record for{" "}
          <span className="font-medium text-[var(--text-primary)]">
            {visitorName}
          </span>{" "}
          on{" "}
          <span className="font-medium text-[var(--text-primary)]">
            {visitDate}
          </span>
          ? This action cannot be undone.
        </p>
      }
    />
  );
}
