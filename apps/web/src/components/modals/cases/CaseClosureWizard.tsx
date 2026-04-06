"use client";

import { useState } from "react";
import { WizardModal } from "@/components/modals/WizardModal";
import { Textarea } from "@/components/ui/Textarea";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface CaseClosureWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClosureData) => void | Promise<void>;
  checklist?: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface ClosureData {
  closureNotes: string;
  finalReviewSummary: string;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "outcome", label: "Outcome documented?", completed: true },
  { id: "evidence", label: "All evidence accounted?", completed: true },
  { id: "tasks", label: "All critical tasks complete?", completed: false },
  { id: "financial", label: "Financial analysis reviewed?", completed: true },
];

const STEPS = [
  { id: "checklist", label: "Checklist" },
  { id: "notes", label: "Notes" },
  { id: "confirm", label: "Confirm" },
];

export function CaseClosureWizard({
  open,
  onClose,
  onSubmit,
  checklist = DEFAULT_CHECKLIST,
}: CaseClosureWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [closureNotes, setClosureNotes] = useState("");
  const [finalReviewSummary, setFinalReviewSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = checklist.every((item) => item.completed);

  const isStepValid = (() => {
    switch (currentIndex) {
      case 0:
        return allChecked;
      case 1:
        return closureNotes.trim() !== "";
      case 2:
        return true;
      default:
        return false;
    }
  })();

  const handleNext = async () => {
    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onSubmit({ closureNotes, finalReviewSummary });
        setCurrentIndex(0);
        setClosureNotes("");
        setFinalReviewSummary("");
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  return (
    <WizardModal
      open={open}
      onClose={onClose}
      title="Close Case"
      steps={STEPS}
      currentIndex={currentIndex}
      onBack={handleBack}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      isStepValid={isStepValid}
      submitLabel="Close Case"
    >
      {/* Step 1: Checklist */}
      {currentIndex === 0 && (
        <div className="space-y-3">
          <p className="text-[13px] text-[var(--text-secondary)] mb-3">
            All items must be completed before the case can be closed.
          </p>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  item.completed
                    ? "border-green-200 bg-green-50/50"
                    : "border-red-200 bg-red-50/50"
                )}
              >
                {item.completed ? (
                  <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                ) : (
                  <XCircle size={18} className="text-red-500 shrink-0" />
                )}
                <span
                  className={clsx(
                    "text-[13px]",
                    item.completed ? "text-[var(--text-primary)]" : "text-red-700"
                  )}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {!allChecked && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 mt-3">
              <AlertTriangle size={16} className="text-yellow-600 shrink-0" />
              <p className="text-[12px] text-yellow-700">
                Complete all checklist items before proceeding.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Notes */}
      {currentIndex === 1 && (
        <div className="space-y-4">
          <Textarea
            label="Closure Notes"
            placeholder="Summarize the closure rationale..."
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            rows={4}
          />

          <Textarea
            label="Final Review Summary (optional)"
            placeholder="High-level summary for stakeholders..."
            value={finalReviewSummary}
            onChange={(e) => setFinalReviewSummary(e.target.value)}
            rows={3}
          />
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentIndex === 2 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-medium text-red-800 mb-1">
                This action is irreversible
              </p>
              <p className="text-[13px] text-red-700 leading-relaxed">
                Once closed, this case cannot be reopened. All records, evidence,
                and financial data will be locked. Ensure all information is
                accurate before proceeding.
              </p>
            </div>
          </div>

          {closureNotes && (
            <div className="p-3 rounded-lg border border-[var(--border-default)]">
              <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Closure Notes Preview
              </p>
              <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
                {closureNotes}
              </p>
            </div>
          )}

          {finalReviewSummary && (
            <div className="p-3 rounded-lg border border-[var(--border-default)]">
              <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Final Review Summary
              </p>
              <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
                {finalReviewSummary}
              </p>
            </div>
          )}
        </div>
      )}
    </WizardModal>
  );
}
