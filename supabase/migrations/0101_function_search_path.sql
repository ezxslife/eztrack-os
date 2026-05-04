-- 0101_function_search_path.sql
-- Security advisor hardening: pin search_path on helper functions created in
-- earlier Events Mode migrations.

ALTER FUNCTION public.refresh_event_multi_day_flag()
  SET search_path = public;

ALTER FUNCTION public.current_event_day(uuid)
  SET search_path = public;

ALTER FUNCTION public.refresh_capacity_snapshot()
  SET search_path = public;
