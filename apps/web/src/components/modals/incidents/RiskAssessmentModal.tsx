"use client";

import { useState } from "react";
import clsx from "clsx";
import { FormModal } from "@/components/modals/FormModal";
import { Textarea } from "@/components/ui/Textarea";

type RiskLevel = "critical" | "high" | "medium" | "low" | "informational";

const RISK_LEVELS: {
  value: RiskLevel;
  label: string;
  color: string;
  bg: string;
  ring: string;
  description: string;
}[] = [
  {
    value: "critical",
    label: "Critical",
    color: "bg-red-500",
    bg: "bg-red-500/10 text-red-600",
    ring: "ring-red-500",
    description: "Immediate threat to safety or operations",
  },
  {
    value: "high",
    label: "High",
    color: "bg-orange-500",
    bg: "bg-orange-500/10 text-orange-600",
    ring: "ring-orange-500",
    description: "Significant risk requiring urgent attention",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-yellow-500",
    bg: "bg-yellow-500/10 text-yellow-600",
    ring: "ring-yellow-500",
    description: "Moderate risk with potential for escalation",
  },
  {
    value: "low",
    label: "Low",
    color: "bg-green-500",
    bg: "bg-green-500/10 text-green-600",
    ring: "ring-green-500",
    description: "Minor risk, standard handling procedures",
  },
  {
    value: "informational",
    label: "Informational",
    color: "bg-blue-500",
    bg: "bg-blue-500/10 text-blue-600",
    ring: "ring-blue-500",
    description: "For record keeping, no immediate action required",
  },
];

interface RiskAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    riskLevel: RiskLevel;
    notes: string;
  }) => void | Promise<void>;
  initialLevel?: RiskLevel;
  initialNotes?: string;
}

export function RiskAssessmentModal({
  open,
  onClose,
  onSubmit,
  initialLevel = "medium",
  initialNotes = "",
}: RiskAssessmentModalProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(initialLevel);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ riskLevel, notes: notes.trim() });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRiskLevel(initialLevel);
    setNotes(initialNotes);
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Risk Assessment"
      size="sm"
      submitLabel="Save Assessment"
      isSubmitting={isSubmitting}
    >
      <div>
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
          Risk Level
        </label>
        <div className="space-y-1.5">
          {RISK_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setRiskLevel(level.value)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150",
                riskLevel === level.value
                  ? "border-[var(--border-focused)] bg-[var(--surface-secondary)] ring-1 ring-[var(--focus-ring)]"
                  : "border-[var(--border-default)] bg-[var(--surface-primary)] hover:border-[var(--border-hover)]"
              )}
            >
              <div className="flex items-center gap-2.5 flex-1">
                <div
                  className={clsx("h-3 w-3 rounded-full shrink-0", level.color)}
                />
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">
                    {level.label}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    {level.description}
                  </p>
                </div>
              </div>
              {riskLevel === level.value && (
                <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium", level.bg)}>
                  Selected
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Assessment Notes"
        placeholder="Provide context and rationale for the risk level assessment..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />
    </FormModal>
  );
}
