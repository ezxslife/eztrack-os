-- 0038_scan_webhooks.sql
-- Raw inbound webhook log. Every Eventbrite/Stripe/Square webhook lands here
-- before being processed by checkin-router. Lets us debug, replay, and audit.
--
-- Volume considerations: typical event = 500-5000 scans = same volume here.
-- Partition by month and prune > 90 days for cost control.

CREATE TABLE IF NOT EXISTS public.scan_webhooks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid,                                    -- nullable; resolved during processing
  provider           text NOT NULL,                           -- 'eventbrite' | 'stripe' | 'square' | 'shopify'
  event_type         text NOT NULL,                           -- 'attendee.checked_in', 'charge.succeeded', etc.
  external_event_id  text,                                    -- provider's webhook delivery id (idempotency key)
  signature_valid    boolean NOT NULL DEFAULT false,
  raw_payload        jsonb NOT NULL,
  raw_headers        jsonb,
  processed_at       timestamptz,
  processed_check_in_id uuid REFERENCES public.check_ins(id) ON DELETE SET NULL,
  processed_order_id    uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  processing_error   text,
  received_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scan_webhooks_received_at_idx
  ON public.scan_webhooks (received_at DESC);

CREATE INDEX IF NOT EXISTS scan_webhooks_unprocessed_idx
  ON public.scan_webhooks (received_at)
  WHERE processed_at IS NULL AND signature_valid = true;

CREATE UNIQUE INDEX IF NOT EXISTS scan_webhooks_external_event_id_unique
  ON public.scan_webhooks (provider, external_event_id)
  WHERE external_event_id IS NOT NULL;

COMMENT ON TABLE public.scan_webhooks IS
  'Raw inbound webhook log. Idempotency key = (provider, external_event_id). Replayable.';
