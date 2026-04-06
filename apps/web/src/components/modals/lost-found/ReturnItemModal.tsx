"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface ReturnItemModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemDescription: string;
  claimantName: string;
  isLoading?: boolean;
}

export function ReturnItemModal({
  open,
  onClose,
  onConfirm,
  itemDescription,
  claimantName,
  isLoading = false,
}: ReturnItemModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Return Item"
      variant="success"
      confirmLabel="Confirm Return"
      isLoading={isLoading}
      description={
        <div className="space-y-2">
          <p>
            Are you sure you want to mark this item as returned?
          </p>
          <div className="rounded-lg bg-[var(--surface-secondary)] p-3 space-y-1">
            <p className="text-[12px] text-[var(--text-tertiary)]">Item</p>
            <p className="text-[13px] font-medium text-[var(--text-primary)]">
              {itemDescription}
            </p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-2">Returning to</p>
            <p className="text-[13px] font-medium text-[var(--text-primary)]">
              {claimantName}
            </p>
          </div>
        </div>
      }
    />
  );
}
