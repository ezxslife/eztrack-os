-- 0104_run_of_show_show_caller.sql
-- Single source-of-truth row-advancer in Show Mode. Without this, multi-
-- operator events are ambiguous on stage. (eztrack-os schema names the
-- "running order" table run_of_show; this column is the show-caller for
-- that row set.)

ALTER TABLE public.run_of_show
  ADD COLUMN IF NOT EXISTS show_caller_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS run_of_show_show_caller_idx
  ON public.run_of_show (show_caller_user_id)
  WHERE show_caller_user_id IS NOT NULL;

COMMENT ON COLUMN public.run_of_show.show_caller_user_id IS
  'The single operator authorized to advance this run-of-show in Show Mode. Multi-operator events resolve row-advancer ambiguity through this column. NULL means anyone with org membership can advance.';
