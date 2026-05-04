-- 0033_check_ins_capacity_snapshots.sql
-- Canonical scan record + materialized capacity snapshots.
-- check_ins is the spine — every Eventbrite/DICE/Posh/Stripe/POS/manual scan
-- ends up here, regardless of source.

-- ============================================================================
-- Enums
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE check_in_source AS ENUM (
    'eventbrite_webhook',
    'dice_csv',
    'posh_api',
    'stripe_webhook',
    'square_webhook',
    'shopify_webhook',
    'qr_scanner',
    'manual_lookup',
    'pos_auto_checkin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE check_in_result AS ENUM (
    'success',
    'already_scanned',     -- counts toward re-entry per event_day.reentry_policy
    'invalid',
    'expired',
    'wrong_day',
    'wrong_event'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- check_ins
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.check_ins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_day_id    uuid NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
  ticket_id       uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  scanned_at      timestamptz NOT NULL DEFAULT now(),
  scanned_by      uuid,                                       -- personnel.id; NULL for webhook-sourced
  device          text,                                       -- 'iPhone-Manager-1', 'Linea-Pro-A'
  source          check_in_source NOT NULL,
  result          check_in_result NOT NULL DEFAULT 'success',
  entry_number    integer NOT NULL DEFAULT 1,                 -- 1 = first scan today, 2+ = re-entry
  location        text,                                       -- 'Main Gate', 'VIP Entry', 'Door 2'
  raw_payload     jsonb,                                      -- for debugging webhook-sourced scans
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Performance: /live recent-scans feed reads ORDER BY scanned_at DESC
CREATE INDEX IF NOT EXISTS check_ins_event_day_scanned_at_idx
  ON public.check_ins (event_day_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS check_ins_event_id_scanned_at_idx
  ON public.check_ins (event_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS check_ins_ticket_id_idx
  ON public.check_ins (ticket_id);

-- For "have we already scanned this ticket today?"
CREATE INDEX IF NOT EXISTS check_ins_ticket_event_day_idx
  ON public.check_ins (ticket_id, event_day_id, result)
  WHERE ticket_id IS NOT NULL AND result = 'success';

COMMENT ON TABLE public.check_ins IS
  'Canonical scan record. Every check-in across every source ends up here.';

COMMENT ON COLUMN public.check_ins.entry_number IS
  '1 = first scan for this ticket on this event_day. 2+ = re-entry. Bound by event_day.reentry_policy.';

-- ============================================================================
-- capacity_snapshots
-- Materialized per-day capacity, refreshed on every check-in via trigger.
-- /live capacity bar reads the latest snapshot for the current event_day.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.capacity_snapshots (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL,
  event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_day_id        uuid NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
  recorded_at         timestamptz NOT NULL DEFAULT now(),
  sold                integer NOT NULL DEFAULT 0,             -- valid tickets for this day
  checked_in          integer NOT NULL DEFAULT 0,             -- unique tickets scanned today
  reentries           integer NOT NULL DEFAULT 0,             -- re-entry scans today
  on_floor_estimate   integer NOT NULL DEFAULT 0,             -- checked_in - exit_count (if exit-tracking)
  capacity_pct        numeric(5,4) NOT NULL DEFAULT 0,        -- checked_in / event_day.capacity
  threshold_breached  text,                                   -- 'yellow' | 'red' | 'alert' | NULL
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS capacity_snapshots_event_day_recorded_at_idx
  ON public.capacity_snapshots (event_day_id, recorded_at DESC);

COMMENT ON TABLE public.capacity_snapshots IS
  'Per-day capacity snapshots. Latest row per event_day_id is what /live reads.';

-- ============================================================================
-- Trigger: write a capacity_snapshot on every successful check_in
-- and emit a NOTIFY to the realtime channel.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_capacity_snapshot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_capacity        integer;
  v_thresholds      jsonb;
  v_yellow          numeric;
  v_red             numeric;
  v_alert           numeric;
  v_sold            integer;
  v_checked_in      integer;
  v_reentries       integer;
  v_pct             numeric(5,4);
  v_breach          text;
BEGIN
  -- Only react to successful scans + re-entries; ignore invalid/wrong-event.
  IF NEW.result NOT IN ('success', 'already_scanned') THEN
    RETURN NEW;
  END IF;

  -- Pull capacity + thresholds for this event_day
  SELECT ed.capacity, e.live_ops_config->'capacity_thresholds'
    INTO v_capacity, v_thresholds
    FROM public.event_days ed
    JOIN public.events e ON e.id = ed.event_id
   WHERE ed.id = NEW.event_day_id;

  IF v_capacity IS NULL OR v_capacity = 0 THEN
    RETURN NEW;
  END IF;

  v_yellow := COALESCE((v_thresholds->>'yellow')::numeric, 0.75);
  v_red    := COALESCE((v_thresholds->>'red')::numeric,    0.90);
  v_alert  := COALESCE((v_thresholds->>'alert')::numeric,  1.00);

  -- Compute sold (tickets valid for this day)
  SELECT count(*) INTO v_sold
    FROM public.tickets t
   WHERE t.event_id = NEW.event_id
     AND t.state = 'valid'
     AND t.deleted_at IS NULL
     AND (t.valid_for_days IS NULL
          OR t.valid_for_days = '{}'::uuid[]
          OR NEW.event_day_id = ANY(t.valid_for_days));

  -- Compute checked_in (distinct tickets where first-success exists today)
  SELECT count(DISTINCT ticket_id) INTO v_checked_in
    FROM public.check_ins
   WHERE event_day_id = NEW.event_day_id
     AND result = 'success'
     AND ticket_id IS NOT NULL;

  -- Compute reentries (already_scanned counts + entry_number > 1 successes)
  SELECT count(*) INTO v_reentries
    FROM public.check_ins
   WHERE event_day_id = NEW.event_day_id
     AND ((result = 'already_scanned')
          OR (result = 'success' AND entry_number > 1));

  v_pct := LEAST((v_checked_in::numeric / v_capacity::numeric), 1.0000);

  IF v_pct >= v_alert THEN  v_breach := 'alert';
  ELSIF v_pct >= v_red THEN v_breach := 'red';
  ELSIF v_pct >= v_yellow THEN v_breach := 'yellow';
  ELSE v_breach := NULL;
  END IF;

  INSERT INTO public.capacity_snapshots (
    org_id, event_id, event_day_id,
    sold, checked_in, reentries,
    on_floor_estimate, capacity_pct, threshold_breached
  ) VALUES (
    NEW.org_id, NEW.event_id, NEW.event_day_id,
    v_sold, v_checked_in, v_reentries,
    v_checked_in,                                      -- exit-tracking arrives later
    v_pct, v_breach
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_ins_refresh_capacity ON public.check_ins;
CREATE TRIGGER check_ins_refresh_capacity
  AFTER INSERT ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_capacity_snapshot();

COMMENT ON FUNCTION public.refresh_capacity_snapshot IS
  'Writes a capacity_snapshot row on every check_in insert. Threshold breach notifications are dispatched separately by the L1 capacity-threshold worker.';
