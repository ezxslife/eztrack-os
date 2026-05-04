-- 0100_realtime_publication_events.sql
-- Adds events-domain tables to the Supabase Realtime publication.
-- Subscribers (web /live, wall-display, mobile companion) get push updates
-- on every relevant write.

-- supabase_realtime is the default publication created by Supabase.
-- IF NOT EXISTS guards are tolerant of pre-existing publication members.

DO $$
DECLARE
  pub_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    INTO pub_exists;

  IF NOT pub_exists THEN
    RAISE NOTICE 'supabase_realtime publication does not exist. Skipping (will be created by Supabase on first realtime subscription).';
    RETURN;
  END IF;

  -- Add tables one at a time, ignoring "already in publication" errors.
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;            EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.capacity_snapshots;   EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_assignments;    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;              EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;               EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.events;               EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.event_days;           EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

COMMENT ON SCHEMA public IS
  'Realtime publication includes: check_ins, capacity_snapshots, shift_assignments, tickets, orders, events, event_days. Subscribe with channel scoping like event:{eventId}:checkins for performance.';
