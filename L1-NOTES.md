# L1 - Live + Wall-display sprint notes

> Status: **in progress.** Builds on L0 (`events-mode/L0-foundation`, merged
> or in PR). Current branch: `events-mode/L1-live`.

---

## Definition of done (per plan.md section 14)

> Operator wires Eventbrite webhook on a real event (single-day). Capacity bar
> updates within 500ms on every native-Eventbrite scan. Manager's iPad shows
> wall-display in production trailer. Push fires at 75% threshold.

---

## Slices

| # | Slice | Status |
|---|---|---|
| L0c | Settle CSS bundle at `apps/web/src/styles/settle/` (tokens, laylo, sidebar, mobile, drilldown, assistant, public) | done (out-of-band by user) |
| 1 | `/live` route + `(events-mode)` layout + capacity board UI | done |
| 1b | Realtime subscriptions on `/live` to `capacity_snapshots` + `check_ins` | done |
| 1c | Multi-day day picker + rolling totals + 60-minute door-flow chart | done |
| 2 | Demo seed via MCP `execute_sql` (event `2e662e3d...`, 5 tickets, 3 check_ins, capacity_snapshot trigger fired) | done |
| 3 | `connections` table migration (encrypted Eventbrite OAuth tokens via `pgcrypto` or `vault`) | pending |
| 3 | Eventbrite OAuth connect + callback (`apps/web/src/app/auth/eventbrite/`) | pending |
| 3 | Full Eventbrite handler in `checkin-router` (Eventbrite API or pre-synced ticket mapping -> canonical `check_ins`) | done |
| 4 | `apps/wall-display` Expo app (capacity board + recent scans + door-flow chart) | done |
| 4 | Wall-display pairing flow (Settings page + Edge Function for short-lived JWT) | done |
| 5 | Capacity threshold worker (Edge Function raises existing Alerts rows at 75/90/100%) | done |
| m3 | Operator UI: `/events` list + `/events/new` creator + `ManualScanWidget` on `/live` (manual_lookup path through canonical `checkin-router`) | done |
| m5 | Operator-side wall-display pairing UI: `(events-mode)/wall-display/page.tsx` (settle theme) + `(dashboard)/settings/wall-display/page.tsx` (eztrack-os theme) + nav item | done |
| chrome | Port settle's `Layout` / `Sidebar` / `MobileNav` / `QuickAddSheet` / `AssistantPanel` / `ThemeToggle` | pending (blocked: ezxs-settle sources sandboxed in this Claude Code session — re-launch from `Sauce/` parent to read them) |

---

## What landed in this pass

### Web

| File | Purpose |
|---|---|
| `apps/web/src/app/(events-mode)/live/page.tsx` | Multi-day-aware live command center: capacity card, counts, recent scans, day picker, door-flow chart, rolling multi-day totals, 44pt quick actions. |
| `apps/web/src/app/(dashboard)/settings/wall-display/page.tsx` | Manager pairing screen: select event, create 6-digit code, list recent paired/pending display sessions. |
| `apps/web/src/lib/queries/events.ts` | Events-mode query layer for active event, current day, day list, latest capacity snapshot, recent scans, 60-minute scan window, and multi-day rollup. |
| `apps/web/src/proxy.ts` | Cleaned unused cookie option destructure. Next.js 16 proxy remains the auth/session refresh path; obsolete `src/middleware.ts` is removed. |
| `apps/wall-display/` | Standalone Expo SDK 54 app for kiosk/iPad wall displays. Redeems a pairing code, reads via event-scoped JWT, and shows capacity, recent scans, and door-flow chart. |

### Edge Functions

| Function | Purpose |
|---|---|
| `checkin-router` | Eventbrite path handles `attendee.checked_in`, `attendee.updated`, `order.placed`, `order.refunded`, and `event.updated`. |
| `eventbrite-webhook` | Uses a stable idempotency key so Eventbrite retries reuse the existing `scan_webhooks` row instead of creating duplicates. |
| `capacity-threshold-worker` | Scans latest breached capacity snapshots and raises existing `alerts` rows at yellow/red/alert thresholds. |
| `wall-display-pairing` | Creates short-lived pairing codes for logged-in org members and redeems them for read-only event-scoped JWTs. |

### Schema

| Migration | Purpose |
|---|---|
| `0101_function_search_path.sql` | Pins `search_path = public` on helper functions flagged by the Supabase security advisor. |
| `0102_wall_display_jwt_rls.sql` | Adds `is_wall_display_session(event_id)` and read-only RLS policies for wall-display JWT claims. |

---

## Eventbrite ingestion notes

- `attendee.checked_in` can work without an Eventbrite API token if
  `tickets.external_id` already contains the Eventbrite attendee id.
- Set `EVENTBRITE_API_TOKEN` as a Supabase secret to enable order/ticket/customer
  enrichment from the Eventbrite API.
- API enrichment maps Eventbrite events by `events.live_ops_config.eventbrite_event_id`.
  Until the Eventbrite connection UI lands, seed that JSON key on the event that
  should receive Eventbrite orders/attendees.
- `checkin-router` remains the only writer of `check_ins`; webhook receivers only
  log raw payloads and dispatch.

---

## Deploy notes

```bash
supabase secrets set EVENTBRITE_WEBHOOK_SECRET=<from Eventbrite app>
supabase secrets set EVENTBRITE_API_TOKEN=<optional private token>
supabase secrets set CAPACITY_WORKER_SECRET=<optional random secret>
supabase secrets set SUPABASE_JWT_SECRET=<Supabase project JWT secret>

supabase functions deploy eventbrite-webhook --no-verify-jwt
supabase functions deploy checkin-router
supabase functions deploy capacity-threshold-worker
supabase functions deploy wall-display-pairing --no-verify-jwt
```

If `CAPACITY_WORKER_SECRET` is set, invoke the worker with either:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/capacity-threshold-worker" \
  -H "Authorization: Bearer $CAPACITY_WORKER_SECRET"
```

or:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/capacity-threshold-worker" \
  -H "x-capacity-worker-secret: $CAPACITY_WORKER_SECRET"
```

---

## Verification run locally

- `apps/web`: `pnpm type-check` passes.
- `apps/wall-display`: `pnpm --filter @eztrack/wall-display type-check` passes.
- Focused ESLint on touched web files passes.
- Edge Function TypeScript syntax checked via local TypeScript transpilation.
- `/login` returns 200 on the app dev server; `/live` redirects unauthenticated
  users to `/login?redirectTo=%2Flive`.
- Full `pnpm --filter web test` still fails on pre-existing mobile color contrast
  assertion in `apps/web/src/__tests__/contrast-tokens.test.ts`.

---

## Risks + watch items

1. **No `connections` table yet.** Eventbrite OAuth still needs encrypted token
   storage. Current enrichment uses `EVENTBRITE_API_TOKEN` as a deploy secret.
2. **Eventbrite event mapping is manual for now.** Seed
   `events.live_ops_config.eventbrite_event_id` until the Eventbrite connection UI
   writes the mapping.
3. **Wall-display JWT secret is required.** `wall-display-pairing` cannot redeem
   display codes until `SUPABASE_JWT_SECRET` is set as a Supabase secret.
4. **Database types stale.** `apps/web/src/types/database.ts` predates the new
   migrations. Events-mode queries use local row types until Supabase types are
   regenerated.
5. **Capacity worker raises Alerts rows only.** Twilio/Slack/Discord fan-out stays
   behind the existing Alerts/Notifications delivery layer.
