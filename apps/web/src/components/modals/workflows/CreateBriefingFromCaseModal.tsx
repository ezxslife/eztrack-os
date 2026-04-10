"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

interface CreateBriefingFromCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BriefingCreationData) => void | Promise<void>;
  caseData: {
    id: string;
    caseNumber: string;
    title: string;
    description: string;
    outcome: string;
    participants: string[];
    severity: string;
  };
}

interface BriefingCreationData {
  title: string;
  briefingType: string;
  content: string;
  priority: string;
  distribution: string[];
}

const BRIEFING_TYPE_OPTIONS = [
  { value: "investigation", label: "Investigation Briefing" },
  { value: "incident", label: "Incident Briefing" },
  { value: "security", label: "Security Briefing" },
  { value: "update", label: "Status Update" },
];

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
];

const DISTRIBUTION_OPTIONS = [
  { value: "all_staff", label: "All Staff" },
  { value: "security_team", label: "Security Team" },
  { value: "management", label: "Management" },
  { value: "dispatch", label: "Dispatch" },
  { value: "investigators", label: "Investigators" },
];

const SEVERITY_TO_PRIORITY: Record<string, string> = {
  critical: "P1",
  high: "P2",
  medium: "P3",
  low: "P4",
};

export function CreateBriefingFromCaseModal({
  open,
  onClose,
  onSubmit,
  caseData,
}: CreateBriefingFromCaseModalProps) {
  const [title, setTitle] = useState(
    `Case ${caseData.caseNumber} — ${caseData.outcome}`
  );
  const [briefingType, setBriefingType] = useState("investigation");
  const [content, setContent] = useState(
    `${caseData.description}\n\nOutcome: ${caseData.outcome}`
  );
  const [priority, setPriority] = useState(
    SEVERITY_TO_PRIORITY[caseData.severity.toLowerCase()] || "P3"
  );
  const [distribution, setDistribution] = useState<string[]>([
    "all_staff",
    "management",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim() && briefingType && content.trim();

  const handleDistributionToggle = (option: string) => {
    setDistribution((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        briefingType,
        content,
        priority,
        distribution,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle(`Case ${caseData.caseNumber} — ${caseData.outcome}`);
    setBriefingType("investigation");
    setContent(`${caseData.description}\n\nOutcome: ${caseData.outcome}`);
    setPriority(
      SEVERITY_TO_PRIORITY[caseData.severity.toLowerCase()] || "P3"
    );
    setDistribution(["all_staff", "management"]);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <FileText size={16} />
          Create Briefing from Case
        </div>
      </ModalHeader>

      <ModalContent className="space-y-4">
        {/* Case Summary Card */}
        <div className="p-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] text-[var(--text-tertiary)] mb-1">
                Linked Case
              </p>
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                {caseData.title}
              </p>
            </div>
            <Badge tone="warning">{caseData.caseNumber}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
            <div>
              <p className="text-[var(--text-tertiary)]">Severity</p>
              <p className="text-[var(--text-primary)] font-medium">
                {caseData.severity}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Outcome</p>
              <p className="text-[var(--text-primary)] font-medium">
                {caseData.outcome}
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Briefing title"
        />

        <Select
          label="Briefing Type"
          value={briefingType}
          onChange={(e) => setBriefingType(e.target.value)}
          options={BRIEFING_TYPE_OPTIONS}
        />

        <Textarea
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Briefing content (pre-filled from case)"
          rows={4}
        />

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={PRIORITY_OPTIONS}
        />

        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
            Distribution
          </label>
          <div className="space-y-2">
            {DISTRIBUTION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={distribution.includes(option.value)}
                  onChange={() => handleDistributionToggle(option.value)}
                  className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--action-primary-fill)]"
                />
                <span className="text-[13px] text-[var(--text-primary)]">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-2">
            Selected: {distribution.length} group{distribution.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-[var(--status-success-surface)] border border-[var(--status-success-border)]">
          <p className="text-[12px] text-[var(--status-success)]">
            This briefing will be created as a draft linked to case{" "}
            {caseData.caseNumber}. Review and customize before distribution.
          </p>
        </div>
      </ModalContent>

      <ModalFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!isValid || isSubmitting}
        >
          Create Draft Briefing
        </Button>
      </ModalFooter>
    </Modal>
  );
}
