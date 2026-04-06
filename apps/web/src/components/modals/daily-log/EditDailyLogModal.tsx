"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface EditDailyLogModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DailyLogFormData) => void | Promise<void>;
  initialData: DailyLogFormData | null;
}

interface DailyLogFormData {
  topic: string;
  location: string;
  priority: string;
  notes: string;
  staffInvolved: string;
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

export function EditDailyLogModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditDailyLogModalProps) {
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("low");
  const [notes, setNotes] = useState("");
  const [staffInvolved, setStaffInvolved] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setTopic(initialData.topic);
      setLocation(initialData.location);
      setPriority(initialData.priority);
      setNotes(initialData.notes);
      setStaffInvolved(initialData.staffInvolved);
    }
  }, [initialData, open]);

  const isValid = topic.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ topic, location, priority, notes, staffInvolved });
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
      title="Edit Daily Log"
      subtitle="Update this log entry"
      size="md"
      submitLabel="Save Changes"
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
        rows={3}
      />

      <Input
        label="Staff Involved"
        placeholder="Names of staff involved..."
        value={staffInvolved}
        onChange={(e) => setStaffInvolved(e.target.value)}
      />
    </FormModal>
  );
}
