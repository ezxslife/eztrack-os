"use client";

import { useState } from "react";
import { WizardModal } from "@/components/modals/WizardModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Package } from "lucide-react";

interface TransferEvidenceWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransferData) => void | Promise<void>;
  evidence: EvidenceItem | null;
}

interface EvidenceItem {
  title: string;
  currentCustodian: string;
  currentLocation: string;
  daysHeld: number;
}

interface TransferData {
  newCustodian: string;
  newLocation: string;
  reason: string;
  authorized: boolean;
  notes: string;
}

const STEPS = [
  { id: "review", label: "Review" },
  { id: "destination", label: "Destination" },
  { id: "confirm", label: "Confirm" },
];

export function TransferEvidenceWizard({
  open,
  onClose,
  onSubmit,
  evidence,
}: TransferEvidenceWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newCustodian, setNewCustodian] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [reason, setReason] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStepValid = (() => {
    switch (currentIndex) {
      case 0:
        return true; // review step is always valid
      case 1:
        return newCustodian.trim() !== "" && newLocation.trim() !== "";
      case 2:
        return reason.trim() !== "" && authorized;
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
        await onSubmit({ newCustodian, newLocation, reason, authorized, notes });
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
    setNewCustodian("");
    setNewLocation("");
    setReason("");
    setAuthorized(false);
    setNotes("");
  };

  return (
    <WizardModal
      open={open}
      onClose={onClose}
      title="Transfer Evidence"
      steps={STEPS}
      currentIndex={currentIndex}
      onBack={handleBack}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      isStepValid={isStepValid}
      submitLabel="Complete Transfer"
    >
      {/* Step 1: Review */}
      {currentIndex === 0 && evidence && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-secondary)]">
            <div className="h-10 w-10 rounded-lg bg-[var(--eztrack-primary-500,#6366f1)]/10 flex items-center justify-center">
              <Package size={18} className="text-[var(--eztrack-primary-500,#6366f1)]" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-[var(--text-primary)]">
                {evidence.title}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Evidence item under review
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-[var(--border-default)]">
              <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Current Custodian
              </p>
              <p className="text-[13px] text-[var(--text-primary)]">
                {evidence.currentCustodian}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border-default)]">
              <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Current Location
              </p>
              <p className="text-[13px] text-[var(--text-primary)]">
                {evidence.currentLocation}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border-default)]">
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Days Held
            </p>
            <p className="text-[13px] text-[var(--text-primary)]">
              {evidence.daysHeld} day{evidence.daysHeld !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Destination */}
      {currentIndex === 1 && (
        <div className="space-y-4">
          <Input
            label="New Custodian"
            placeholder="Search for new custodian..."
            value={newCustodian}
            onChange={(e) => setNewCustodian(e.target.value)}
          />
          <Input
            label="New Location"
            placeholder="Transfer destination..."
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentIndex === 2 && (
        <div className="space-y-4">
          <Textarea
            label="Reason for Transfer"
            placeholder="Explain why this evidence is being transferred..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />

          <Toggle
            checked={authorized}
            onChange={setAuthorized}
            label="I confirm I am authorized to execute this transfer"
          />

          <Textarea
            label="Transfer Notes (optional)"
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      )}
    </WizardModal>
  );
}
