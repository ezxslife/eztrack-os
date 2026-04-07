"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { useFormState } from "@/hooks/useFormState";
import { addNotificationRuleSchema, type AddNotificationRuleValues } from "@/lib/validations/settings";

interface AddNotificationRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddNotificationRuleValues) => void | Promise<void>;
}

const EVENT_TYPE_OPTIONS = [
  { value: "incident_created", label: "Incident Created" },
  { value: "dispatch_alert", label: "Dispatch Alert" },
  { value: "status_change", label: "Status Change" },
  { value: "work_order_assigned", label: "Work Order Assigned" },
  { value: "visitor_signed_in", label: "Visitor Signed In" },
  { value: "patron_flagged", label: "Patron Flagged" },
  { value: "briefing_published", label: "Briefing Published" },
];

const RECIPIENT_OPTIONS = [
  { value: "all_staff", label: "All Staff" },
  { value: "managers", label: "Managers Only" },
  { value: "supervisors", label: "Supervisors" },
  { value: "assigned_personnel", label: "Assigned Personnel" },
];

export function AddNotificationRuleModal({
  open,
  onClose,
  onSubmit,
}: AddNotificationRuleModalProps) {
  const form = useFormState({
    initialValues: {
      eventType: "",
      pushEnabled: true as boolean,
      emailEnabled: false as boolean,
      smsEnabled: false as boolean,
      recipients: "",
    },
    schema: addNotificationRuleSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form.values as AddNotificationRuleValues);
      form.reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Add Notification Rule"
      size="md"
      submitLabel="Add Rule"
      isSubmitting={isSubmitting}
      isValid={form.isValid}
    >
      <Select
        label="Event Type"
        options={EVENT_TYPE_OPTIONS}
        value={form.values.eventType}
        onChange={(e) => form.setValue("eventType", e.target.value)}
        placeholder="Select event type"
        error={form.touched.eventType ? form.errors.eventType : undefined}
      />

      <div className="space-y-3">
        <p className="text-[12px] font-medium text-[var(--text-secondary)]">Channels</p>
        <Toggle
          label="Push Notification"
          checked={!!form.values.pushEnabled}
          onChange={(val) => form.setValue("pushEnabled", val)}
        />
        <Toggle
          label="Email"
          checked={!!form.values.emailEnabled}
          onChange={(val) => form.setValue("emailEnabled", val)}
        />
        <Toggle
          label="SMS"
          checked={!!form.values.smsEnabled}
          onChange={(val) => form.setValue("smsEnabled", val)}
        />
      </div>

      <Select
        label="Recipients"
        options={RECIPIENT_OPTIONS}
        value={form.values.recipients}
        onChange={(e) => form.setValue("recipients", e.target.value)}
        placeholder="Select recipients"
        error={form.touched.recipients ? form.errors.recipients : undefined}
      />
    </FormModal>
  );
}
