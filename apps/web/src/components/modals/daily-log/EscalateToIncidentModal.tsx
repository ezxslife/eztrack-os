"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Toggle } from "@/components/ui/Toggle";

interface EscalateToIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; autoFill: boolean }) => void | Promise<void>;
  isLoading?: boolean;
}

export function EscalateToIncidentModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: EscalateToIncidentModalProps) {
  const [autoFill, setAutoFill] = useState(true);

  const handleConfirm = async (reason?: string) => {
    await onConfirm({ reason: reason ?? "", autoFill });
  };

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Escalate to Incident"
      variant="warning"
      requireReason
      reasonLabel="Escalation Reason"
      reasonPlaceholder="Why is this being escalated?"
      confirmLabel="Escalate"
      isLoading={isLoading}
      description={
        <div className="space-y-3">
          <p>
            This daily log entry will be escalated to a formal incident. The log
            entry will be linked to the new incident.
          </p>
          <div className="pt-1">
            <Toggle
              checked={autoFill}
              onChange={setAutoFill}
              label="Auto-fill incident from log details"
            />
          </div>
        </div>
      }
    />
  );
}
