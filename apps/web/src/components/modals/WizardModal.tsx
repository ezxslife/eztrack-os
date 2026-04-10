"use client";

import { type ReactNode } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Modal, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface WizardStep {
  id: string;
  label: string;
}

interface WizardModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: WizardStep[];
  currentIndex: number;
  onBack: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
  isStepValid?: boolean;
  submitLabel?: string;
  children: ReactNode;
}

/**
 * Multi-step wizard modal with iOS 26 step indicator.
 * Used for complex creation flows: create incident, add participant,
 * escalate to case, evidence chain of custody transfer.
 *
 * Design: Horizontal numbered stepper with connecting lines,
 * completed steps show checkmarks, current step is highlighted.
 */
export function WizardModal({
  open,
  onClose,
  title,
  steps,
  currentIndex,
  onBack,
  onNext,
  isSubmitting = false,
  isStepValid = true,
  submitLabel = "Create",
  children,
}: WizardModalProps) {
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;
  const currentStep = steps[currentIndex];

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* Wizard Header with Step Indicator */}
      <div className="border-b border-[var(--border-default)] px-4 pb-3 pt-4 sm:px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="min-w-0 pr-3 text-[15px] font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          <span className="text-[12px] text-[var(--text-tertiary)]">
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>

        <div className="md:hidden space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-[var(--text-primary)]">
              {currentStep?.label}
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {currentIndex + 1}/{steps.length}
            </span>
          </div>
          <ProgressBar
            value={((currentIndex + 1) / steps.length) * 100}
            size="sm"
          />
        </div>

        <div className="hidden md:block">
          <StepIndicator steps={steps} currentIndex={currentIndex} />
        </div>
      </div>

      <ModalContent>
        {children}
      </ModalContent>

      <ModalFooter className="sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={isFirstStep || isSubmitting}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
          <Button
            size="sm"
            onClick={onNext}
            isLoading={isSubmitting}
            disabled={!isStepValid || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isLastStep ? submitLabel : "Next"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

/* ── Step Indicator Component ── */

function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: WizardStep[];
  currentIndex: number;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isUpcoming = idx > currentIndex;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step Circle + Label */}
            <div className="flex flex-col items-center relative">
              <div
                className={clsx(
                  "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                  "transition-all duration-300",
                  isCompleted &&
                    "bg-[var(--action-primary-fill)] text-[var(--text-on-brand)]",
                  isCurrent &&
                    "bg-[var(--action-primary-fill)] text-[var(--text-on-brand)] ring-4 ring-[var(--action-primary-fill)]/20",
                  isUpcoming &&
                    "bg-[var(--surface-secondary)] text-[var(--text-tertiary)] border border-[var(--border-default)]"
                )}
                style={
                  isCurrent
                    ? { boxShadow: "0 0 0 4px color-mix(in srgb, var(--action-primary) 20%, transparent)" }
                    : undefined
                }
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={clsx(
                  "text-[10px] mt-1.5 whitespace-nowrap absolute -bottom-5",
                  isCurrent
                    ? "text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting Line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={clsx(
                    "h-[2px] w-full rounded-full transition-colors duration-300",
                    idx < currentIndex
                      ? "bg-[var(--action-primary-fill)]"
                      : "bg-[var(--border-default)]"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Standalone StepIndicator export for use outside modals
 * (e.g., full-page wizard layouts).
 */
export { StepIndicator };
