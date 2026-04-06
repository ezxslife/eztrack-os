"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface SignOutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  visitorName: string;
  badgeNumber: string;
  signInTime: string;
  isLoading?: boolean;
}

export function SignOutModal({
  open,
  onClose,
  onConfirm,
  visitorName,
  badgeNumber,
  signInTime,
  isLoading = false,
}: SignOutModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sign Out Visitor"
      variant="success"
      confirmLabel="Sign Out"
      isLoading={isLoading}
      description={
        <div className="space-y-2">
          <p>
            Are you sure you want to sign out this visitor?
          </p>
          <div className="rounded-lg bg-[var(--surface-secondary)] p-3 space-y-1">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">
              {visitorName}
            </p>
            <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
              <span>Badge: {badgeNumber}</span>
              <span>&middot;</span>
              <span>Signed in: {signInTime}</span>
            </div>
          </div>
        </div>
      }
    />
  );
}
