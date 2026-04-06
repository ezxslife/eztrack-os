"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface SignOutVisitorModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  visitorName?: string;
  isLoading?: boolean;
}

export function SignOutVisitorModal({
  open,
  onClose,
  onConfirm,
  visitorName = "this visitor",
  isLoading,
}: SignOutVisitorModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sign Out Visitor"
      description={`Sign out ${visitorName}? Check-out time will be recorded as now.`}
      confirmLabel="Sign Out"
      variant="info"
      isLoading={isLoading}
    />
  );
}
