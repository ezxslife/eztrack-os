"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { WizardModal } from "@/components/modals/WizardModal";
import { ModalContent } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface EscalationChainModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EscalationData) => void | Promise<void>;
  sourceType: "daily_log" | "dispatch" | "incident";
  sourceData: {
    id: string;
    title: string;
    location: string;
    priority: string;
    synopsis: string;
    createdBy: string;
  };
  targetType: "dispatch" | "incident" | "case";
}

interface EscalationData {
  targetTitle: string;
  targetLocation: string;
  targetPriority: string;
  targetSynopsis: string;
  additionalNotes: string;
}

const ESCALATION_CHAIN = {
  daily_log: ["Daily Log", "Dispatch", "Incident", "Case"],
  dispatch: ["Dispatch", "Incident", "Case"],
  incident: ["Incident", "Case"],
};

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
  { value: "P5", label: "P5 - Informational" },
];

const LOCATION_OPTIONS = [
  { value: "main-lobby", label: "Main Lobby" },
  { value: "parking-a", label: "Parking Lot A" },
  { value: "parking-b", label: "Parking Lot B" },
  { value: "building-north", label: "North Building" },
  { value: "building-south", label: "South Building" },
  { value: "pool-area", label: "Pool Area" },
  { value: "fitness-center", label: "Fitness Center" },
];

export function EscalationChainModal({
  open,
  onClose,
  onSubmit,
  sourceType,
  sourceData,
  targetType,
}: EscalationChainModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [targetTitle, setTargetTitle] = useState(sourceData.title);
  const [targetLocation, setTargetLocation] = useState(sourceData.location);
  const [targetPriority, setTargetPriority] = useState(sourceData.priority);
  const [targetSynopsis, setTargetSynopsis] = useState(sourceData.synopsis);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const chain = ESCALATION_CHAIN[sourceType];
  const sourceIndex = chain.findIndex(
    (t) => t.toLowerCase().replace(" ", "_") === sourceType
  );
  const targetIndex = chain.findIndex(
    (t) => t.toLowerCase().replace(" ", "_") === targetType
  );

  const steps = [
    { id: "review", label: "Review Source" },
    { id: "configure", label: "Configure Target" },
    { id: "confirm", label: "Confirm" },
  ];

  const isStepValid =
    currentStep === 0 ||
    (currentStep === 1 &&
      !!targetTitle.trim() &&
      !!targetLocation &&
      !!targetSynopsis.trim()) ||
    currentStep === 2;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        targetTitle,
        targetLocation,
        targetPriority,
        targetSynopsis,
        additionalNotes,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setTargetTitle(sourceData.title);
    setTargetLocation(sourceData.location);
    setTargetPriority(sourceData.priority);
    setTargetSynopsis(sourceData.synopsis);
    setAdditionalNotes("");
  };

  return (
    <WizardModal
      open={open}
      onClose={onClose}
      title="Escalate Record"
      steps={steps}
      currentIndex={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      isStepValid={isStepValid}
      submitLabel="Escalate"
    >
      <ModalContent className="space-y-4">
        {currentStep === 0 && (
          <div className="space-y-4">
            {/* Escalation Path Visualization */}
            <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-default)]">
              {chain.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-1">
                  <div
                    className={clsx(
                      "px-2 py-1.5 rounded text-[11px] font-medium whitespace-nowrap",
                      idx <= targetIndex
                        ? "bg-[var(--eztrack-primary-500,#6366f1)] text-white"
                        : "bg-[var(--surface-primary)] text-[var(--text-secondary)]"
                    )}
                  >
                    {item}
                  </div>
                  {idx < chain.length - 1 && (
                    <ChevronRight
                      size={14}
                      className={clsx(
                        idx < targetIndex
                          ? "text-[var(--eztrack-primary-500,#6366f1)]"
                          : "text-[var(--border-default)]"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Source Record Summary */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Source Record
              </h3>
              <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      Title
                    </p>
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">
                      {sourceData.title}
                    </p>
                  </div>
                  <Badge tone="info">{sourceType.replace("_", " ")}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      Location
                    </p>
                    <p className="text-[13px] text-[var(--text-primary)]">
                      {sourceData.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      Priority
                    </p>
                    <p className="text-[13px] text-[var(--text-primary)]">
                      {sourceData.priority}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    Synopsis
                  </p>
                  <p className="text-[13px] text-[var(--text-primary)]">
                    {sourceData.synopsis}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-3">
            <Input
              label="Title"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
              placeholder="Enter target record title"
            />
            <Select
              label="Location"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              options={LOCATION_OPTIONS}
              placeholder="Select location"
            />
            <Select
              label="Priority"
              value={targetPriority}
              onChange={(e) => setTargetPriority(e.target.value)}
              options={PRIORITY_OPTIONS}
            />
            <Textarea
              label="Synopsis"
              value={targetSynopsis}
              onChange={(e) => setTargetSynopsis(e.target.value)}
              placeholder="Enter synopsis for target record"
              rows={3}
            />
            <Textarea
              label="Additional Notes (Optional)"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional context for escalation"
              rows={2}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)]">
              <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-3">
                Source → Target Preview
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    Source
                  </p>
                  <div className="space-y-1 text-[12px]">
                    <p className="text-[var(--text-primary)] font-medium">
                      {sourceData.title}
                    </p>
                    <p className="text-[var(--text-tertiary)]">
                      {sourceData.location}
                    </p>
                    <Badge tone="info">{sourceData.priority}</Badge>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ChevronRight
                    size={20}
                    className="text-[var(--eztrack-primary-500,#6366f1)]"
                  />
                </div>

                {/* Target */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    Target
                  </p>
                  <div className="space-y-1 text-[12px]">
                    <p className="text-[var(--text-primary)] font-medium">
                      {targetTitle}
                    </p>
                    <p className="text-[var(--text-tertiary)]">
                      {targetLocation}
                    </p>
                    <Badge tone="success">{targetPriority}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {additionalNotes && (
              <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)]">
                <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Additional Notes
                </p>
                <p className="text-[13px] text-[var(--text-primary)]">
                  {additionalNotes}
                </p>
              </div>
            )}

            <div className="p-2 rounded-lg bg-[var(--status-info-surface)] border border-[var(--status-info-border)]">
              <p className="text-[12px] text-[var(--status-info)]">
                This will create a new {targetType} record with data from the
                source record.
              </p>
            </div>
          </div>
        )}
      </ModalContent>
    </WizardModal>
  );
}
