"use client";

import Link from "next/link";
import { ArrowLeft, Database, Mail, MessageSquare, Hash, Webhook, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ConfigureIntegrationModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "connected" | "disconnected";
  detail?: string;
}

const integrations: Integration[] = [
  {
    id: "supabase",
    name: "Supabase",
    description: "PostgreSQL database, auth, and real-time subscriptions",
    icon: Database,
    status: "connected",
    detail: "Project: eztrack-prod | Region: us-west-1",
  },
  {
    id: "email",
    name: "Email (SMTP)",
    description: "Outbound email notifications via SMTP relay",
    icon: Mail,
    status: "connected",
    detail: "smtp.sendgrid.net:587 | Verified sender",
  },
  {
    id: "sms",
    name: "SMS (Twilio)",
    description: "SMS notifications and two-factor authentication",
    icon: MessageSquare,
    status: "connected",
    detail: "Account SID: AC...7f3d | Phone: +1 (702) 555-0199",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Post incident alerts and dispatch updates to Slack channels",
    icon: Hash,
    status: "disconnected",
  },
  {
    id: "webhook",
    name: "Webhooks",
    description: "Send event payloads to external URLs for custom integrations",
    icon: Webhook,
    status: "disconnected",
  },
];

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [configureIntegration, setConfigureIntegration] = useState<Integration | null>(null);

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

      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Integrations</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Connect third-party services to extend EZTrack functionality</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((int) => {
          const Icon = int.icon;
          const isConnected = int.status === "connected";

          return (
            <Card key={int.id}>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
                    </div>
                    <Badge tone={isConnected ? "success" : "default"} dot>
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{int.name}</h3>
                    <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{int.description}</p>
                  </div>

                  {int.detail && (
                    <div className="text-[11px] text-[var(--text-tertiary)] bg-[var(--surface-secondary)] rounded-md px-2.5 py-1.5 font-mono">
                      {int.detail}
                    </div>
                  )}

                  <div className="pt-1">
                    {isConnected ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfigureIntegration(int)}>
                          Configure
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="default" size="sm" className="w-full" onClick={() => setConfigureIntegration(int)}>
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfigureIntegrationModal
        open={configureIntegration !== null}
        onClose={() => setConfigureIntegration(null)}
        onSubmit={async (data) => {
          toast("Integration configured successfully", { variant: "success" });
          setConfigureIntegration(null);
        }}
        integrationName={configureIntegration?.name}
      />
    </div>
  );
}
