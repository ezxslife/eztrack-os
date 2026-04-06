"use client";

import { StatusChangeModal } from "@/components/modals/StatusChangeModal";

interface CaseStatusChangeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newStatus: string, reason?: string) => void | Promise<void>;
  currentStatus: string;
  caseNumber: string;
  isLoading?: boolean;
}

/**
 * 7-stage case workflow status change modal.
 * INTAKE -> INVESTIGATION -> ANALYSIS -> REVIEW -> ADJUDICATION -> CLOSED -> ARCHIVED
 */

const CASE_TRANSITIONS: Record<
  string,
  { value: string; label: string; description?: string; requiresReason?: boolean; warning?: string }[]
> = {
  INTAKE: [
    {
      value: "INVESTIGATION",
      label: "Investigation",
      description: "Move the case into active investigation. Assigns investigators and opens evidence logging.",
    },
    {
      value: "CLOSED",
      label: "Close (No Action)",
      description: "Close the case without further investigation.",
      requiresReason: true,
      warning: "Closing a case at intake will skip all investigation and review stages.",
    },
  ],
  INVESTIGATION: [
    {
      value: "ANALYSIS",
      label: "Analysis",
      description: "All evidence has been collected. Move to analysis and findings compilation.",
    },
    {
      value: "INTAKE",
      label: "Return to Intake",
      description: "Send back to intake for re-evaluation.",
      requiresReason: true,
    },
  ],
  ANALYSIS: [
    {
      value: "REVIEW",
      label: "Review",
      description: "Analysis is complete. Submit for supervisory review.",
    },
    {
      value: "INVESTIGATION",
      label: "Return to Investigation",
      description: "Additional investigation is needed before analysis can be completed.",
      requiresReason: true,
    },
  ],
  REVIEW: [
    {
      value: "ADJUDICATION",
      label: "Adjudication",
      description: "Review is complete. Move to final adjudication and decision-making.",
    },
    {
      value: "ANALYSIS",
      label: "Return to Analysis",
      description: "Reviewer has identified gaps in the analysis.",
      requiresReason: true,
    },
  ],
  ADJUDICATION: [
    {
      value: "CLOSED",
      label: "Close Case",
      description: "Final decision has been made. Close the case and generate final report.",
      requiresReason: true,
    },
    {
      value: "REVIEW",
      label: "Return to Review",
      description: "Additional review is required before adjudication.",
      requiresReason: true,
    },
  ],
  CLOSED: [
    {
      value: "ARCHIVED",
      label: "Archive",
      description: "Archive the case for long-term retention. This action is permanent.",
      warning: "Archived cases cannot be reopened. Ensure all records are finalized.",
    },
    {
      value: "INVESTIGATION",
      label: "Reopen Case",
      description: "New evidence or information requires the case to be reopened.",
      requiresReason: true,
      warning: "Reopening a closed case will reset the workflow to Investigation.",
    },
  ],
  ARCHIVED: [],
};

export function CaseStatusChangeModal({
  open,
  onClose,
  onConfirm,
  currentStatus,
  caseNumber,
  isLoading,
}: CaseStatusChangeModalProps) {
  const transitions = CASE_TRANSITIONS[currentStatus] ?? [];

  return (
    <StatusChangeModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      entityType="case"
      entityLabel={`Case ${caseNumber}`}
      currentStatus={currentStatus}
      transitions={transitions}
      isLoading={isLoading}
    />
  );
}
