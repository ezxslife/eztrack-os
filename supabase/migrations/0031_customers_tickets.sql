-- 0031_customers_tickets.sql
-- Customers (fans / ticketholders) + Tickets ingested from external providers.

-- ============================================================================
-- Enums
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE ticket_source AS ENUM (
    'eventbrite', 'dice', 'posh', 'stripe_checkout', 'shopify',
    'square', 'pos', 'manual', 'comp'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_state AS ENUM (
    'valid', 'used', 'refunded', 'transferred', 'voided'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- customers
-- Fan / ticketholder identity. Distinct from auth.users (operators / staff).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  email           text,
  phone           text,
  first_name      text,
  last_name       text,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  lifetime_spend_cents bigint NOT NULL DEFAULT 0,
  purchase_count  integer NOT NULL DEFAULT 0,
  tags            text[] NOT NULL DEFAULT '{}'::text[],
  acquisition_source text,
  external_ids    jsonb NOT NULL DEFAULT '{}'::jsonb,
                  -- e.g. { "eventbrite": "123", "stripe": "cus_456", "klaviyo": "AbC" }
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- Either email or phone must be present
ALTER TABLE public.customers
  ADD CONSTRAINT customers_email_or_phone
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Per-org uniqueness, where present
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique_per_org
  ON public.customers (org_id, lower(email))
  WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique_per_org
  ON public.customers (org_id, phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS customers_org_id_idx ON public.customers (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS customers_tags_gin   ON public.customers USING gin (tags);

COMMENT ON TABLE public.customers IS
  'Fan / ticketholder identities. Linked to events via tickets and check_ins.';

-- ============================================================================
-- tickets
-- Canonical representation of any ticket purchased on any platform.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tickets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL,
  event_id         uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  customer_id      uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  external_id      text,                                       -- Eventbrite/DICE/Posh attendee/order id
  source           ticket_source NOT NULL,
  tier             text NOT NULL,                              -- 'GA', 'VIP', 'Day-1 GA', 'Weekend Pass'
  valid_for_days   uuid[],                                     -- array of event_day ids; NULL or empty = 'all' (multi-day pass)
  state            ticket_state NOT NULL DEFAULT 'valid',
  price_cents      bigint NOT NULL DEFAULT 0,
  fees_cents       bigint NOT NULL DEFAULT 0,
  pickup_required  boolean NOT NULL DEFAULT false,             -- → routes to will-call (visitors)
  wristbanded_at_event_day_id uuid REFERENCES public.event_days(id) ON DELETE SET NULL,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  CONSTRAINT tickets_external_id_unique_per_event
    UNIQUE (event_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS tickets_event_id_idx     ON public.tickets (event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS tickets_customer_id_idx  ON public.tickets (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS tickets_state_idx        ON public.tickets (state) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS tickets_external_id_idx  ON public.tickets (source, external_id);

COMMENT ON COLUMN public.tickets.valid_for_days IS
  'Array of event_day ids this ticket is valid for. NULL or empty array means valid for ALL days (multi-day pass).';

COMMENT ON COLUMN public.tickets.wristbanded_at_event_day_id IS
  'For multi-day passes — the day the holder collected their wristband. Set on first scan.';
