"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, MessageSquare, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AddNotificationRuleModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";

interface NotificationRule {
  id: string;
  event: string;
  description: string;
  push: boolean;
  email: boolean;
  sms: boolean;
}

const initialRules: NotificationRule[] = [
  { id: "1", event: "Incident Created", description: "When a new incident report is filed", push: true, email: true, sms: false },
  { id: "2", event: "Incident Escalated", description: "When an incident is escalated to a higher priority", push: true, email: true, sms: true },
  { id: "3", event: "Dispatch Alert", description: "When a new dispatch is assigned to you", push: true, email: false, sms: true },
  { id: "4", event: "Dispatch Updated", description: "When dispatch status changes", push: true, email: false, sms: false },
  { id: "5", event: "Case Assigned", description: "When you are assigned to a case", push: true, email: true, sms: false },
  { id: "6", event: "Case Status Changed", description: "When a case status is updated", push: true, email: true, sms: false },
  { id: "7", event: "BOLO Issued", description: "When a new BOLO is broadcast", push: true, email: true, sms: true },
  { id: "8", event: "Daily Log Entry", description: "When a daily log entry requires attention", push: false, email: true, sms: false },
  { id: "9", event: "Use of Force Filed", description: "When a use of force report is submitted", push: true, email: true, sms: true },
  { id: "10", event: "Report Due", description: "When a report deadline is approaching", push: true, email: true, sms: false },
  { id: "11", event: "Shift Change", description: "Notification before shift start/end", push: true, email: false, sms: false },
  { id: "12", event: "System Alert", description: "System maintenance and downtime notices", push: false, email: true, sms: false },
];

type Channel = "push" | "email" | "sms";

const channelConfig: { key: Channel; label: string; icon: React.ElementType }[] = [
  { key: "push", label: "Push", icon: Smartphone },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
];

export default function NotificationRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState(initialRules);
  const [addRuleOpen, setAddRuleOpen] = useState(false);

  const toggleChannel = (ruleId: string, channel: Channel, checked: boolean) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, [channel]: checked } : r))
    );
  };

  const enabledCount = (channel: Channel) =>
    rules.filter((r) => r[channel]).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Notification Rules</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Configure which events trigger notifications and through which channels</p>
        </div>
        <Button onClick={() => setAddRuleOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </Button>
      </div>

      {/* Channel summary */}
      <div className="grid grid-cols-3 gap-3">
        {channelConfig.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="!py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[var(--text-primary)]">{label}</div>
                  <div className="text-[12px] text-[var(--text-tertiary)]">{enabledCount(key)} of {rules.length} rules active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rules table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
            <CardTitle>Event Rules</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="!px-0 !pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left font-medium text-[var(--text-secondary)] px-5 py-2.5">Event</th>
                  {channelConfig.map(({ key, label, icon: Icon }) => (
                    <th key={key} className="text-center font-medium text-[var(--text-secondary)] px-5 py-2.5 w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{rule.event}</div>
                      <div className="text-[12px] text-[var(--text-tertiary)]">{rule.description}</div>
                    </td>
                    {channelConfig.map(({ key }) => (
                      <td key={key} className="px-5 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={rule[key]}
                            onChange={(checked) => toggleChannel(rule.id, key, checked)}
                            size="sm"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddNotificationRuleModal
        open={addRuleOpen}
        onClose={() => setAddRuleOpen(false)}
        onSubmit={async (data) => {
          toast("Notification rule created successfully", { variant: "success" });
        }}
      />
    </div>
  );
}
