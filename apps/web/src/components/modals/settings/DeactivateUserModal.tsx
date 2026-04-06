"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface DeactivateUserModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  userName?: string;
  currentRole?: string;
  isLoading?: boolean;
}

export function DeactivateUserModal({
  open,
  onClose,
  onConfirm,
  userName,
  currentRole,
  isLoading,
}: DeactivateUserModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={userName ? `Deactivate ${userName}` : "Deactivate User"}
      description={
        <>
          This will deactivate the user account
          {userName ? (
            <>
              {" "}for <strong>{userName}</strong>
            </>
          ) : null}
          {currentRole ? (
            <>
              {" "}(current role: {currentRole})
            </>
          ) : null}
          . The user will no longer be able to sign in or access the system. This action can be reversed by an administrator.
        </>
      }
      confirmLabel="Deactivate User"
      variant="warning"
      requireReason
      reasonLabel="Reason for deactivation"
      reasonPlaceholder="Enter the reason for deactivating this user..."
      isLoading={isLoading}
    />
  );
}
