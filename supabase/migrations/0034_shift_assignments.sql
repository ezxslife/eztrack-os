-- 0034_shift_assignments.sql
-- Per-event-day staffing. Joins existing eztrack-os personnel to event_days.
-- Plus run_of_show + ros_slots + checklist_items powering /run-of-show.

-- ============================================================================
-- Enums
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM (
    'scheduled', 'en_route', 'on_shift', 'break', 'off_shift', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- run_of_show
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.run_of_show (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL,
  event_id                 uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_day_id             uuid NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
  published_to_staff_at    timestamptz,
  briefing_id              uuid,                              -- FK to existing eztrack-os briefings table
                                                              -- (nullable; soft-linked, no FK constraint to avoid coupling)
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz,
  CONSTRAINT run_of_show_one_per_event_day UNIQUE (event_day_id)
);

CREATE INDEX IF NOT EXISTS run_of_show_event_id_idx ON public.run_of_show (event_id) WHERE deleted_at IS NULL;

-- Now back-fill the FK from event_days.ros_id (forward-declared in 0030)
ALTER TABLE public.event_days
  DROP CONSTRAINT IF EXISTS event_days_ros_id_fkey;

ALTER TABLE public.event_days
  ADD CONSTRAINT event_days_ros_id_fkey
  FOREIGN KEY (ros_id) REFERENCES public.run_of_show(id) ON DELETE SET NULL;

-- ============================================================================
-- ros_slots
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ros_slots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ros_id          uuid NOT NULL REFERENCES public.run_of_show(id) ON DELETE CASCADE,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  label           text NOT NULL,                             -- 'Doors open', 'Sound check', 'Headliner'
  description     text,
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ros_slots_ros_id_starts_at_idx
  ON public.ros_slots (ros_id, starts_at);

-- ============================================================================
-- checklist_items (pre-event checklist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ros_id          uuid NOT NULL REFERENCES public.run_of_show(id) ON DELETE CASCADE,
  label           text NOT NULL,
  display_order   integer NOT NULL DEFAULT 0,
  completed_at    timestamptz,
  completed_by    uuid,                                      -- personnel.id
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checklist_items_ros_id_idx ON public.checklist_items (ros_id);

-- ============================================================================
-- shift_assignments
-- Joins existing eztrack-os personnel to event_days × time-window × role.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL,
  event_day_id        uuid NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
  ros_slot_id         uuid REFERENCES public.ros_slots(id) ON DELETE SET NULL,
  personnel_id        uuid NOT NULL,                         -- FK to eztrack-os personnel; soft-linked
  role                text NOT NULL,                         -- 'door', 'bar', 'security', 'medical', 'tech', 'manager', 'will_call', 'merch'
  starts_at           timestamptz NOT NULL,
  ends_at             timestamptz NOT NULL,
  status              shift_status NOT NULL DEFAULT 'scheduled',
  last_seen_at        timestamptz,
  geo_verified        boolean NOT NULL DEFAULT false,
  geo_lat             numeric(9,6),
  geo_lng             numeric(9,6),
  hourly_rate_cents   bigint,                                -- back-flows to ezxs-settle as Expense
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

CREATE INDEX IF NOT EXISTS shift_assignments_event_day_idx
  ON public.shift_assignments (event_day_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS shift_assignments_personnel_idx
  ON public.shift_assignments (personnel_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS shift_assignments_status_idx
  ON public.shift_assignments (status) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.shift_assignments IS
  'Per-event-day staffing. personnel_id soft-links to eztrack-os personnel table (no FK constraint, to avoid coupling between Security Mode and Events Mode entities).';
