"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { SelectionTile } from "@/components/ui/SelectionTile";
import { Textarea } from "@/components/ui/Textarea";

type RiskLevel = "critical" | "high" | "medium" | "low" | "informational";

const RISK_LEVELS: {
  value: RiskLevel;
  label: string;
  color: string;
  description: string;
}[] = [
  {
    value: "critical",
    label: "Critical",
    color: "bg-red-500",
    description: "Immediate threat to safety or operations",
  },
  {
    value: "high",
    label: "High",
    color: "bg-orange-500",
    description: "Significant risk requiring urgent attention",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-yellow-500",
    description: "Moderate risk with potential for escalation",
  },
  {
    value: "low",
    label: "Low",
    color: "bg-green-500",
    description: "Minor risk, standard handling procedures",
  },
  {
    value: "informational",
    label: "Informational",
    color: "bg-blue-500",
    description: "For record keeping, no immediate action required",
  },
];

const RISK_TONES = {
  critical: "critical",
  high: "warning",
  medium: "warning",
  low: "success",
  informational: "info",
} as const;

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
            <SelectionTile
              key={level.value}
              onClick={() => setRiskLevel(level.value)}
              selected={riskLevel === level.value}
              selectedLabel="Selected"
              tone={RISK_TONES[level.value]}
              title={level.label}
              description={level.description}
              leading={<span className={`mt-1 h-3 w-3 rounded-full ${level.color}`} />}
            />
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
