-- 0106_events_production_window.sql
-- Load-in / load-out window separate from doors. Production teams treat these
-- as different "whens." ezxs-settle's revenue-rec may want production-period
-- boundaries for cost matching (back-flow contract).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS production_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS production_ends_at   timestamptz;

CREATE INDEX IF NOT EXISTS events_production_window_idx
  ON public.events (production_starts_at, production_ends_at)
  WHERE production_starts_at IS NOT NULL;

COMMENT ON COLUMN public.events.production_starts_at IS
  'Earliest staff arrival (load-in). Distinct from events.starts_at (doors).';
COMMENT ON COLUMN public.events.production_ends_at IS
  'Latest staff departure (load-out). Distinct from events.ends_at (doors close).';
