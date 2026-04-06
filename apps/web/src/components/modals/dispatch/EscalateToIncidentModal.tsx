"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Toggle } from "@/components/ui/Toggle";

interface EscalateToIncidentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (prefill: boolean) => void | Promise<void>;
  isLoading?: boolean;
}

export function EscalateToIncidentModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: EscalateToIncidentModalProps) {
  const [prefill, setPrefill] = useState(true);

  const handleConfirm = async () => {
    await onConfirm(prefill);
  };

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Escalate to Incident"
      variant="warning"
      confirmLabel="Escalate"
      isLoading={isLoading}
      description={
        <div className="space-y-3">
          <p>
            This will create a new incident from this dispatch. All assigned officers
            will be added as respondents.
          </p>
          <div className="pt-1">
            <Toggle
              checked={prefill}
              onChange={setPrefill}
              label="Pre-fill incident details from dispatch"
            />
          </div>
        </div>
      }
    />
  );
}
