"use client";

import { Lock, Unlock } from "lucide-react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface LockIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  isLocked: boolean;
  incidentNumber: string;
  isLoading?: boolean;
}

/**
 * Confirm modal to lock/unlock an incident for editing.
 * When locked, only case investigators and admins can modify the incident.
 * Uses ConfirmModal with variant="warning".
 */
export function LockIncidentModal({
  open,
  onClose,
  onConfirm,
  isLocked,
  incidentNumber,
  isLoading,
}: LockIncidentModalProps) {
  const action = isLocked ? "Unlock" : "Lock";

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${action} Incident ${incidentNumber}`}
      variant="warning"
      confirmLabel={`${action} Incident`}
      requireReason
      reasonLabel={`Reason for ${action.toLowerCase()}ing`}
      reasonPlaceholder={`Explain why this incident should be ${action.toLowerCase()}ed...`}
      isLoading={isLoading}
      description={
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            {isLocked ? (
              <Unlock size={16} className="text-yellow-500" />
            ) : (
              <Lock size={16} className="text-yellow-500" />
            )}
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {action} Document Control
            </span>
          </div>
          {isLocked ? (
            <p>
              Unlocking incident <strong>{incidentNumber}</strong> will restore
              editing access for all authorized users. Any document control
              restrictions will be lifted. Changes made after unlocking will be
              tracked in the audit log.
            </p>
          ) : (
            <p>
              Locking incident <strong>{incidentNumber}</strong> will prevent
              editing by all users except case investigators and administrators.
              This is typically used for incidents under legal review or pending
              regulatory submission. All access attempts will be logged.
            </p>
          )}
        </div>
      }
    />
  );
}
