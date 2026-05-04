-- 0035_staff_event_grants.sql
-- Scoped door-staff access. Lets a Personnel record (with or without a linked
-- auth.users row) get permission to act on ONE event without seeing the rest
-- of the workspace. Drives RLS in 0099_rls_events.sql.

-- ============================================================================
-- Enum: staff_event_permission
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE staff_event_permission AS ENUM (
    'scan',                -- can write check_ins
    'pos',                 -- can run /pos for this event
    'incident_log',        -- can write to incidents (via existing eztrack-os incidents)
    'manual_checkin',      -- can mark a ticket scanned via manual lookup
    'will_call',           -- can update visitors / will-call status
    'view_only'            -- read-only access to /live + /staff for the event
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- staff_event_grants
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.staff_event_grants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  personnel_id    uuid NOT NULL,                              -- soft-link to eztrack-os personnel
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
                                                              -- nullable; door staff may not have a Supabase user
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  permissions     staff_event_permission[] NOT NULL DEFAULT '{}',
  granted_at      timestamptz NOT NULL DEFAULT now(),
  granted_by      uuid,                                       -- auth.users.id of the operator
  expires_at      timestamptz,                                -- typically event.ends_at + 24h
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_event_grants_unique_per_event_personnel
    UNIQUE (event_id, personnel_id)
);

CREATE INDEX IF NOT EXISTS staff_event_grants_user_id_idx
  ON public.staff_event_grants (user_id)
  WHERE user_id IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS staff_event_grants_event_id_idx
  ON public.staff_event_grants (event_id)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE public.staff_event_grants IS
  'Scoped permissions for staff to act on a single event. Door staff may not have an auth.users row — they sign in via short-lived QR-paired sessions (see wall_display_sessions for similar pattern).';

-- ============================================================================
-- Helper: check if current auth.uid() has a permission for an event
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_event_permission(
  p_event_id   uuid,
  p_permission staff_event_permission
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.staff_event_grants seg
     WHERE seg.event_id = p_event_id
       AND seg.user_id  = auth.uid()
       AND seg.revoked_at IS NULL
       AND (seg.expires_at IS NULL OR seg.expires_at > now())
       AND p_permission = ANY(seg.permissions)
  );
$$;

COMMENT ON FUNCTION public.has_event_permission IS
  'Returns true if the calling user has the given permission for an event via staff_event_grants. Used in RLS policies.';
