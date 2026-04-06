"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Select } from "@/components/ui/Select";

interface ClearDispatchModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; clearCode: string }) => void | Promise<void>;
  dispatchId?: string;
}

const CLEAR_CODE_OPTIONS = [
  { value: "resolved", label: "Resolved" },
  { value: "unfounded", label: "Unfounded" },
  { value: "cancelled", label: "Cancelled" },
  { value: "duplicate", label: "Duplicate" },
];

export function ClearDispatchModal({
  open,
  onClose,
  onConfirm,
  dispatchId,
}: ClearDispatchModalProps) {
  const [clearCode, setClearCode] = useState("");

  const handleConfirm = async (reason?: string) => {
    await onConfirm({ reason: reason ?? "", clearCode });
    setClearCode("");
  };

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Clear Dispatch"
      variant="info"
      requireReason
      reasonLabel="Clear Reason"
      reasonPlaceholder="Why is this dispatch being cleared?"
      confirmLabel="Clear Dispatch"
      description={
        <div className="space-y-3">
          <p>
            This dispatch{dispatchId ? ` (${dispatchId})` : ""} will be marked as cleared.
            All assigned officers will be released.
          </p>
          <Select
            label="Clear Code"
            options={CLEAR_CODE_OPTIONS}
            value={clearCode}
            onChange={(e) => setClearCode(e.target.value)}
            placeholder="Select clear code..."
          />
        </div>
      }
    />
  );
}
