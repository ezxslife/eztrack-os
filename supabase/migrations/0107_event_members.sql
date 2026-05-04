-- 0107_event_members.sql
-- Per-event scoped access for outside producers / freelancers without giving
-- them org-wide read. Layers on top of org_id; does NOT replace is_org_member.
--
-- Distinct from staff_event_grants (which is for door staff with action-level
-- permissions like 'scan' / 'pos' / 'will_call'). event_members is for
-- producers / freelancers with write_permission across the event surface.

CREATE TABLE IF NOT EXISTS public.event_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'producer',  -- 'producer', 'freelancer', 'guest', etc.
  write_permission boolean NOT NULL DEFAULT false,
  in_timeline      boolean NOT NULL DEFAULT false,    -- shows up in /run-of-show personnel + Staff Console
  invited_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at       timestamptz NOT NULL DEFAULT now(),
  accepted_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_members_unique_per_event_user UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_members_event_id_idx ON public.event_members (event_id);
CREATE INDEX IF NOT EXISTS event_members_user_id_idx  ON public.event_members (user_id);

COMMENT ON TABLE public.event_members IS
  'Per-event scoped access for outside producers / freelancers. RLS-checked path that lets non-org-members read + (optionally) write a single event without org-wide visibility.';

-- Helper: returns true when the calling auth.uid() is a member of the event
CREATE OR REPLACE FUNCTION public.is_event_member(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.event_members em
     WHERE em.event_id = p_event_id
       AND em.user_id  = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_event_write_permission(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.event_members em
     WHERE em.event_id = p_event_id
       AND em.user_id  = auth.uid()
       AND em.write_permission = true
  );
$$;

ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own membership rows
CREATE POLICY event_members_self_read
  ON public.event_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Org members manage all event_members rows for events in their org
CREATE POLICY event_members_org_admin_all
  ON public.event_members
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_members.event_id AND public.is_org_member(e.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_members.event_id AND public.is_org_member(e.org_id))
  );

-- Layer onto events RLS: outside producers see events they're members of
CREATE POLICY events_event_member_read
  ON public.events
  FOR SELECT
  USING (public.is_event_member(events.id));

-- Same for event_days
CREATE POLICY event_days_event_member_read
  ON public.event_days
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
       WHERE e.id = event_days.event_id
         AND public.is_event_member(e.id)
    )
  );
