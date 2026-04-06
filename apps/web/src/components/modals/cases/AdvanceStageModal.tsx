"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ArrowRight } from "lucide-react";

interface AdvanceStageModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  currentStage: string;
  nextStage: string;
  isLoading?: boolean;
}

export function AdvanceStageModal({
  open,
  onClose,
  onConfirm,
  currentStage,
  nextStage,
  isLoading,
}: AdvanceStageModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Advance Case Stage"
      variant="info"
      requireReason
      reasonLabel="Reason for Advancement"
      reasonPlaceholder="Explain why this case is ready to advance..."
      confirmLabel="Advance Stage"
      isLoading={isLoading}
      description={
        <div className="space-y-3">
          <p>This case will be advanced to the next stage.</p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-secondary)]">
            <div className="flex-1 text-center">
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                Current
              </p>
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                {currentStage}
              </p>
            </div>
            <ArrowRight size={16} className="text-[var(--text-tertiary)] shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                Next
              </p>
              <p className="text-[13px] font-medium text-[var(--eztrack-primary-500,#6366f1)]">
                {nextStage}
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}
