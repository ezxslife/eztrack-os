-- 0110_events_performance_id.sql
-- Reserves the namespace for v2's Performances entity (Artists as first-class).
-- ONE COLUMN, ZERO LOGIC, avoids a destructive migration when v2 lands.
--
-- The performances table itself ships in v2. Until then, this column is
-- nullable and pointing at nothing — operators can leave it null safely.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS performance_id uuid;

COMMENT ON COLUMN public.events.performance_id IS
  'v2 namespace reservation. Will become an FK to public.performances when the v2 Performances subsystem ships (Artists as first-class with Contacts / Travels / Accommodations / Tasks / Documents / Guest Lists). Nullable; do not depend on this column in v1 logic.';
