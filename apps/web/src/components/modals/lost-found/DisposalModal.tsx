"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DisposalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  itemDescription: string;
  daysHeld: number;
  isLoading?: boolean;
}

export function DisposalModal({
  open,
  onClose,
  onConfirm,
  itemDescription,
  daysHeld,
  isLoading = false,
}: DisposalModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Dispose of Item"
      variant="destructive"
      confirmLabel="Confirm Disposal"
      isLoading={isLoading}
      requireReason
      reasonLabel="Disposal Method"
      reasonPlaceholder="e.g., Donated to charity, Discarded, Transferred to police"
      description={
        <div className="space-y-2">
          <p>
            This item has been held for{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {daysHeld} days
            </span>{" "}
            without being claimed. Are you sure you want to dispose of it?
          </p>
          <div className="rounded-lg bg-[var(--surface-secondary)] p-3">
            <p className="text-[12px] text-[var(--text-tertiary)]">Item</p>
            <p className="text-[13px] font-medium text-[var(--text-primary)]">
              {itemDescription}
            </p>
          </div>
        </div>
      }
    />
  );
}
