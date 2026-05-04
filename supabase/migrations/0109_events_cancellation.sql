-- 0109_events_cancellation.sql
-- Cancel ≠ Delete. Preserves data, removes from operational surface, allows
-- reinstatement, gives audit trail. Compliance + ops both demand this.
--
-- The existing events.status enum already has 'cancelled'; these columns
-- record WHO cancelled and WHY, which the enum value alone can't carry.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cancelled_at         timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason  text,
  ADD COLUMN IF NOT EXISTS cancelled_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_cancelled_at_idx
  ON public.events (cancelled_at)
  WHERE cancelled_at IS NOT NULL;

COMMENT ON COLUMN public.events.cancelled_at IS
  'Timestamp of cancellation. NULL = active. Reinstating clears this back to NULL.';
COMMENT ON COLUMN public.events.cancellation_reason IS
  'Operator-supplied reason for cancellation. Surfaced in the cancellation email + audit log.';
COMMENT ON COLUMN public.events.cancelled_by_user_id IS
  'auth.users.id of the operator who cancelled. NULL when reinstated.';
