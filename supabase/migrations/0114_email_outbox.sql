-- 0114_email_outbox.sql
-- Generic transactional-email queue. The first writer is /pos receipt sends
-- (createPosSale → enqueue + invoke email-send Edge Function), but anything
-- else that needs a one-off email (run-of-show publish notice, will-call
-- confirmation, incident escalation) can write here too.
--
-- Worker is supabase/functions/email-send/index.ts. It picks up status='pending',
-- attempts send via Resend (RESEND_API_KEY) or SendGrid (SENDGRID_API_KEY); if
-- neither is configured the row goes to status='error' with error='no_provider_configured'.
-- This keeps the L0/L1 envelope honest — no third-party platforms required to
-- ship the wiring; a single env var flips the worker to live delivery.

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  related_type text not null,
  related_id uuid,
  to_email text not null check (position('@' in to_email) > 1),
  to_name text,
  reply_to text,
  subject text not null,
  body_text text not null,
  body_html text,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'error', 'cancelled')),
  provider text,
  provider_message_id text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index idx_email_outbox_pending
  on public.email_outbox(status, created_at)
  where status = 'pending';

create index idx_email_outbox_org_created
  on public.email_outbox(org_id, created_at desc);

create index idx_email_outbox_related
  on public.email_outbox(related_type, related_id)
  where related_id is not null;

alter table public.email_outbox enable row level security;

-- Org-scoped via the same get_user_org_id() helper the rest of eztrack-os uses.
create policy email_outbox_select_org
  on public.email_outbox
  for select
  using (org_id = public.get_user_org_id());

create policy email_outbox_insert_org
  on public.email_outbox
  for insert
  with check (org_id = public.get_user_org_id());

-- Update + delete intentionally restricted to service_role (worker uses
-- supabase service-role client, which bypasses RLS). Org members cannot
-- mutate sent_at/status to keep the queue trustworthy as an audit trail.

comment on table public.email_outbox is
  'Transactional email queue. Worker: supabase/functions/email-send. Writers: createPosSale (POS receipt), future RoS publish + will-call confirmations.';
comment on column public.email_outbox.related_type is
  'Provenance tag, e.g. ''pos_receipt'', ''run_of_show_publish'', ''will_call_confirmation''. Used by the worker for templating fallbacks and retry policy.';
comment on column public.email_outbox.related_id is
  'FK-by-convention into the related domain table (orders for pos_receipt, run_of_show for run_of_show_publish, etc.). Not a hard FK because related_type discriminates the table.';
