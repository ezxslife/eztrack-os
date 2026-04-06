"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface QuickReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuickReportData) => void | Promise<void>;
}

interface QuickReportData {
  topic: string;
  location: string;
  priority: string;
  notes: string;
}

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
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function QuickReportModal({
  open,
  onClose,
  onSubmit,
}: QuickReportModalProps) {
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("low");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = topic.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ topic, location, priority, notes });
      setTopic("");
      setLocation("");
      setPriority("low");
      setNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Quick Report"
      subtitle="Rapid entry for daily log"
      size="sm"
      submitLabel="Log Entry"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Topic"
        placeholder="What happened?"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <Select
        label="Location"
        options={LOCATION_OPTIONS}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Select location..."
      />

      <Select
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      />

      <Textarea
        label="Notes"
        placeholder="Additional details..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
    </FormModal>
  );
}
