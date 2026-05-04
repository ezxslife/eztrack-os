-- 0037_wall_display_sessions.sql
-- Short-lived read-only sessions for the wall-display app (capacity board kiosk
-- in the green room / production trailer / box office).
--
-- Pairing flow:
--   1. Operator on logged-in web/mobile session opens Settings → Wall Display
--      → "Add display"
--   2. App calls an Edge Function to insert a row here with `pairing_code`
--      (6-digit) and `expires_at = now() + 10m`
--   3. Display device opens https://track.ezxs.events/wall, enters the code,
--      and exchanges it for a short-lived JWT scoped to ONE event_id with
--      read-only access to capacity_snapshots, check_ins, event_days
--   4. Display polls Realtime + Supabase reads using that JWT until expiry

CREATE TABLE IF NOT EXISTS public.wall_display_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL,
  event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  pairing_code        text NOT NULL,                          -- 6-digit human-typeable
  paired_at           timestamptz,                            -- set when display redeems the code
  paired_device_label text,                                   -- 'Production Trailer iPad'
  jwt_id              text,                                   -- jti claim of issued JWT
  expires_at          timestamptz NOT NULL,
  revoked_at          timestamptz,
  created_by          uuid NOT NULL,                          -- auth.users.id of operator
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- NOTE: Postgres rejects now() in partial-index predicates (must be IMMUTABLE).
-- Filter expires_at at query time instead; the index still guarantees uniqueness
-- of unpaired/unrevoked codes, which is what matters for the pairing flow.
CREATE UNIQUE INDEX IF NOT EXISTS wall_display_sessions_pairing_code_unique
  ON public.wall_display_sessions (pairing_code)
  WHERE paired_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS wall_display_sessions_event_id_idx
  ON public.wall_display_sessions (event_id)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE public.wall_display_sessions IS
  'Short-lived paired sessions for read-only kiosk capacity boards. Scoped to one event_id.';
