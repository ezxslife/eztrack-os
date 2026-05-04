// supabase/functions/run-of-show-publisher/index.ts
// Auto-publish run_of_show at T-2hr before doors open. Intended for Supabase
// Cron (every 5 minutes) or operator-triggered runs.
//
// Effect on each unpublished run_of_show whose event_day.starts_at falls
// within the next 2 hours:
//   1. Stamps run_of_show.published_to_staff_at = now()
//   2. Inserts a row into the existing alerts hub (alert_type='ros_publish')
//      so Twilio/Slack/Discord fan-out rides the eztrack-os Alerts pipeline.
//
// Idempotent — already-published rows are skipped. The alert insert is
// dedup'd on (org_id, alert_type, title).

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';

const PUBLISH_LEAD_MS = 2 * 60 * 60_000; // T-2hr

interface RunOfShowDue {
  id: string;
  org_id: string;
  event_id: string;
  event_day_id: string;
  events: { id: string; name: string } | null;
  event_days: { id: string; label: string; starts_at: string; day_index: number } | null;
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
  const now = new Date();
  const upperBound = new Date(now.getTime() + PUBLISH_LEAD_MS).toISOString();

  // Find unpublished run_of_show rows whose event_day starts within the
  // publish window AND hasn't already passed.
  const { data, error } = await supabase
    .from('run_of_show')
    .select(`
      id, org_id, event_id, event_day_id,
      events ( id, name ),
      event_days!inner ( id, label, starts_at, day_index )
    `)
    .is('published_to_staff_at', null)
    .is('deleted_at', null)
    .gte('event_days.starts_at', now.toISOString())
    .lte('event_days.starts_at', upperBound)
    .limit(50);

  if (error) {
    console.error('[run-of-show-publisher] query failed', error);
    return json({ ok: false, error: error.message }, 500);
  }

  let published = 0;
  const skipped: string[] = [];

  for (const row of (data ?? []) as RunOfShowDue[]) {
    const event = row.events;
    const day = row.event_days;
    if (!event || !day) {
      skipped.push(row.id);
      continue;
    }

    const minutesAway = Math.round((new Date(day.starts_at).getTime() - now.getTime()) / 60_000);
    const title = `${event.name}: ${day.label} run-of-show published`;
    const message = `Doors open in ${minutesAway} min. Day ${day.day_index} timeline + checklist now visible to on-shift staff.`;

    // Idempotency: skip if an identical alert already exists today.
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('org_id', row.org_id)
      .eq('alert_type', 'ros_publish')
      .eq('title', title)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      skipped.push(row.id);
      continue;
    }

    const { error: stampErr } = await supabase
      .from('run_of_show')
      .update({ published_to_staff_at: now.toISOString() })
      .eq('id', row.id);

    if (stampErr) {
      console.error('[run-of-show-publisher] stamp failed', stampErr);
      skipped.push(row.id);
      continue;
    }

    const { error: alertErr } = await supabase.from('alerts').insert({
      org_id: row.org_id,
      alert_type: 'ros_publish',
      title,
      message,
      severity: 'medium',
    });

    if (alertErr) {
      console.error('[run-of-show-publisher] alert insert failed', alertErr);
      // Stamp was already set; not rolling back since the alert is the side
      // channel and the operator-visible state is the timestamp.
    }

    published += 1;
  }

  return json({
    ok: true,
    inspected: (data ?? []).length,
    published,
    skipped: skipped.length,
  });
});

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
