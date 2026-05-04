-- 0103_existing_tables_event_fks.sql
-- Add nullable event_id + event_day_id FKs to the eztrack-os tables that get
-- reused in Events Mode (per plan.md section 7 scope discipline). Nullable
-- because Security Mode rows continue to exist without an event scope.
--
-- Tables:
--   • incidents          — gets event_id + event_day_id (filter by day on /live)
--   • lost_reports       — gets event_id (Lost & Found per event)
--   • found_items        — gets event_id (Lost & Found per event)
--   • work_orders        — gets event_id (mic pack 3 dead during show ⇒ WO)
--   • anonymous_reports  — gets event_id (per-event QR routing)

ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS event_id     uuid REFERENCES public.events(id)     ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_day_id uuid REFERENCES public.event_days(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS incidents_event_id_idx
  ON public.incidents (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS incidents_event_day_id_idx
  ON public.incidents (event_day_id) WHERE event_day_id IS NOT NULL;

ALTER TABLE public.lost_reports
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS lost_reports_event_id_idx
  ON public.lost_reports (event_id) WHERE event_id IS NOT NULL;

ALTER TABLE public.found_items
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS found_items_event_id_idx
  ON public.found_items (event_id) WHERE event_id IS NOT NULL;

ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS work_orders_event_id_idx
  ON public.work_orders (event_id) WHERE event_id IS NOT NULL;

ALTER TABLE public.anonymous_reports
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS anonymous_reports_event_id_idx
  ON public.anonymous_reports (event_id) WHERE event_id IS NOT NULL;

COMMENT ON COLUMN public.incidents.event_id IS
  'When set, the incident is scoped to an event. Drives the day pill + filter on /live.';
COMMENT ON COLUMN public.incidents.event_day_id IS
  'When set, scopes the incident to a specific event_day for multi-day rollups.';
