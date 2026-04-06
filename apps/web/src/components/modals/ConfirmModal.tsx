"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Info, Trash2, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const ICON_MAP = {
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  destructive: { icon: Trash2, color: "text-red-500", bg: "bg-red-500/10" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  success: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
} as const;

type ConfirmVariant = keyof typeof ICON_MAP;

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  isLoading?: boolean;
}

/**
 * Standardized confirmation modal with optional reason field.
 * Used for: delete, archive, status changes, ban/unban, lock/unlock.
 *
 * iOS 26 style: frosted glass overlay, spring animation, compact layout.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason...",
  isLoading = false,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const config = ICON_MAP[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(requireReason ? reason : undefined);
      setReason("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isLoading || submitting;

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>{title}</ModalHeader>
      <ModalContent>
        <div className="flex gap-3.5">
          <div
            className={clsx(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              config.bg
            )}
          >
            <Icon className={clsx("h-5 w-5", config.color)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {description}
            </div>

            {requireReason && (
              <div className="mt-3">
                <Textarea
                  label={reasonLabel}
                  placeholder={reasonPlaceholder}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  error={
                    requireReason && reason.trim() === ""
                      ? undefined // Don't show error until submit attempt
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "destructive" ? "destructive" : "default"}
          size="sm"
          onClick={handleConfirm}
          isLoading={loading}
          disabled={loading || (requireReason && !reason.trim())}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
