"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

interface AddNotificationRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    eventType: string;
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    recipients: string;
  }) => void | Promise<void>;
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
  const [eventType, setEventType] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = eventType !== "" && recipients !== "";

  const resetForm = () => {
    setEventType("");
    setPushEnabled(true);
    setEmailEnabled(false);
    setSmsEnabled(false);
    setRecipients("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        eventType,
        pushEnabled,
        emailEnabled,
        smsEnabled,
        recipients,
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
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
      isValid={isValid}
    >
      <Select
        label="Event Type"
        options={EVENT_TYPE_OPTIONS}
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        placeholder="Select event type"
      />

      <div className="space-y-3">
        <p className="text-[12px] font-medium text-[var(--text-secondary)]">Channels</p>
        <Toggle
          label="Push Notification"
          checked={pushEnabled}
          onChange={setPushEnabled}
        />
        <Toggle
          label="Email"
          checked={emailEnabled}
          onChange={setEmailEnabled}
        />
        <Toggle
          label="SMS"
          checked={smsEnabled}
          onChange={setSmsEnabled}
        />
      </div>

      <Select
        label="Recipients"
        options={RECIPIENT_OPTIONS}
        value={recipients}
        onChange={(e) => setRecipients(e.target.value)}
        placeholder="Select recipients"
      />
    </FormModal>
  );
}
