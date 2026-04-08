"use client";

import { type ReactNode, type FormEvent } from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type ModalSize = "sm" | "md" | "lg";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  title: string;
  subtitle?: string;
  size?: ModalSize;
  submitLabel?: string;
  cancelLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
  isSubmitting?: boolean;
  isValid?: boolean;
  children: ReactNode;
}

/**
 * Generic single-step form modal.
 * Wraps Modal with a <form> element and standardized footer.
 * Used for all simple CRUD operations: add note, add contact, edit entry, etc.
 *
 * iOS 26 style: clean form layout, compact inputs, spring-animated entry.
 */
export function FormModal({
  open,
  onClose,
  onSubmit,
  title,
  subtitle,
  size = "md",
  submitLabel = "Save",
  cancelLabel = "Cancel",
  secondaryAction,
  isSubmitting = false,
  isValid = true,
  children,
}: FormModalProps) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    await onSubmit();
  };

  return (
    <Modal open={open} onClose={onClose} size={size}>
      <ModalHeader onClose={onClose}>
        {title}
      </ModalHeader>

      {subtitle && (
        <div className="px-4 -mt-1 pb-0 sm:px-5">
          <p className="text-[12px] text-[var(--text-tertiary)]">{subtitle}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <ModalContent>
          <div className="space-y-4">{children}</div>
        </ModalContent>

        <ModalFooter>
          {secondaryAction && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={secondaryAction.onClick}
              disabled={isSubmitting}
              className="w-full sm:mr-auto sm:w-auto"
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || !isValid}
            className="w-full sm:w-auto"
          >
            {submitLabel}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
