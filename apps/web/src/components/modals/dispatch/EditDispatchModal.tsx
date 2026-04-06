"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

interface EditDispatchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DispatchFormData) => void | Promise<void>;
  initialData: DispatchFormData | null;
}

interface DispatchFormData {
  priority: string;
  dispatchCode: string;
  location: string;
  sublocation: string;
  reporterName: string;
  reporterPhone: string;
  anonymous: boolean;
  callSource: string;
  synopsis: string;
}

const PRIORITY_OPTIONS = [
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
  { value: "P5", label: "P5 - Informational" },
];

const DISPATCH_CODE_OPTIONS = [
  { value: "MEDICAL", label: "Medical" },
  { value: "FIRE", label: "Fire" },
  { value: "SECURITY", label: "Security" },
  { value: "NOISE", label: "Noise" },
  { value: "OTHER", label: "Other" },
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

const CALL_SOURCE_OPTIONS = [
  { value: "radio", label: "Radio" },
  { value: "phone", label: "Phone" },
  { value: "in-person", label: "In-Person" },
  { value: "app", label: "App" },
];

export function EditDispatchModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: EditDispatchModalProps) {
  const [priority, setPriority] = useState("P3");
  const [dispatchCode, setDispatchCode] = useState("");
  const [location, setLocation] = useState("");
  const [sublocation, setSublocation] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [callSource, setCallSource] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setPriority(initialData.priority);
      setDispatchCode(initialData.dispatchCode);
      setLocation(initialData.location);
      setSublocation(initialData.sublocation);
      setReporterName(initialData.reporterName);
      setReporterPhone(initialData.reporterPhone);
      setAnonymous(initialData.anonymous);
      setCallSource(initialData.callSource);
      setSynopsis(initialData.synopsis);
    }
  }, [initialData, open]);

  const isValid = dispatchCode !== "" && location !== "" && synopsis.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        priority,
        dispatchCode,
        location,
        sublocation,
        reporterName: anonymous ? "" : reporterName,
        reporterPhone: anonymous ? "" : reporterPhone,
        anonymous,
        callSource,
        synopsis,
      });
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
      title="Edit Dispatch"
      subtitle="Update dispatch information"
      size="lg"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
        <Select
          label="Dispatch Code"
          options={DISPATCH_CODE_OPTIONS}
          value={dispatchCode}
          onChange={(e) => setDispatchCode(e.target.value)}
          placeholder="Select code..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Location"
          options={LOCATION_OPTIONS}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Select location..."
        />
        <Input
          label="Sub-location"
          placeholder="Room, floor, area..."
          value={sublocation}
          onChange={(e) => setSublocation(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">
            Reporter Information
          </span>
          <Toggle
            checked={anonymous}
            onChange={setAnonymous}
            label="Anonymous"
            size="sm"
          />
        </div>
        {!anonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reporter Name"
              placeholder="Full name"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="(555) 000-0000"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
            />
          </div>
        )}
      </div>

      <Select
        label="Call Source"
        options={CALL_SOURCE_OPTIONS}
        value={callSource}
        onChange={(e) => setCallSource(e.target.value)}
        placeholder="Select source..."
      />

      <Textarea
        label="Synopsis"
        placeholder="Describe the situation..."
        value={synopsis}
        onChange={(e) => setSynopsis(e.target.value)}
        rows={3}
      />
    </FormModal>
  );
}
