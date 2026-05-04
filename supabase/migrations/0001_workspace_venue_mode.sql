-- 0001_workspace_venue_mode.sql
-- Adds VENUE_MODE support to the org/workspace level.
-- ezxs-track Events Mode runs alongside eztrack-os Security Mode via this flag.

-- ============================================================================
-- Enum: venue_mode
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE venue_mode AS ENUM ('security', 'events', 'both');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Add venue_mode_default to the org/workspace table.
-- We don't know the exact name of the org table in eztrack-os — confirm against
-- 0000_baseline.sql and rename the table reference here if needed.
-- Likely candidates: `organizations`, `orgs`, `workspaces`.
-- ============================================================================

DO $$
DECLARE
  org_table_name text;
BEGIN
  -- Try common names in order
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    org_table_name := 'organizations';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'orgs') THEN
    org_table_name := 'orgs';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'workspaces') THEN
    org_table_name := 'workspaces';
  ELSE
    RAISE EXCEPTION
      'Could not find the org/workspace table. Check 0000_baseline.sql and update 0001 manually.';
  END IF;

  EXECUTE format(
    'ALTER TABLE public.%I
       ADD COLUMN IF NOT EXISTS venue_mode_default venue_mode NOT NULL DEFAULT ''security''',
    org_table_name
  );

  EXECUTE format(
    'COMMENT ON COLUMN public.%I.venue_mode_default IS
       ''Default UI mode: security (year-round venue ops), events (event-day live ops), or both''',
    org_table_name
  );
END $$;
