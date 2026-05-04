-- 0032_orders.sql
-- Orders unify POS sales (track) with ingested platform orders (Eventbrite/Stripe/Square/Shopify).
-- POS orders also back-flow to ezxs-settle as Income rows via shared schema.

-- ============================================================================
-- Enums
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE order_source AS ENUM (
    'eventbrite', 'dice', 'posh', 'stripe_checkout', 'shopify',
    'square', 'pos_stripe_terminal', 'pos_square_terminal', 'pos_cash',
    'manual', 'comp'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'paid', 'refunded', 'partial_refund', 'disputed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  record_number   text,                                       -- 'ORD-08372'
  event_id        uuid REFERENCES public.events(id) ON DELETE SET NULL,
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  source          order_source NOT NULL,
  external_id     text,                                       -- provider's order id
  status          order_status NOT NULL DEFAULT 'pending',
  total_cents     bigint NOT NULL DEFAULT 0,
  fees_cents      bigint NOT NULL DEFAULT 0,
  tax_cents       bigint NOT NULL DEFAULT 0,
  net_cents       bigint NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',
  -- POS-specific
  staff_user_id   uuid,                                       -- staff who rang up the sale (auth.users)
  device          text,                                       -- 'iPad-1', 'Stripe-Terminal-A'
  -- Cross-product attribution (read by ezxs-promote attribution waterfall)
  attribution     jsonb NOT NULL DEFAULT '{}'::jsonb,
                  -- e.g. { "send_id": "...", "campaign_id": "...", "utm": {...}, "click_id": "..." }
  placed_at       timestamptz NOT NULL DEFAULT now(),
  refunded_at     timestamptz,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  CONSTRAINT orders_external_id_unique_per_source
    UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS orders_org_id_idx       ON public.orders (org_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_event_id_idx     ON public.orders (event_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_customer_id_idx  ON public.orders (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_placed_at_idx    ON public.orders (placed_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_status_idx       ON public.orders (status)      WHERE deleted_at IS NULL;

COMMENT ON TABLE public.orders IS
  'Unified order ledger. POS sales + platform-ingested orders. Source-of-truth for ezxs-settle Income.';

-- ============================================================================
-- order_line_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_line_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_id       uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  description     text NOT NULL,
  tier            text,
  quantity        integer NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL DEFAULT 0,
  total_cents     bigint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_line_items_order_id_idx ON public.order_line_items (order_id);
CREATE INDEX IF NOT EXISTS order_line_items_ticket_id_idx ON public.order_line_items (ticket_id);
