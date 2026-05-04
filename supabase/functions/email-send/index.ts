// supabase/functions/email-send/index.ts
// Worker for the public.email_outbox queue. Two trigger modes:
//   1. Cron: invoked periodically (every 1-5 min) to drain pending rows.
//   2. Direct invoke: callers (e.g. createPosSale) call this immediately
//      after enqueuing to keep p50 latency low.
//
// Provider selection (first one with a configured key wins):
//   - RESEND_API_KEY            → https://resend.com (preferred — simple, fast)
//   - SENDGRID_API_KEY          → https://sendgrid.com
//
// If neither is configured the worker still drains the queue but marks
// rows status='error', error='no_provider_configured'. This keeps the L0/L1
// build honest: the wiring is in place; flipping a single env var goes live.
//
// Optional config:
//   - EMAIL_FROM                'Receipts <receipts@example.com>'
//   - EMAIL_REPLY_TO            'support@example.com'
//   - EMAIL_BATCH_SIZE          default 25
//   - EMAIL_MAX_ATTEMPTS        default 3
//   - CAPACITY_WORKER_SECRET    if set, requires x-capacity-worker-secret header
//                               (reuses the existing cron-secret pattern)

import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getServiceRoleClient } from '../_shared/supabase.ts';

interface OutboxRow {
  id: string;
  org_id: string;
  related_type: string;
  related_id: string | null;
  to_email: string;
  to_name: string | null;
  reply_to: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  attempt_count: number;
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

  // Optional body { id?: string } — when provided we drain just that row.
  // Otherwise we drain the next N pending rows up to EMAIL_BATCH_SIZE.
  let onlyId: string | null = null;
  try {
    const body = (await req.json()) as { id?: string } | null;
    onlyId = body?.id ?? null;
  } catch {
    // empty body OK
  }

  const supabase = getServiceRoleClient();
  const batchSize = Number(Deno.env.get('EMAIL_BATCH_SIZE') ?? '25');
  const maxAttempts = Number(Deno.env.get('EMAIL_MAX_ATTEMPTS') ?? '3');

  const baseQuery = supabase
    .from('email_outbox')
    .select(
      'id, org_id, related_type, related_id, to_email, to_name, reply_to, subject, body_text, body_html, attempt_count',
    )
    .eq('status', 'pending')
    .lt('attempt_count', maxAttempts)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  const query = onlyId ? baseQuery.eq('id', onlyId) : baseQuery;

  const { data, error } = await query;
  if (error) {
    console.error('[email-send] query failed', error);
    return json({ ok: false, error: error.message }, 500);
  }

  const rows = (data ?? []) as OutboxRow[];

  let sent = 0;
  let failed = 0;
  const errors: { id: string; error: string }[] = [];

  for (const row of rows) {
    // Mark sending so we don't double-process if cron + direct invoke race.
    const { data: claimed } = await supabase
      .from('email_outbox')
      .update({
        status: 'sending',
        attempt_count: row.attempt_count + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (!claimed) {
      // Lost the race; skip silently.
      continue;
    }

    const result = await sendOne(row);

    if (result.ok) {
      await supabase
        .from('email_outbox')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider: result.provider,
          provider_message_id: result.providerId ?? null,
          error: null,
        })
        .eq('id', row.id);
      sent += 1;
    } else {
      const willRetry = row.attempt_count + 1 < maxAttempts && result.retriable;
      await supabase
        .from('email_outbox')
        .update({
          status: willRetry ? 'pending' : 'error',
          error: result.error,
          provider: result.provider,
        })
        .eq('id', row.id);
      failed += 1;
      errors.push({ id: row.id, error: result.error });
    }
  }

  return json({
    ok: true,
    inspected: rows.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
});

interface SendResult {
  ok: boolean;
  provider: string;
  providerId?: string | null;
  error: string;
  retriable: boolean;
}

async function sendOne(row: OutboxRow): Promise<SendResult> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? 'no-reply@track.ezxs.events';
  const replyTo = row.reply_to ?? Deno.env.get('EMAIL_REPLY_TO') ?? null;

  if (!resendKey && !sendgridKey) {
    return {
      ok: false,
      provider: 'none',
      error: 'no_provider_configured',
      retriable: false,
    };
  }

  const toAddress = row.to_name ? `${row.to_name} <${row.to_email}>` : row.to_email;
  const html = row.body_html ?? `<pre style="font-family:system-ui">${escapeHtml(row.body_text)}</pre>`;

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${resendKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [toAddress],
          subject: row.subject,
          text: row.body_text,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return {
          ok: false,
          provider: 'resend',
          error: `resend_${res.status}: ${text.slice(0, 200)}`,
          retriable: res.status >= 500 || res.status === 429,
        };
      }
      const json = (await res.json()) as { id?: string };
      return { ok: true, provider: 'resend', providerId: json.id ?? null, error: '', retriable: false };
    } catch (e) {
      return {
        ok: false,
        provider: 'resend',
        error: `resend_throw: ${(e as Error).message}`.slice(0, 240),
        retriable: true,
      };
    }
  }

  // SendGrid fallback.
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${sendgridKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: row.to_email, name: row.to_name ?? undefined }],
            subject: row.subject,
          },
        ],
        from: parseFrom(from),
        ...(replyTo ? { reply_to: { email: replyTo } } : {}),
        content: [
          { type: 'text/plain', value: row.body_text },
          { type: 'text/html', value: html },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        provider: 'sendgrid',
        error: `sendgrid_${res.status}: ${text.slice(0, 200)}`,
        retriable: res.status >= 500 || res.status === 429,
      };
    }
    const messageId = res.headers.get('x-message-id');
    return {
      ok: true,
      provider: 'sendgrid',
      providerId: messageId,
      error: '',
      retriable: false,
    };
  } catch (e) {
    return {
      ok: false,
      provider: 'sendgrid',
      error: `sendgrid_throw: ${(e as Error).message}`.slice(0, 240),
      retriable: true,
    };
  }
}

function parseFrom(from: string): { email: string; name?: string } {
  const match = from.match(/^(.*?)<(.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  }
  return { email: from.trim() };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
