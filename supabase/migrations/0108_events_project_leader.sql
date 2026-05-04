-- 0108_events_project_leader.sql
-- One accountable owner per event. Cheap, high coordination value. Nullable
-- because draft / past events may not have an active owner; projects-leader
-- pickers default to the event creator on first save.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS project_leader_user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_project_leader_idx
  ON public.events (project_leader_user_id)
  WHERE project_leader_user_id IS NOT NULL;

COMMENT ON COLUMN public.events.project_leader_user_id IS
  'The accountable owner for this event. Nullable. UI surfaces as "Run by …" + drives default at-event-cancel notification recipient.';
