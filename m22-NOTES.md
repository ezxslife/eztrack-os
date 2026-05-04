# m22 — Multi-day POS · activity_log writes · /audit + /notifications

Four chunks landed together. The POS work closes the last L3 multi-day gap, the activity_log writes turn an empty audit table into a populated one, and the two new pages (/audit + /notifications) give operators the visibility + control that were stubs before.

## 1. L3 #3 — multi-day pass mechanics on POS

**Files:**
- `apps/web/src/lib/queries/events.ts` (createPosSale signature + tickets.valid_for_days insert + checkin-router event_day_id pin)
- `apps/web/src/app/(events-mode)/pos/page.tsx` (day-pass picker UI)
- `supabase/functions/checkin-router/index.ts` (event_day_id override on RouterPayload + resolveEventDay)

`createPosSale` now accepts `valid_for_days?: string[] | null` + `auto_checkin_day_id?: string | null`. The picker on /pos defaults to the active day on multi-day events; the operator can flip to "All days" for a multi-day pass or to any other Day chip. Single-day passes write `tickets.valid_for_days = [day_id]` and pin the auto-checkin to that day; multi-day passes write null (which the existing 0033 trigger reads as "valid for every day"). The completion banner shows a small pill ("Day 2 · Saturday" or "All days") so the operator can confirm what they sold.

The router-side change adds an `event_day_id` field to the qr_scanner / manual_lookup / pos_auto_checkin payload variant. `resolveEventDay` honors it as the highest-priority resolution path before `current_event_day` RPC and wall-clock fallbacks. A bad override (deleted day, wrong event_id) silently degrades to wall-clock so a clock-skewed POS can't strand a sale.

**Conservative fallback if the Edge Function isn't redeployed yet:** the new field is silently ignored; the existing wall-clock resolution path runs. A Day-2-pinned ticket sold on the Day-1 wall clock fails `valid_for_days.includes(eventDay.id)` and writes `result='wrong_day'`. That's the safe direction — door staff don't accidentally let someone in on the wrong night — but the auto-checkin won't actually land until redeploy. Operator todo: `supabase functions deploy checkin-router`.

## 2. activity_log writes everywhere

**File:** `apps/web/src/lib/queries/events.ts` (new `recordActivity` helper + writes scattered across the mutation surface).

`activity_log` was an empty eztrack-os baseline table. m22 wires the mutations that operators actually care about:

| Entity        | Action            | Triggered by                    |
| ---           | ---               | ---                             |
| events        | cancelled         | cancelEvent                     |
| events        | reinstated        | reinstateEvent                  |
| events        | hold_updated      | updateEventHoldDetails          |
| event_days    | created           | addEventDay                     |
| event_days    | updated           | updateEventDay                  |
| event_days    | deleted           | deleteEventDay                  |
| event_members | invited           | inviteEventMember               |
| event_members | accepted          | acceptEventMembership           |
| event_members | removed           | removeEventMember               |
| ros_slots     | advanced          | advanceRosSlot                  |
| run_of_show   | published         | publishRunOfShow                |
| templates     | deleted           | deleteTemplate                  |
| templates     | renamed           | renameTemplate                  |
| orders        | sold              | createPosSale (POS receipt path)|
| notification_rules | created/updated/deleted | upsertNotificationRule + deleteNotificationRule |

Convention:
- entity_type: snake_case, table-shaped
- action: past-tense verb (sold, advanced, hold_updated)
- changes: shallow jsonb diff (from/to or context); kept compact so /audit reads cleanly

The helper is fire-and-forget — failures are warned to console but never block the operator path. RLS scopes inserts to `org_id = get_user_org_id()` so caller context controls visibility.

## 3. /audit page

**File:** `apps/web/src/app/(events-mode)/audit/page.tsx` (new) + nav item.

Newest-first list of `activity_log` rows for the operator's org. Header ribbon counts configured rules vs total. Two server-side filters (entity_type, action) plus an in-memory dropdown driven by what's actually in the result. Expanded rows render the raw changes JSON in a monospace block plus the actor identity (joined via `profiles!activity_log_actor_id_fkey`).

Action verbs are color-coded:
- red: deleted, removed, cancelled
- green: created, sold, published, advanced, accepted, reinstated
- blue: updated, renamed, hold_updated

Limit is 200 rows; if traffic ever justifies it we can paginate. Read-only — no UI to mutate the audit trail (matching the spec: it should be tamper-resistant for compliance).

## 4. /notification-rules editor

**Files:**
- `apps/web/src/lib/queries/events.ts` (EVENTS_MODE_NOTIFICATION_TYPES + fetchNotificationRules + upsertNotificationRule + deleteNotificationRule)
- `apps/web/src/app/(events-mode)/notification-rules/page.tsx` (new) + nav item

> Path is `/notification-rules` (not `/notifications`) because the security-mode
> `(dashboard)/notifications` already owns the in-app notification feed.
> Next.js disallows two route groups resolving to the same URL, and the
> CLAUDE.md style boundary forbids touching the security-mode surface.

Six event types covering the events-mode signal surface:
1. `capacity_threshold` — capacity_threshold_worker crosses configured %
2. `ros_publish` — run_of_show_publisher auto-publishes at T-2hr
3. `incident_critical` — severity=critical incident from /log-incident
4. `eventbrite_webhook_failed` — scan_webhook stuck in failed state after retries
5. `event_member_invited` — operator added another user to event_members
6. `pos_receipt_failed` — /pos sale completed but email_outbox insert errored

Each card has push / email / sms toggles plus recipients picker (all_staff / managers_only / specific_emails). When `specific_emails` is picked, a comma-separated input takes over. Save upserts into `notification_rules` (one row per event_type per org), Reset deletes the row so defaults resume. Both flows write through to `activity_log` so /audit shows who flipped what.

Push currently lands in-app via the existing eztrack-os notifications hub; email + sms are wired-but-deferred — operator-side todo to plug Twilio + the email_outbox worker into the existing alerts dispatch loop.

## What's intentionally still deferred (operator deploy work)

- `supabase functions deploy checkin-router` to activate event_day_id override on auto-checkins
- Twilio setup so notification_rules.sms_enabled actually dispatches
- Wire alerts hub to fan out notification_rules.email_enabled rows through email_outbox
- /audit pagination if 200-row cap proves too narrow under heavy event traffic
- Onboarding tour (deferred since v1.5 gates this on actual operator feedback)
