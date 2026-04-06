"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface CompleteWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { actualCost: number; completionNotes: string }) => void | Promise<void>;
  estimatedCost?: number;
}

export function CompleteWorkOrderModal({
  open,
  onClose,
  onSubmit,
  estimatedCost = 0,
}: CompleteWorkOrderModalProps) {
  const [actualCost, setActualCost] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actualCostNum = parseFloat(actualCost) || 0;
  const variance = actualCostNum - estimatedCost;
  const variancePercent = estimatedCost > 0 ? ((variance / estimatedCost) * 100).toFixed(1) : "N/A";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ actualCost: actualCostNum, completionNotes: completionNotes.trim() });
      setActualCost("");
      setCompletionNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActualCost("");
    setCompletionNotes("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Complete Work Order"
      size="md"
      submitLabel="Mark Complete"
      isSubmitting={isSubmitting}
    >
      <Input
        label="Actual Cost ($)"
        type="number"
        placeholder="0.00"
        value={actualCost}
        onChange={(e) => setActualCost(e.target.value)}
      />

      <div className="rounded-lg border border-[var(--border-default)] p-3 space-y-1">
        <p className="text-[12px] font-medium text-[var(--text-secondary)]">Cost Variance</p>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[var(--text-tertiary)]">Estimated:</span>
          <span className="text-[var(--text-primary)]">${estimatedCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[var(--text-tertiary)]">Actual:</span>
          <span className="text-[var(--text-primary)]">${actualCostNum.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px] pt-1 border-t border-[var(--border-default)]">
          <span className="text-[var(--text-tertiary)]">Variance:</span>
          <span
            className={
              variance > 0
                ? "text-[var(--status-critical)]"
                : variance < 0
                ? "text-green-500"
                : "text-[var(--text-primary)]"
            }
          >
            {variance >= 0 ? "+" : ""}${variance.toFixed(2)} ({variancePercent}%)
          </span>
        </div>
      </div>

      <Textarea
        label="Completion Notes"
        placeholder="Summary of work completed..."
        value={completionNotes}
        onChange={(e) => setCompletionNotes(e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
