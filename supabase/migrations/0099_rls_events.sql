-- 0099_rls_events.sql
-- Row Level Security for all events-domain tables.
--
-- Posture:
--   - Workspace members: full read/write on rows scoped to their org_id
--     (uses the same membership pattern as the rest of eztrack-os).
--   - Door staff with staff_event_grants: scoped read/write only on the
--     specific event they're granted, and only with the relevant permission.
--   - Wall-display JWT (issued by 0037 flow): read-only access to capacity
--     snapshots + check_ins for one event.
--
-- IMPORTANT: this migration assumes a `org_members` (or equivalent) table
-- exists in the eztrack-os baseline. The existing `profiles.org_id` column is
-- the simplest membership signal. We use that pattern below; rename if
-- eztrack-os uses a different table name.

-- ============================================================================
-- Helper: returns true if auth.uid() belongs to a given org_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.profiles p
     WHERE p.id = auth.uid()
       AND p.org_id = p_org_id
  );
$$;

COMMENT ON FUNCTION public.is_org_member IS
  'Membership probe used by RLS policies. Update if eztrack-os uses an org_members join table instead of profiles.org_id.';

-- ============================================================================
-- events
-- ============================================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_member_all
  ON public.events
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY events_door_staff_read
  ON public.events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_event_grants seg
       WHERE seg.event_id = events.id
         AND seg.user_id  = auth.uid()
         AND seg.revoked_at IS NULL
    )
  );

-- ============================================================================
-- event_days
-- ============================================================================

ALTER TABLE public.event_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_days_member_all
  ON public.event_days
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events e
             WHERE e.id = event_days.event_id
               AND public.is_org_member(e.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e
             WHERE e.id = event_days.event_id
               AND public.is_org_member(e.org_id))
  );

CREATE POLICY event_days_door_staff_read
  ON public.event_days
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_event_grants seg
       WHERE seg.event_id = event_days.event_id
         AND seg.user_id  = auth.uid()
         AND seg.revoked_at IS NULL
    )
  );

-- ============================================================================
-- customers
-- ============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_member_all
  ON public.customers
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- Door staff with will_call permission can read customers linked to tickets
-- for their granted event:
CREATE POLICY customers_door_will_call_read
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.tickets t
        JOIN public.staff_event_grants seg ON seg.event_id = t.event_id
       WHERE t.customer_id = customers.id
         AND seg.user_id   = auth.uid()
         AND seg.revoked_at IS NULL
         AND 'will_call' = ANY(seg.permissions)
    )
  );

-- ============================================================================
-- tickets
-- ============================================================================

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tickets_member_all
  ON public.tickets
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY tickets_door_staff_read
  ON public.tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_event_grants seg
       WHERE seg.event_id = tickets.event_id
         AND seg.user_id  = auth.uid()
         AND seg.revoked_at IS NULL
         AND ('scan' = ANY(seg.permissions)
           OR 'manual_checkin' = ANY(seg.permissions)
           OR 'will_call' = ANY(seg.permissions))
    )
  );

-- ============================================================================
-- orders
-- ============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_member_all
  ON public.orders
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- Door staff with POS permission can write orders for their event:
CREATE POLICY orders_door_pos_write
  ON public.orders
  FOR INSERT
  WITH CHECK (
    public.has_event_permission(orders.event_id, 'pos'::staff_event_permission)
  );

-- ============================================================================
-- order_line_items
-- ============================================================================

ALTER TABLE public.order_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_line_items_member_all
  ON public.order_line_items
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.orders o
             WHERE o.id = order_line_items.order_id
               AND public.is_org_member(o.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o
             WHERE o.id = order_line_items.order_id
               AND public.is_org_member(o.org_id))
  );

-- ============================================================================
-- check_ins
-- ============================================================================

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY check_ins_member_all
  ON public.check_ins
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- Door staff with scan permission can write check_ins for their event:
CREATE POLICY check_ins_door_scan_write
  ON public.check_ins
  FOR INSERT
  WITH CHECK (
    public.has_event_permission(check_ins.event_id, 'scan'::staff_event_permission)
    OR public.has_event_permission(check_ins.event_id, 'manual_checkin'::staff_event_permission)
    OR public.has_event_permission(check_ins.event_id, 'pos'::staff_event_permission)
  );

CREATE POLICY check_ins_door_read
  ON public.check_ins
  FOR SELECT
  USING (
    public.has_event_permission(check_ins.event_id, 'scan'::staff_event_permission)
    OR public.has_event_permission(check_ins.event_id, 'view_only'::staff_event_permission)
  );

-- ============================================================================
-- capacity_snapshots
-- ============================================================================

ALTER TABLE public.capacity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY capacity_snapshots_member_read
  ON public.capacity_snapshots
  FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY capacity_snapshots_door_read
  ON public.capacity_snapshots
  FOR SELECT
  USING (
    public.has_event_permission(capacity_snapshots.event_id, 'scan'::staff_event_permission)
    OR public.has_event_permission(capacity_snapshots.event_id, 'view_only'::staff_event_permission)
  );

-- ============================================================================
-- run_of_show, ros_slots, checklist_items, shift_assignments
-- ============================================================================

ALTER TABLE public.run_of_show       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ros_slots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY run_of_show_member_all
  ON public.run_of_show
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY ros_slots_member_all
  ON public.ros_slots
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.run_of_show r
             WHERE r.id = ros_slots.ros_id
               AND public.is_org_member(r.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.run_of_show r
             WHERE r.id = ros_slots.ros_id
               AND public.is_org_member(r.org_id))
  );

CREATE POLICY checklist_items_member_all
  ON public.checklist_items
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.run_of_show r
             WHERE r.id = checklist_items.ros_id
               AND public.is_org_member(r.org_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.run_of_show r
             WHERE r.id = checklist_items.ros_id
               AND public.is_org_member(r.org_id))
  );

CREATE POLICY shift_assignments_member_all
  ON public.shift_assignments
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- ============================================================================
-- staff_event_grants
-- ============================================================================

ALTER TABLE public.staff_event_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_event_grants_member_all
  ON public.staff_event_grants
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- A grant-holder can read their own grant rows:
CREATE POLICY staff_event_grants_self_read
  ON public.staff_event_grants
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- incident_escalation_rules
-- ============================================================================

ALTER TABLE public.incident_escalation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_escalation_rules_member_all
  ON public.incident_escalation_rules
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- ============================================================================
-- wall_display_sessions
-- ============================================================================

ALTER TABLE public.wall_display_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY wall_display_sessions_member_all
  ON public.wall_display_sessions
  FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- ============================================================================
-- scan_webhooks
-- Service-role only — no operator should read raw webhook payloads (PII risk).
-- ============================================================================

ALTER TABLE public.scan_webhooks ENABLE ROW LEVEL SECURITY;
-- No policy = no access except via service role (which bypasses RLS).

COMMENT ON TABLE public.scan_webhooks IS
  'Raw inbound webhook log. RLS disallows all access; only the service role (Edge Functions) reads/writes here.';
