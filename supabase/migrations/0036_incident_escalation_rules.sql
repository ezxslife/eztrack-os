-- 0036_incident_escalation_rules.sql
-- Per-org escalation rules for the existing eztrack-os incidents module.
-- Hardcoded defaults in v1; UI editor lands in v1.5.
--
-- This table layers on top of the existing incidents table without modifying it.
-- The L2 escalation worker reads these rules, watches incidents.status, and
-- pages the right Personnel via the existing Alerts hub.

CREATE TABLE IF NOT EXISTS public.incident_escalation_rules (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL,
  -- Match condition (any combo can be present; all must match for the rule to fire)
  match_category           text,                              -- 'medical' | 'security' | 'facilities' | etc. (eztrack-os incidents.category enum value)
  match_severity           text,                              -- 'low' | 'medium' | 'high' | 'critical' (matches incident_severity enum)
  -- Routing
  primary_handler_role     text NOT NULL,                     -- e.g. 'medical', 'security', 'manager'
  escalate_after_minutes   integer NOT NULL DEFAULT 15,
  fallback_role            text,                              -- pages this role if primary doesn't acknowledge
  -- Channels (uses existing Alerts hub)
  channels                 text[] NOT NULL DEFAULT '{push,sms}'::text[],
  -- Lifecycle
  is_active                boolean NOT NULL DEFAULT true,
  priority                 integer NOT NULL DEFAULT 100,      -- lower = higher priority when multiple rules match
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz
);

CREATE INDEX IF NOT EXISTS incident_escalation_rules_org_active_idx
  ON public.incident_escalation_rules (org_id, is_active)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE public.incident_escalation_rules IS
  'Org-scoped routing rules for the existing eztrack-os incidents module. Picked up by the L2 escalation worker.';

-- ============================================================================
-- Sensible defaults — seeded per-org on first event creation, not here.
-- The seeding logic lives in apps/web/src/lib/events/seed-escalation-defaults.ts
-- so operators can edit them per workspace.
-- ============================================================================
