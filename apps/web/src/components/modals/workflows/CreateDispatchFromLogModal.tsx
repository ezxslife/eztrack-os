"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

interface CreateDispatchFromLogModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DispatchCreationData) => void | Promise<void>;
  logData: {
    id: string;
    recordNumber: string;
    topic: string;
    location: string;
    priority: string;
    synopsis: string;
    createdBy: string;
  };
}

interface DispatchCreationData {
  dispatchType: string;
  location: string;
  description: string;
  priority: string;
  assignedOfficers: string[];
  expectedDuration: string;
}

const DISPATCH_TYPE_OPTIONS = [
  { value: "medical", label: "Medical" },
  { value: "fire", label: "Fire" },
  { value: "security", label: "Security" },
  { value: "noise", label: "Noise" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
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

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
  { value: "P5", label: "P5 - Informational" },
];

const OFFICER_OPTIONS = [
  { value: "officer-001", label: "Officer John Smith" },
  { value: "officer-002", label: "Officer Jane Doe" },
  { value: "officer-003", label: "Officer Mike Johnson" },
  { value: "officer-004", label: "Officer Sarah Williams" },
];

const DURATION_OPTIONS = [
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "2h", label: "2 hours" },
  { value: "4h", label: "4 hours" },
  { value: "8h", label: "8 hours" },
  { value: "unknown", label: "Unknown" },
];

export function CreateDispatchFromLogModal({
  open,
  onClose,
  onSubmit,
  logData,
}: CreateDispatchFromLogModalProps) {
  const [dispatchType, setDispatchType] = useState(
    logData.topic.toLowerCase()
  );
  const [location, setLocation] = useState(logData.location);
  const [description, setDescription] = useState(logData.synopsis);
  const [priority, setPriority] = useState(logData.priority);
  const [assignedOfficers, setAssignedOfficers] = useState<string[]>([]);
  const [expectedDuration, setExpectedDuration] = useState("unknown");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    dispatchType &&
    location &&
    description.trim() &&
    priority &&
    expectedDuration;

  const handleOfficerToggle = (officerId: string) => {
    setAssignedOfficers((prev) =>
      prev.includes(officerId)
        ? prev.filter((id) => id !== officerId)
        : [...prev, officerId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        dispatchType,
        location,
        description,
        priority,
        assignedOfficers,
        expectedDuration,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDispatchType(logData.topic.toLowerCase());
    setLocation(logData.location);
    setDescription(logData.synopsis);
    setPriority(logData.priority);
    setAssignedOfficers([]);
    setExpectedDuration("unknown");
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <ArrowRight size={16} />
          Create Dispatch from Daily Log
        </div>
      </ModalHeader>

      <ModalContent className="space-y-4">
        {/* Source Log Reference */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] text-[var(--text-tertiary)]">
            Source Log:
          </span>
          <Badge tone="info">{logData.recordNumber}</Badge>
        </div>

        {/* Form Fields */}
        <Select
          label="Dispatch Type"
          value={dispatchType}
          onChange={(e) => setDispatchType(e.target.value)}
          options={DISPATCH_TYPE_OPTIONS}
        />

        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Dispatch location"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dispatch description (pre-filled from log synopsis)"
          rows={3}
        />

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={PRIORITY_OPTIONS}
        />

        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
            Assign Officers (Optional)
          </label>
          <div className="space-y-2">
            {OFFICER_OPTIONS.map((officer) => (
              <label
                key={officer.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={assignedOfficers.includes(officer.value)}
                  onChange={() => handleOfficerToggle(officer.value)}
                  className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--action-primary)]"
                />
                <span className="text-[13px] text-[var(--text-primary)]">
                  {officer.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Select
          label="Expected Duration"
          value={expectedDuration}
          onChange={(e) => setExpectedDuration(e.target.value)}
          options={DURATION_OPTIONS}
        />

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-[var(--status-info-surface)] border border-[var(--status-info-border)]">
          <p className="text-[12px] text-[var(--status-info)]">
            This dispatch will be linked to the source daily log {logData.recordNumber}.
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
          Create Dispatch
        </Button>
      </ModalFooter>
    </Modal>
  );
}
