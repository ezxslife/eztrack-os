"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

interface CreateWorkOrderFromCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WorkOrderCreationData) => void | Promise<void>;
  caseData: {
    id: string;
    caseNumber: string;
    title: string;
    findings: string;
    severity: string;
  };
}

interface WorkOrderCreationData {
  title: string;
  description: string;
  category: string;
  priority: string;
  assignee: string;
  dueDate: string;
  estimatedCost: string;
}

const CATEGORY_OPTIONS = [
  { value: "corrective", label: "Corrective Action" },
  { value: "preventive", label: "Preventive" },
  { value: "repair", label: "Repair" },
  { value: "inspection", label: "Inspection" },
  { value: "maintenance", label: "Maintenance" },
];

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
];

const TECHNICIAN_OPTIONS = [
  { value: "tech-001", label: "John Maintenance" },
  { value: "tech-002", label: "Mary Services" },
  { value: "tech-003", label: "Carlos Facilities" },
  { value: "tech-004", label: "Diana Repairs" },
];

const SEVERITY_TO_PRIORITY: Record<string, string> = {
  critical: "P1",
  high: "P2",
  medium: "P3",
  low: "P4",
};

export function CreateWorkOrderFromCaseModal({
  open,
  onClose,
  onSubmit,
  caseData,
}: CreateWorkOrderFromCaseModalProps) {
  const [title, setTitle] = useState(caseData.findings);
  const [description, setDescription] = useState(
    `Work order created from case ${caseData.caseNumber}: ${caseData.title}`
  );
  const [category, setCategory] = useState("corrective");
  const [priority, setPriority] = useState(
    SEVERITY_TO_PRIORITY[caseData.severity.toLowerCase()] || "P3"
  );
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    title.trim() &&
    description.trim() &&
    category &&
    priority &&
    assignee &&
    dueDate;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        category,
        priority,
        assignee,
        dueDate,
        estimatedCost,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle(caseData.findings);
    setDescription(
      `Work order created from case ${caseData.caseNumber}: ${caseData.title}`
    );
    setCategory("corrective");
    setPriority(
      SEVERITY_TO_PRIORITY[caseData.severity.toLowerCase()] || "P3"
    );
    setAssignee("");
    setDueDate("");
    setEstimatedCost("");
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <Wrench size={16} />
          Create Work Order from Case
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
            <Badge tone="info">{caseData.caseNumber}</Badge>
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-1">
              Findings
            </p>
            <p className="text-[12px] text-[var(--text-primary)]">
              {caseData.findings}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Work order title"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Work order description"
          rows={3}
        />

        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORY_OPTIONS}
        />

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={PRIORITY_OPTIONS}
        />

        <Select
          label="Assign To"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          options={TECHNICIAN_OPTIONS}
          placeholder="Select technician or team"
          required
        />

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />

        <Input
          label="Estimated Cost (Optional)"
          type="number"
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value)}
          placeholder="Enter estimated cost in dollars"
          step="0.01"
          min="0"
        />

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-[var(--status-success-surface)] border border-[var(--status-success-border)]">
          <p className="text-[12px] text-[var(--status-success)]">
            This work order will be linked to case {caseData.caseNumber} as a
            corrective action.
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
          Create Work Order
        </Button>
      </ModalFooter>
    </Modal>
  );
}
