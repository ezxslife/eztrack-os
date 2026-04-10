"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Mail,
  MessageSquare,
  Hash,
  Webhook,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { ElementType } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ConfigureIntegrationModal } from "@/components/modals/settings";
import { useToast } from "@/components/ui/Toast";
import {
  fetchIntegrations,
  saveIntegrations,
} from "@/lib/queries/settings";
import type { IntegrationRecord } from "@/lib/settings-shared";

const iconMap: Record<string, ElementType> = {
  database: Database,
  mail: Mail,
  message: MessageSquare,
  hash: Hash,
  webhook: Webhook,
};

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [configureIntegration, setConfigureIntegration] = useState<IntegrationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchIntegrations();
      setIntegrations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistIntegrations = async (nextIntegrations: IntegrationRecord[]) => {
    await saveIntegrations(nextIntegrations);
    setIntegrations(nextIntegrations);
  };

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
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
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

      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Integrations</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Connect third-party services to extend EZTrack functionality</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((int) => {
          const Icon = iconMap[int.iconKey] ?? Database;
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
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!int.apiUrl}
                          onClick={() => {
                            if (int.apiUrl) window.open(int.apiUrl, "_blank", "noopener,noreferrer");
                          }}
                        >
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
          if (!configureIntegration) return;
          const nextIntegrations: IntegrationRecord[] = integrations.map((integration): IntegrationRecord =>
            integration.id === configureIntegration.id
              ? {
                  ...integration,
                  apiKey: data.apiKey,
                  apiUrl: data.apiUrl,
                  enabled: data.enabled,
                  status: data.enabled && data.apiKey ? "connected" : "disconnected",
                  detail:
                    data.apiUrl ||
                    (data.apiKey ? "Configuration saved" : integration.detail),
                  updatedAt: new Date().toISOString(),
                }
              : integration,
          );

          try {
            await persistIntegrations(nextIntegrations);
            toast("Integration configured successfully", { variant: "success" });
            setConfigureIntegration(null);
          } catch (err: any) {
            toast(err.message || "Failed to save integration", { variant: "error" });
            throw err;
          }
        }}
        integrationName={configureIntegration?.name}
        initialValues={
          configureIntegration
            ? {
                apiKey: configureIntegration.apiKey,
                apiUrl: configureIntegration.apiUrl,
                enabled: configureIntegration.enabled,
              }
            : undefined
        }
      />
    </div>
  );
}
