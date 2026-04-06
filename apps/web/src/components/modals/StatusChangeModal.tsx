"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/ui/Badge";

interface StatusTransition {
  value: string;
  label: string;
  requiresReason?: boolean;
  description?: string;
  warning?: string;
}

interface StatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newStatus: string, reason?: string) => void | Promise<void>;
  entityType: "incident" | "dispatch" | "case" | "work_order";
  entityLabel: string;
  currentStatus: string;
  transitions: StatusTransition[];
  isLoading?: boolean;
}

/**
 * Generic status change modal used across all modules.
 * Shows current status, allowed transitions with descriptions,
 * optional reason textarea, and contextual warnings.
 *
 * iOS 26 style: radio group with description text, spring animation.
 */
export function StatusChangeModal({
  open,
  onClose,
  onConfirm,
  entityType: _entityType,
  entityLabel,
  currentStatus,
  transitions,
  isLoading = false,
}: StatusChangeModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedTransition = transitions.find((t) => t.value === selected);
  const needsReason = selectedTransition?.requiresReason ?? false;
  const loading = isLoading || submitting;

  const handleConfirm = async () => {
    if (!selected) return;
    if (needsReason && !reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(selected, needsReason ? reason : undefined);
      setSelected(null);
      setReason("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>Change Status</ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[var(--text-tertiary)]">{entityLabel}:</span>
            <StatusBadge status={currentStatus} dot />
          </div>

          {/* Transition Options */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              New Status
            </p>
            {transitions.map((transition) => (
              <button
                key={transition.value}
                type="button"
                onClick={() => {
                  setSelected(transition.value);
                  setReason("");
                }}
                className={clsx(
                  "w-full text-left rounded-lg border p-3 transition-all duration-150",
                  selected === transition.value
                    ? "border-[var(--eztrack-primary-500,#6366f1)] bg-[var(--eztrack-primary-500,#6366f1)]/5 ring-1 ring-[var(--eztrack-primary-500,#6366f1)]/30"
                    : "border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--surface-primary)]"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Radio indicator */}
                  <div
                    className={clsx(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      selected === transition.value
                        ? "border-[var(--eztrack-primary-500,#6366f1)]"
                        : "border-[var(--border-default)]"
                    )}
                  >
                    {selected === transition.value && (
                      <div className="h-2 w-2 rounded-full bg-[var(--eztrack-primary-500,#6366f1)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StatusBadge status={currentStatus} dot />
                    <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)] shrink-0" />
                    <StatusBadge status={transition.value} dot />
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      {transition.label}
                    </span>
                  </div>
                </div>
                {transition.description && (
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5 ml-6">
                    {transition.description}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Warning */}
          {selectedTransition?.warning && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-yellow-700 dark:text-yellow-300">
                {selectedTransition.warning}
              </p>
            </div>
          )}

          {/* Reason field */}
          {needsReason && (
            <Textarea
              label="Reason (required)"
              placeholder="Why is this status change needed?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          )}
        </div>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          isLoading={loading}
          disabled={loading || !selected || (needsReason && !reason.trim())}
        >
          Change Status
        </Button>
      </ModalFooter>
    </Modal>
  );
}
