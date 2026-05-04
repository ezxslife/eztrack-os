-- 0105_ros_slots_trigger_type.sql
-- Reserves the trigger state machine for ros_slots (= "running_order_rows" in
-- the spec naming). Only manual ships at L2; time auto-advance lands in v1.5
-- when power-user crews ask; cue is v2+.

DO $$ BEGIN
  CREATE TYPE ros_slot_trigger AS ENUM ('manual', 'time', 'cue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.ros_slots
  ADD COLUMN IF NOT EXISTS trigger_type ros_slot_trigger NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN public.ros_slots.trigger_type IS
  'How the row advances. manual = operator taps next; time = elapsed duration auto-advances (v1.5); cue = external cue (v2+).';
