"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeleteCaseModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  caseNumber: string;
  isLoading?: boolean;
}

/**
 * Destructive confirm modal for deleting a case.
 * Requires a reason before the case can be permanently deleted.
 */
export function DeleteCaseModal({
  open,
  onClose,
  onConfirm,
  caseNumber,
  isLoading,
}: DeleteCaseModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete Case ${caseNumber}`}
      variant="destructive"
      confirmLabel="Delete Case"
      requireReason
      reasonLabel="Reason for deletion"
      reasonPlaceholder="Explain why this case is being deleted..."
      isLoading={isLoading}
      description={
        <p>
          This action cannot be undone. Case <strong>{caseNumber}</strong> and
          all associated records including evidence, narratives, tasks, and
          financial entries will be permanently deleted. Any linked records will
          be unlinked.
        </p>
      }
    />
  );
}
