-- 0113_templates.sql
-- Polymorphic templates table. running_order ships at L2 launch; the four
-- other types (event, timeline, board, checklist) DO NOT require a fork —
-- they slot in by setting template_type and shaping the payload jsonb.
--
-- Crescat add list item #12.

CREATE TABLE IF NOT EXISTS public.templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  template_type   text NOT NULL,       -- 'running_order' | 'event' | 'timeline' | 'board' | 'checklist'
  name            text NOT NULL,
  description     text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS templates_org_type_idx
  ON public.templates (org_id, template_type)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE public.templates IS
  'Polymorphic templates. template_type discriminates the payload shape. running_order at launch; event / timeline / board / checklist slot in later without a fork.';

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_member_all
  ON public.templates
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- Bring templates into the supabase_realtime publication when present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
