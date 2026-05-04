"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Loader2, Monitor, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/api/hooks";
import { fetchEvents, type EventRow } from "@/lib/queries/events";
import { createClient } from "@/lib/supabase/client";

interface PairingCodeResponse {
  ok: boolean;
  pairing_code?: string;
  expires_at?: string;
  error?: string;
  event?: {
    id: string;
    name: string;
    status: string;
  };
}

interface WallDisplaySessionRow {
  id: string;
  event_id: string;
  pairing_code: string;
  paired_at: string | null;
  paired_device_label: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

interface SupabaseError {
  message: string;
}

interface WallDisplaySessionQuery {
  select(columns: string): {
    is(column: string, value: null): {
      order(column: string, options: { ascending: boolean }): {
        limit(count: number): Promise<{
          data: WallDisplaySessionRow[] | null;
          error: SupabaseError | null;
        }>;
      };
    };
  };
}

interface WallDisplaySessionClient {
  from(table: "wall_display_sessions"): WallDisplaySessionQuery;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export default function WallDisplaySettingsPage() {
  const { token, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sessions, setSessions] = useState<WallDisplaySessionRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Production display");
  const [pairingCode, setPairingCode] = useState<PairingCodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventRows, sessionRows] = await Promise.all([
        fetchEvents(),
        fetchWallDisplaySessions(),
      ]);
      setEvents(eventRows);
      setSessions(sessionRows);
      setSelectedEventId((current) => current || eventRows[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wall displays.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const createCode = async () => {
    if (!selectedEventId || !token) return;

    try {
      setCreating(true);
      setError(null);
      const response = await fetch(`${supabaseUrl}/functions/v1/wall-display-pairing`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          event_id: selectedEventId,
          device_label: deviceLabel,
        }),
      });
      const payload = (await response.json().catch(() => null)) as PairingCodeResponse | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(pairingError(payload?.error ?? response.statusText));
      }

      setPairingCode(payload);
      await load();
      toast("Pairing code created", { variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create pairing code.";
      setError(message);
      toast(message, { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async () => {
    if (!pairingCode?.pairing_code) return;
    await navigator.clipboard.writeText(pairingCode.pairing_code);
    toast("Pairing code copied", { variant: "success" });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Wall Display</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Pair read-only displays for live capacity, scans, and door flow.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-lg)] border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)]">
                <Monitor className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Add display</h2>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-tertiary)]">
                  Codes expire quickly; paired sessions renew as short-lived event-scoped JWTs.
                </p>
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">Event</span>
              <select
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="h-11 w-full rounded-[var(--input-radius)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--border-focused)] focus:shadow-[var(--focus-ring)]"
              >
                {events.length === 0 ? (
                  <option value="">No events available</option>
                ) : (
                  events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} · {event.status}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">Display label</span>
              <input
                value={deviceLabel}
                onChange={(event) => setDeviceLabel(event.target.value)}
                className="h-11 w-full rounded-[var(--input-radius)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--border-focused)] focus:shadow-[var(--focus-ring)]"
                placeholder="Production trailer iPad"
              />
            </label>

            <Button
              disabled={!selectedEventId || !token || !supabaseUrl}
              isLoading={creating}
              onClick={createCode}
            >
              <Plus className="h-4 w-4" />
              Add display
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Pairing code</h2>
              <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                {selectedEvent?.name ?? "Choose an event"}
              </p>
            </div>

            <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)]">
              {pairingCode?.pairing_code ? (
                <button
                  onClick={copyCode}
                  className="group flex flex-col items-center gap-2 rounded-lg px-4 py-3"
                >
                  <span className="font-mono text-5xl font-semibold tracking-normal text-[var(--text-primary)]">
                    {formatPairingCode(pairingCode.pairing_code)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </span>
                </button>
              ) : (
                <span className="text-[13px] text-[var(--text-tertiary)]">No active code</span>
              )}
            </div>

            {pairingCode?.expires_at ? (
              <p className="text-[12px] text-[var(--text-secondary)]">
                Expires {new Date(pairingCode.expires_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent sessions</h2>
              <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">Active and recently created wall-display sessions.</p>
            </div>
            <Badge tone="default">{sessions.length}</Badge>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border-default)]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[var(--surface-secondary)] text-[12px] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Display</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">State</th>
                  <th className="px-3 py-2 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-[var(--text-tertiary)]">
                      No wall displays yet.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const event = events.find((item) => item.id === session.event_id);
                    return (
                      <tr key={session.id} className="bg-[var(--surface-primary)]">
                        <td className="px-3 py-2 text-[var(--text-primary)]">
                          {session.paired_device_label || "Unpaired display"}
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{event?.name ?? session.event_id}</td>
                        <td className="px-3 py-2">
                          <Badge tone={session.paired_at ? "success" : "default"}>
                            {session.paired_at ? "Paired" : "Pending"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">
                          {new Date(session.expires_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchWallDisplaySessions(): Promise<WallDisplaySessionRow[]> {
  const supabase = createClient() as unknown as WallDisplaySessionClient;
  const { data, error } = await supabase
    .from("wall_display_sessions")
    .select("id, event_id, pairing_code, paired_at, paired_device_label, expires_at, revoked_at, created_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data as WallDisplaySessionRow[] | null) ?? [];
}

function formatPairingCode(value: string) {
  return `${value.slice(0, 3)} ${value.slice(3)}`;
}

function pairingError(error: string) {
  switch (error) {
    case "missing_auth":
    case "invalid_auth":
      return "Sign in again before creating a pairing code.";
    case "event_not_found":
      return "That event is not available.";
    case "forbidden":
      return "Your profile is not a member of this event's organization.";
    case "pairing_code_unavailable":
      return "Could not reserve a pairing code. Try again.";
    default:
      return "Unable to create pairing code.";
  }
}
