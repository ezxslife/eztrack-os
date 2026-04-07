"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { useFormState } from "@/hooks/useFormState";
import { editDispatchSchema, type EditDispatchValues } from "@/lib/validations/dispatches";

interface EditDispatchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EditDispatchValues) => void | Promise<void>;
  initialData: EditDispatchValues | null;
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
  const form = useFormState({
    initialValues: {
      priority: "P3",
      dispatchCode: "",
      location: "",
      sublocation: "",
      reporterName: "",
      reporterPhone: "",
      anonymous: false as boolean,
      callSource: "",
      synopsis: "",
    },
    schema: editDispatchSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      form.setValues({
        priority: initialData.priority ?? "P3",
        dispatchCode: initialData.dispatchCode ?? "",
        location: initialData.location ?? "",
        sublocation: initialData.sublocation ?? "",
        reporterName: initialData.reporterName ?? "",
        reporterPhone: initialData.reporterPhone ?? "",
        anonymous: initialData.anonymous ?? false,
        callSource: initialData.callSource ?? "",
        synopsis: initialData.synopsis ?? "",
      });
    }
  }, [initialData, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      const data = {
        ...form.values,
        reporterName: form.values.anonymous ? "" : form.values.reporterName,
        reporterPhone: form.values.anonymous ? "" : form.values.reporterPhone,
      };
      await onSubmit(data as EditDispatchValues);
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
      isValid={form.isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={form.values.priority}
          onChange={(e) => form.setValue("priority", e.target.value)}
          error={form.touched.priority ? form.errors.priority : undefined}
        />
        <Select
          label="Dispatch Code"
          options={DISPATCH_CODE_OPTIONS}
          value={form.values.dispatchCode}
          onChange={(e) => form.setValue("dispatchCode", e.target.value)}
          placeholder="Select code..."
          error={form.touched.dispatchCode ? form.errors.dispatchCode : undefined}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Location"
          options={LOCATION_OPTIONS}
          value={form.values.location}
          onChange={(e) => form.setValue("location", e.target.value)}
          placeholder="Select location..."
          error={form.touched.location ? form.errors.location : undefined}
        />
        <Input
          label="Sub-location"
          placeholder="Room, floor, area..."
          value={form.values.sublocation}
          onChange={(e) => form.setValue("sublocation", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">
            Reporter Information
          </span>
          <Toggle
            checked={!!form.values.anonymous}
            onChange={(val) => form.setValue("anonymous", val)}
            label="Anonymous"
            size="sm"
          />
        </div>
        {!form.values.anonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reporter Name"
              placeholder="Full name"
              value={form.values.reporterName}
              onChange={(e) => form.setValue("reporterName", e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="(555) 000-0000"
              value={form.values.reporterPhone}
              onChange={(e) => form.setValue("reporterPhone", e.target.value)}
            />
          </div>
        )}
      </div>

      <Select
        label="Call Source"
        options={CALL_SOURCE_OPTIONS}
        value={form.values.callSource}
        onChange={(e) => form.setValue("callSource", e.target.value)}
        placeholder="Select source..."
      />

      <Textarea
        label="Synopsis"
        placeholder="Describe the situation..."
        value={form.values.synopsis}
        onChange={(e) => form.setValue("synopsis", e.target.value)}
        rows={3}
        error={form.touched.synopsis ? form.errors.synopsis : undefined}
      />
    </FormModal>
  );
}
