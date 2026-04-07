"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, MessageSquare, Plus, Smartphone, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AddNotificationRuleModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  fetchNotificationRules,
  createNotificationRule,
  updateNotificationRule,
  type NotificationRuleRow,
} from "@/lib/queries/settings";

interface NotificationRule {
  id: string;
  event: string;
  description: string;
  push: boolean;
  email: boolean;
  sms: boolean;
}

type Channel = "push" | "email" | "sms";

const channelConfig: { key: Channel; label: string; icon: React.ElementType }[] = [
  { key: "push", label: "Push", icon: Smartphone },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
];

export default function NotificationRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [addRuleOpen, setAddRuleOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      if (!profile?.org_id) throw new Error("Organization not found");
      setOrgId(profile.org_id);
      const data = await fetchNotificationRules(profile.org_id);
      setRules(
        data.map((r) => ({
          id: r.id,
          event: r.event,
          description: r.description ?? "",
          push: r.push,
          email: r.email,
          sms: r.sms,
        })),
      );
    } catch (err: any) {
      setError(err.message || "Failed to load notification rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleChannel = async (ruleId: string, channel: Channel, checked: boolean) => {
    // Optimistic update
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, [channel]: checked } : r))
    );
    try {
      await updateNotificationRule(ruleId, { [channel]: checked });
    } catch (err: any) {
      toast(err.message || "Failed to update rule", { variant: "error" });
      load(); // revert
    }
  };

  const enabledCount = (channel: Channel) =>
    rules.filter((r) => r[channel]).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>Retry</Button>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
          if (!orgId) return;
          try {
            await createNotificationRule({
              event: data.eventType,
              push: data.pushEnabled,
              email: data.emailEnabled,
              sms: data.smsEnabled,
              orgId,
            });
            toast("Notification rule created successfully", { variant: "success" });
            load();
          } catch (err: any) {
            toast(err.message || "Failed to create rule", { variant: "error" });
          }
        }}
      />
    </div>
  );
}
