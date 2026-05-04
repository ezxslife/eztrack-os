-- 0030_events_event_days.sql
-- Core event + per-day model. Supports single-day AND multi-day events.

-- ============================================================================
-- Enums
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM (
    'draft', 'on_sale', 'sold_out', 'live', 'past', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reentry_policy AS ENUM (
    'count_once_per_day',     -- default; first scan today = check-in, subsequent = re-entry
    'count_once_per_event',   -- one check-in per event regardless of day
    'count_every_scan',       -- each scan counts (festivals with no exit-tracking)
    'no_reentry'              -- one entry, no re-entry permitted (red banner on rescans)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  record_number   text,                                       -- 'EVT-00012'
  name            text NOT NULL,
  slug            text NOT NULL,
  is_multi_day    boolean NOT NULL DEFAULT false,
  starts_at       timestamptz NOT NULL,                       -- first day's doors open
  ends_at         timestamptz NOT NULL,                       -- last day's doors close
  capacity        integer,                                    -- TOTAL cap (multi-day passes count once)
  status          event_status NOT NULL DEFAULT 'draft',
  cover_image_url text,
  venue_id        uuid,                                       -- FK added later if venues table exists
  -- Live-ops config (jsonb so we can iterate without migrations)
  live_ops_config jsonb NOT NULL DEFAULT '{
    "capacity_thresholds": { "yellow": 0.75, "red": 0.90, "alert": 1.00 },
    "auto_checkin_at_pos": true,
    "incident_escalation_minutes": 15,
    "geofence": null
  }'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  CONSTRAINT events_slug_unique_per_org UNIQUE (org_id, slug)
);

CREATE INDEX IF NOT EXISTS events_org_id_idx           ON public.events (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_status_idx           ON public.events (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_starts_at_idx        ON public.events (starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_record_number_idx    ON public.events (record_number) WHERE deleted_at IS NULL;

COMMENT ON TABLE  public.events IS
  'Top-level event container. May hold multiple event_days when is_multi_day = true.';
COMMENT ON COLUMN public.events.capacity IS
  'Event-total capacity. Each event_day has its own per-day capacity.';

-- ============================================================================
-- event_days
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_days (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  day_index         integer NOT NULL,                          -- 1, 2, 3...
  label             text NOT NULL,                             -- 'Day 1', 'Friday', 'Night 2'
  date              date NOT NULL,
  starts_at         timestamptz NOT NULL,                      -- doors open
  ends_at           timestamptz NOT NULL,                      -- doors close (may cross midnight)
  capacity          integer NOT NULL,                          -- per-day cap
  door_open_at      timestamptz,
  reentry_policy    reentry_policy NOT NULL DEFAULT 'count_once_per_day',
  ros_id            uuid,                                      -- FK added in 0034 (run_of_show table)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CONSTRAINT event_days_unique_index_per_event UNIQUE (event_id, day_index),
  CONSTRAINT event_days_unique_date_per_event  UNIQUE (event_id, date)
);

CREATE INDEX IF NOT EXISTS event_days_event_id_idx ON public.event_days (event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS event_days_date_idx     ON public.event_days (date)     WHERE deleted_at IS NULL;

COMMENT ON TABLE  public.event_days IS
  'One row per day of an event. For single-day events, exactly one row exists with day_index = 1.';
COMMENT ON COLUMN public.event_days.reentry_policy IS
  'Drives scanner banner behavior on re-scans. Default count_once_per_day.';

-- ============================================================================
-- Trigger: keep events.is_multi_day in sync with the count of event_days
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_event_multi_day_flag()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ev_id uuid;
  day_count integer;
BEGIN
  ev_id := COALESCE(NEW.event_id, OLD.event_id);
  SELECT count(*) INTO day_count
    FROM public.event_days
   WHERE event_id = ev_id AND deleted_at IS NULL;

  UPDATE public.events
     SET is_multi_day = (day_count > 1),
         updated_at = now()
   WHERE id = ev_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS event_days_refresh_multi_day ON public.event_days;
CREATE TRIGGER event_days_refresh_multi_day
  AFTER INSERT OR UPDATE OR DELETE ON public.event_days
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_event_multi_day_flag();

-- ============================================================================
-- Helper: get current event_day for an event based on now()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_event_day(p_event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id
    FROM public.event_days
   WHERE event_id = p_event_id
     AND deleted_at IS NULL
     AND (now() BETWEEN starts_at AND ends_at)
   ORDER BY day_index
   LIMIT 1;
$$;

COMMENT ON FUNCTION public.current_event_day IS
  'Returns the event_day_id for the day currently in progress for an event, or NULL if no day is active.';
