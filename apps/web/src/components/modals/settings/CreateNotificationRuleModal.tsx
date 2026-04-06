"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";

interface CreateNotificationRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    eventType: string;
    channelEmail: boolean;
    channelPush: boolean;
    channelSms: boolean;
    recipients: string;
    priority: string;
    isActive: boolean;
  }) => void | Promise<void>;
}

const eventTypeOptions = [
  { value: "incident_created", label: "Incident Created" },
  { value: "incident_updated", label: "Incident Updated" },
  { value: "dispatch_created", label: "Dispatch Created" },
  { value: "case_escalated", label: "Case Escalated" },
  { value: "work_order_overdue", label: "Work Order Overdue" },
  { value: "patron_banned", label: "Patron Banned" },
  { value: "evidence_transferred", label: "Evidence Transferred" },
  { value: "shift_started", label: "Shift Started" },
  { value: "visitor_overstay", label: "Visitor Overstay" },
  { value: "emergency_alert", label: "Emergency Alert" },
];

const recipientOptions = [
  { value: "all_users", label: "All Users" },
  { value: "admins_only", label: "Admins Only" },
  { value: "assigned_users", label: "Assigned Users" },
  { value: "supervisors", label: "Supervisors" },
  { value: "custom", label: "Custom" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function CreateNotificationRuleModal({
  open,
  onClose,
  onSubmit,
}: CreateNotificationRuleModalProps) {
  const [eventType, setEventType] = useState("incident_created");
  const [channelEmail, setChannelEmail] = useState(false);
  const [channelPush, setChannelPush] = useState(false);
  const [channelSms, setChannelSms] = useState(false);
  const [recipients, setRecipients] = useState("all_users");
  const [priority, setPriority] = useState("normal");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = channelEmail || channelPush || channelSms;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        eventType,
        channelEmail,
        channelPush,
        channelSms,
        recipients,
        priority,
        isActive,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setEventType("incident_created");
    setChannelEmail(false);
    setChannelPush(false);
    setChannelSms(false);
    setRecipients("all_users");
    setPriority("normal");
    setIsActive(true);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Create Notification Rule"
      subtitle="Create a notification rule"
      size="md"
      submitLabel="Create Rule"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Select
        label="Event Type"
        options={eventTypeOptions}
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
      />

      <div className="w-full">
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
          Notification Channels
        </label>
        <div className="space-y-2.5">
          <Toggle
            label="Email"
            checked={channelEmail}
            onChange={setChannelEmail}
          />
          <Toggle
            label="Push notification"
            checked={channelPush}
            onChange={setChannelPush}
          />
          <Toggle
            label="SMS"
            checked={channelSms}
            onChange={setChannelSms}
          />
        </div>
      </div>

      <Select
        label="Recipients"
        options={recipientOptions}
        value={recipients}
        onChange={(e) => setRecipients(e.target.value)}
      />

      <Select
        label="Priority"
        options={priorityOptions}
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      />

      <Toggle
        label="Active"
        checked={isActive}
        onChange={setIsActive}
      />
    </FormModal>
  );
}
