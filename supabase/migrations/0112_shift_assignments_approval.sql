-- 0112_shift_assignments_approval.sql
-- 3-state approval workflow for shifts:
--   pending  → admin still needs to approve (yellow on Staff Console)
--   approved → admin approved, staff has yet to accept (blue)
--   accepted → staff accepted (green)
-- Drives the Staff Console color logic per Crescat's pattern.
--
-- DISTINCT from the existing shift_assignments.status enum, which is the
-- runtime/in-shift status (scheduled / en_route / on_shift / break / off_shift
-- / no_show). approval_status is the lifecycle BEFORE the shift starts.

DO $$ BEGIN
  CREATE TYPE shift_approval_status AS ENUM ('pending', 'approved', 'accepted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.shift_assignments
  ADD COLUMN IF NOT EXISTS approval_status shift_approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE INDEX IF NOT EXISTS shift_assignments_approval_status_idx
  ON public.shift_assignments (approval_status)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.shift_assignments.approval_status IS
  'Pre-shift lifecycle. pending = admin needs to approve, approved = admin approved (awaiting staff), accepted = staff confirmed. Distinct from status (runtime).';
