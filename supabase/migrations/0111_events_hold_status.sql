-- 0111_events_hold_status.sql
-- Reserve the Hold Events shape now. UI ships v1.5 but the schema lands once.
--
-- Hold Events: venues holding dates while a buyer negotiates. hold_rank lets
-- multiple buyers stack (rank 1 = first refusal, rank 2 = backup, etc).
-- hold_expires_at auto-releases stale holds.

-- Add 'hold' to the event_status enum
DO $$ BEGIN
  ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'hold';
EXCEPTION WHEN others THEN NULL; END $$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hold_rank        int,
  ADD COLUMN IF NOT EXISTS hold_expires_at  timestamptz;

CREATE INDEX IF NOT EXISTS events_hold_idx
  ON public.events (hold_rank, hold_expires_at)
  WHERE hold_rank IS NOT NULL;

COMMENT ON COLUMN public.events.hold_rank IS
  'When status=hold, the position in the hold queue. 1 = first refusal, 2 = backup, etc. Multiple events can hold the same date with different ranks.';
COMMENT ON COLUMN public.events.hold_expires_at IS
  'When status=hold, the deadline for converting to confirmed. After this, the hold auto-releases (v1.5 worker).';
