-- 0102_wall_display_jwt_rls.sql
-- Read-only wall-display access via short-lived JWT claims issued by the
-- wall-display-pairing Edge Function.

CREATE OR REPLACE FUNCTION public.is_wall_display_session(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.wall_display_sessions wds
     WHERE wds.id::text = auth.jwt()->>'wall_display_session_id'
       AND wds.event_id = p_event_id
       AND wds.event_id::text = auth.jwt()->>'wall_display_event_id'
       AND wds.org_id::text = auth.jwt()->>'wall_display_org_id'
       AND wds.jwt_id = auth.jwt()->>'jti'
       AND wds.paired_at IS NOT NULL
       AND wds.revoked_at IS NULL
       AND wds.expires_at > now()
  );
$$;

COMMENT ON FUNCTION public.is_wall_display_session IS
  'Returns true when the caller has a valid short-lived wall-display JWT scoped to the supplied event.';

CREATE POLICY events_wall_display_read
  ON public.events
  FOR SELECT
  USING (public.is_wall_display_session(events.id));

CREATE POLICY event_days_wall_display_read
  ON public.event_days
  FOR SELECT
  USING (public.is_wall_display_session(event_days.event_id));

CREATE POLICY check_ins_wall_display_read
  ON public.check_ins
  FOR SELECT
  USING (public.is_wall_display_session(check_ins.event_id));

CREATE POLICY capacity_snapshots_wall_display_read
  ON public.capacity_snapshots
  FOR SELECT
  USING (public.is_wall_display_session(capacity_snapshots.event_id));
