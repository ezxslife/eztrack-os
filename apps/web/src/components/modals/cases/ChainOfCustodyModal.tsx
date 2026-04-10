"use client";

import { useState } from "react";
import { Package, ArrowRight } from "lucide-react";
import { WizardModal } from "@/components/modals/WizardModal";
import { SelectionTile } from "@/components/ui/SelectionTile";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface EvidenceItem {
  id: string;
  label: string;
  type: string;
}

interface ChainOfCustodyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransferFormData) => void | Promise<void>;
  caseId: string;
  evidenceItems: EvidenceItem[];
}

interface TransferFormData {
  selectedItems: string[];
  receivedBy: string;
  transferReason: string;
  notes: string;
}

const STEPS = [
  { id: "select", label: "Select Evidence" },
  { id: "details", label: "Transfer Details" },
  { id: "confirm", label: "Confirmation" },
];

const RECEIVER_OPTIONS = [
  { value: "lab-forensics", label: "Forensics Lab" },
  { value: "evidence-locker", label: "Evidence Locker" },
  { value: "court-clerk", label: "Court Clerk" },
  { value: "investigator-1", label: "J. Martinez" },
  { value: "investigator-2", label: "R. Chen" },
  { value: "external-agency", label: "External Agency" },
];

const TRANSFER_REASON_OPTIONS = [
  { value: "analysis", label: "Analysis" },
  { value: "storage", label: "Storage" },
  { value: "court", label: "Court" },
  { value: "return", label: "Return" },
];

const TYPE_ICONS: Record<string, string> = {
  physical: "box",
  digital: "hdd",
  document: "file",
  photo: "image",
  video: "film",
  audio: "mic",
};

export function ChainOfCustodyModal({
  open,
  onClose,
  onSubmit,
  caseId: _caseId,
  evidenceItems,
}: ChainOfCustodyModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [receivedBy, setReceivedBy] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStepValid = (() => {
    switch (currentIndex) {
      case 0:
        return selectedItems.length > 0;
      case 1:
        return receivedBy !== "" && transferReason !== "";
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
        await onSubmit({ selectedItems, receivedBy, transferReason, notes });
        handleReset();
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedItems([]);
    setReceivedBy("");
    setTransferReason("");
    setNotes("");
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedEvidenceDetails = evidenceItems.filter((item) =>
    selectedItems.includes(item.id)
  );
  const receiverLabel =
    RECEIVER_OPTIONS.find((o) => o.value === receivedBy)?.label ?? receivedBy;
  const reasonLabel =
    TRANSFER_REASON_OPTIONS.find((o) => o.value === transferReason)?.label ?? transferReason;

  return (
    <WizardModal
      open={open}
      onClose={onClose}
      title="Chain of Custody Transfer"
      steps={STEPS}
      currentIndex={currentIndex}
      onBack={handleBack}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      isStepValid={isStepValid}
      submitLabel="Complete Transfer"
    >
      {/* Step 1: Select Evidence */}
      {currentIndex === 0 && (
        <div className="space-y-3">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Select the evidence items to transfer. {selectedItems.length} of{" "}
            {evidenceItems.length} selected.
          </p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {evidenceItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              return (
                <SelectionTile
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  indicator="check"
                  selected={isSelected}
                  selectedLabel="Included"
                  title={item.label}
                  description={<span className="capitalize">{item.type}</span>}
                  leading={
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-secondary)]">
                      <Package size={14} className="text-[var(--text-tertiary)]" />
                    </div>
                  }
                />
              );
            })}
            {evidenceItems.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[13px] text-[var(--text-tertiary)]">
                  No evidence items available for transfer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Transfer Details */}
      {currentIndex === 1 && (
        <div className="space-y-4">
          <Select
            label="Received By"
            options={RECEIVER_OPTIONS}
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="Select recipient..."
          />

          <Select
            label="Transfer Reason"
            options={TRANSFER_REASON_OPTIONS}
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            placeholder="Select reason..."
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Additional notes about this transfer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentIndex === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] space-y-3">
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Items Being Transferred
            </p>
            <div className="space-y-2">
              {selectedEvidenceDetails.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]"
                >
                  <Package size={12} className="text-[var(--text-tertiary)] shrink-0" />
                  <span className="truncate">{item.label}</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] capitalize">
                    ({item.type})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-default)]">
            <div className="flex-1 text-center">
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                From
              </p>
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                Current Custodian
              </p>
            </div>
            <ArrowRight size={16} className="text-[var(--text-tertiary)] shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                To
              </p>
              <p className="text-[13px] font-medium text-[var(--eztrack-primary-500,#6366f1)]">
                {receiverLabel}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border-default)]">
            <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Reason
            </p>
            <p className="text-[13px] text-[var(--text-primary)] capitalize">{reasonLabel}</p>
          </div>

          {notes.trim() && (
            <div className="p-3 rounded-lg border border-[var(--border-default)]">
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-[13px] text-[var(--text-primary)]">{notes}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-[12px] text-yellow-700 dark:text-yellow-300">
              By completing this transfer, a chain of custody record will be created
              with a timestamp and your digital signature. This action is logged
              and cannot be undone.
            </p>
          </div>
        </div>
      )}
    </WizardModal>
  );
}
