// supabase/functions/capacity-threshold-worker/index.ts
// Raises existing Alerts-hub rows when a latest capacity snapshot crosses
// yellow/red/alert. Intended for Supabase Cron or an operator-triggered run.

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';

type Threshold = 'yellow' | 'red' | 'alert';
type Severity = 'medium' | 'high' | 'critical';

interface CapacitySnapshot {
  id: string;
  org_id: string;
  event_id: string;
  event_day_id: string;
  recorded_at: string;
  checked_in: number;
  capacity_pct: number | string;
  threshold_breached: Threshold;
}

interface EventRow {
  id: string;
  name: string;
}

interface EventDayRow {
  id: string;
  day_index: number;
  label: string;
  capacity: number;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const configuredSecret = Deno.env.get('CAPACITY_WORKER_SECRET');
  if (configuredSecret) {
    const provided =
      req.headers.get('x-capacity-worker-secret') ??
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (provided !== configuredSecret) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }
  }

  const supabase = getServiceRoleClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const { data, error } = await supabase
    .from('capacity_snapshots')
    .select('id, org_id, event_id, event_day_id, recorded_at, checked_in, capacity_pct, threshold_breached')
    .gte('recorded_at', since)
    .not('threshold_breached', 'is', null)
    .order('recorded_at', { ascending: false })
    .limit(250);

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  const latestByDay = new Map<string, CapacitySnapshot>();
  for (const row of (data ?? []) as CapacitySnapshot[]) {
    if (!latestByDay.has(row.event_day_id)) latestByDay.set(row.event_day_id, row);
  }

  let created = 0;
  const skipped: string[] = [];

  for (const snapshot of latestByDay.values()) {
    const [event, day] = await Promise.all([
      fetchEvent(supabase, snapshot.event_id),
      fetchEventDay(supabase, snapshot.event_day_id),
    ]);

    if (!event || !day) {
      skipped.push(snapshot.id);
      continue;
    }

    const severity = severityFor(snapshot.threshold_breached);
    const pct = Math.round(Number(snapshot.capacity_pct) * 100);
    const title = `${event.name}: ${day.label} capacity ${snapshot.threshold_breached.toUpperCase()}`;
    const message =
      `${snapshot.checked_in.toLocaleString()} / ${day.capacity.toLocaleString()} checked in ` +
      `(${pct}%). Day ${day.day_index}. Snapshot ${snapshot.id}.`;

    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('org_id', snapshot.org_id)
      .eq('alert_type', 'capacity_threshold')
      .eq('severity', severity)
      .eq('title', title)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      skipped.push(snapshot.id);
      continue;
    }

    const { error: insertErr } = await supabase
      .from('alerts')
      .insert({
        org_id: snapshot.org_id,
        alert_type: 'capacity_threshold',
        title,
        message,
        severity,
      });

    if (insertErr) {
      skipped.push(snapshot.id);
      console.error('[capacity-threshold-worker] alert insert failed', insertErr);
      continue;
    }

    created += 1;
  }

  return json({
    ok: true,
    inspected: latestByDay.size,
    created,
    skipped: skipped.length,
  });
});

async function fetchEvent(
  supabase: ReturnType<typeof getServiceRoleClient>,
  eventId: string,
): Promise<EventRow | null> {
  const { data } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', eventId)
    .maybeSingle();
  return (data as EventRow | null) ?? null;
}

async function fetchEventDay(
  supabase: ReturnType<typeof getServiceRoleClient>,
  eventDayId: string,
): Promise<EventDayRow | null> {
  const { data } = await supabase
    .from('event_days')
    .select('id, day_index, label, capacity')
    .eq('id', eventDayId)
    .maybeSingle();
  return (data as EventDayRow | null) ?? null;
}

function severityFor(threshold: Threshold): Severity {
  switch (threshold) {
    case 'alert':
      return 'critical';
    case 'red':
      return 'high';
    case 'yellow':
    default:
      return 'medium';
  }
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
