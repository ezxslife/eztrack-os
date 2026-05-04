# m21 — Closing the Crescat-pivot loop

Five gaps surfaced by the audit landed in this milestone. The Events Mode envelope is now coherent end-to-end: every operator action that has a UI on web has a counterpart for mobile or a deferred-but-wired backend path.

## 1. Mobile run-of-show

**File:** `apps/mobile/app/(events-mode)/run-of-show.tsx` (new) + `apps/mobile/src/lib/events-queries.ts` (extended)

Mirror of `/run-of-show` web Show Mode minus the editor (operators still author timelines on web). Day tabs, row-state machine `past/current/future` inferred from the wall clock vs slot windows, Advance button on the current slot, checklist toggle. Pull-to-refresh + 30s polling so the timeline tracks even without realtime open. Visual treatment per state: 50% opacity for past, green left-border + NOW pill + green Advance for current, normal for future.

Tab order is now `Live · POS · RoS · Staff · Incident`.

## 2. Hold Events UI

**Files:** `apps/web/src/app/(events-mode)/events/[slug]/page.tsx` + `apps/web/src/app/(events-mode)/events/page.tsx`

The `events.status='hold'` schema landed earlier; this milestone gives it a UI. On the detail page a purple HoldDetails banner renders before the cancellation banner with rank input + ISO-datetime picker + Save. On the events list, hold rank + expires render under the capacity dl when status is hold so a producer scanning the list can see priority order at a glance.

## 3. /templates standalone CRUD

**File:** `apps/web/src/app/(events-mode)/templates/page.tsx` (new)

Removes the requirement that operators navigate through `/run-of-show` to manage templates. Filter chips (All / Run-of-show — additional types slot in here as the polymorphic `template_type` enum grows), expandable rows with PayloadPreview rendering slots + checklist, rename + delete actions. Soft-delete via the existing `deleteTemplate` helper.

Nav item added with `BookmarkPlus` icon.

## 4. event_members accept flow

**Files:** `apps/web/src/lib/queries/events.ts` + `apps/web/src/app/(events-mode)/_components/PendingInvitesBanner.tsx` (new) + `(events-mode)/layout.tsx`

Previously `event_members.invited_at` stamped on insert but `accepted_at` was never set. New helpers `acceptEventMembership`, `fetchMyPendingMemberships`, `fetchEventsByIds`. PendingInvitesBanner sits between EventsModeNav and main on every events-mode page; it lists the signed-in operator's pending invites with role/permission badges and Accept/Decline buttons. Accept stamps `accepted_at = now()`; Decline removes the row entirely.

## 5. Receipt-email wiring

**Files:**
- `supabase/migrations/0114_email_outbox.sql` (new)
- `supabase/functions/email-send/index.ts` (new)
- `apps/web/src/lib/queries/events.ts` (createPosSale → enqueue + invoke)
- `apps/web/src/app/(events-mode)/pos/page.tsx` (banner reflects queued/failed)

A generic transactional-email queue lands at `public.email_outbox` (org-scoped via the existing `get_user_org_id()` helper). First writer is `createPosSale`: when the customer-facing email field is filled, after the order row is created we insert an outbox row keyed `related_type='pos_receipt'`, `related_id=order_id`, render a plaintext + HTML receipt body (event name, tier, total, order id), and fire-and-forget invoke the `email-send` Edge Function with `{ id }` so the customer sees their receipt within seconds (cron is the safety net).

The `email-send` worker:
- Picks up `status='pending' AND attempt_count < EMAIL_MAX_ATTEMPTS`
- Claims rows by transitioning to `'sending'` (no double-send race vs cron)
- Tries Resend (`RESEND_API_KEY`) → SendGrid (`SENDGRID_API_KEY`)
- Marks `'sent'` with provider + provider_message_id, OR retries (5xx/429) by setting back to `'pending'`, OR terminal `'error'` (4xx, no_provider_configured)
- If neither key is configured, marks all pending rows `error='no_provider_configured'` so the wiring is visible in the queue without crashing

Operator todo list:
1. `supabase secrets set RESEND_API_KEY=re_xxx` (or SendGrid)
2. `supabase secrets set EMAIL_FROM='Receipts <receipts@track.ezxs.events>'`
3. Schedule `email-send` cron every 1-5 minutes

The /pos completion banner now reads:
- `Receipt queued for x@y.com.` when the outbox insert succeeded
- `Receipt enqueue failed for x@y.com — retry from /events.` when the outbox insert errored (rare; usually RLS or a transient DB hiccup)
- `Customer attached: x@y.com.` when no email was provided to the sale, but a customer row was created (legacy path)

## Migration + function deploys

```
supabase/migrations/0114_email_outbox.sql      → applied
supabase/functions/email-send/index.ts         → deployed (verify_jwt=false, version 1)
```

Both reusing the same conventions as L0a/L0b — `get_user_org_id()` for RLS, `_shared/cors.ts` + `_shared/supabase.ts` helpers, `CAPACITY_WORKER_SECRET` for cron auth.

## What's intentionally still deferred

- Cron schedule for `email-send` (operator action; Supabase Cron UI or `pg_cron`)
- `RESEND_API_KEY` / `EMAIL_FROM` env vars (operator action; switches no-op to live delivery)
- Receipt retry UI from /events list (queued under v1.5 audit-log work)
- Receipt-email body theming + brand colors (HTML body is intentionally minimal — designer pass in v1.5)
