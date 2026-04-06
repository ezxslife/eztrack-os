"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Button } from "@/components/ui/Button";

interface ItemDetails {
  id: string;
  description: string;
  category: string;
  location: string;
  date: string;
  reportedBy?: string;
}

interface MatchItemsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { lostItemId: string; foundItemId: string }) => void | Promise<void>;
  lostReport?: ItemDetails;
  foundItem?: ItemDetails;
  matchConfidence?: number;
}

export function MatchItemsModal({
  open,
  onClose,
  onSubmit,
  lostReport,
  foundItem,
  matchConfidence = 0,
}: MatchItemsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = !!lostReport && !!foundItem;

  const handleSubmit = async () => {
    if (!lostReport || !foundItem) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ lostItemId: lostReport.id, foundItemId: foundItem.id });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidenceColor =
    matchConfidence >= 80
      ? "text-green-500"
      : matchConfidence >= 50
      ? "text-yellow-500"
      : "text-[var(--text-tertiary)]";

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Match Items"
      subtitle="Compare lost report with found item"
      size="lg"
      submitLabel="Confirm Match"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Lost Report Side */}
        <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-2">
          <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Lost Report
          </p>
          {lostReport ? (
            <>
              <p className="text-[13px] text-[var(--text-primary)] font-medium">
                {lostReport.description}
              </p>
              <div className="space-y-1 text-[12px] text-[var(--text-tertiary)]">
                <p>Category: {lostReport.category}</p>
                <p>Location: {lostReport.location}</p>
                <p>Date: {lostReport.date}</p>
                {lostReport.reportedBy && <p>Reported by: {lostReport.reportedBy}</p>}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[var(--text-tertiary)]">No lost report selected</p>
          )}
        </div>

        {/* Found Item Side */}
        <div className="rounded-lg border border-[var(--border-default)] p-4 space-y-2">
          <p className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Found Item
          </p>
          {foundItem ? (
            <>
              <p className="text-[13px] text-[var(--text-primary)] font-medium">
                {foundItem.description}
              </p>
              <div className="space-y-1 text-[12px] text-[var(--text-tertiary)]">
                <p>Category: {foundItem.category}</p>
                <p>Location: {foundItem.location}</p>
                <p>Date: {foundItem.date}</p>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[var(--text-tertiary)]">No found item selected</p>
          )}
        </div>
      </div>

      {/* Match Confidence */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-[12px] text-[var(--text-tertiary)]">Match Confidence:</span>
        <span className={`text-[14px] font-semibold ${confidenceColor}`}>
          {matchConfidence}%
        </span>
      </div>
    </FormModal>
  );
}
