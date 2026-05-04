# L1 — Live + Wall-display sprint notes

> Status: **in progress.** Builds on L0 (events-mode/L0-foundation, merged or in PR).
>
> Branch: `events-mode/L1-live` off `events-mode/L0-foundation`.

---

## Definition of done (per plan.md §14)

> Operator wires Eventbrite webhook on a real event (single-day). Capacity bar
> updates within 500ms on every native-Eventbrite scan. Manager's iPad shows
> wall-display in production trailer. Push fires at 75% threshold.

## Slices

| # | Slice | Status |
|---|---|---|
| L0c | Settle CSS bundle at `apps/web/src/styles/settle/` (tokens · laylo · sidebar · mobile · drilldown · assistant · public) | done (out-of-band by user) |
| 1 | `/live` route + (events-mode) layout (slim header, settle tokens, `data-venue-mode="events"`) + capacity board UI | done |
| 1b | Realtime subscriptions on `/live` to `capacity_snapshots` + `check_ins` filtered by `event_day_id` | done |
| 2 | Demo seed via MCP `execute_sql` (event `2e662e3d…`, 5 tickets, 3 check_ins, capacity_snapshot trigger fired) | done |
| 3 | `connections` table migration (encrypted Eventbrite OAuth tokens via `pgcrypto` or `vault`) | pending |
| 3 | Eventbrite OAuth connect + callback (`apps/web/src/app/auth/eventbrite/`) | pending |
| 3 | Full Eventbrite handler in `checkin-router` (Eventbrite API → resolve ticket → write check_in) | pending |
| 4 | `apps/wall-display` Expo app (capacity board + recent scans + door-flow chart) | pending |
| 4 | Wall-display pairing flow (Settings page + Edge Function for short-lived JWT) | pending |
| 5 | Capacity threshold worker (pg_cron + Alerts hub for push at 75/90/100%) | pending |
| chrome | Port settle's `Layout` / `Sidebar` / `MobileNav` / `QuickAddSheet` / `AssistantPanel` / `ThemeToggle` (per CLAUDE.md L1 scope expansion) — adapt `react-router-dom` → `next/link` + `usePathname`, `import.meta.env` → `process.env.NEXT_PUBLIC_*`, settle's Zustand `useStore` → track's `stores/`, `APP_BRAND` → track-events brand file | pending |

## Architectural decisions

- **(events-mode) route group:** edge-to-edge layout with no sidebar. `/live` is meant to be the focused command center; max screen real-estate goes to capacity bar / counts / scan feed. Events-mode navigation arrives in L2 alongside `/pos` and `/run-of-show`.
- **44pt minimum tap targets** on `/live` quick actions, full-width #34C759 success / #EF4444 reject banners on scan results (per CLAUDE.md theme guidance).
- **Auth gate:** `useRequireAuth()` client-side guard from L0. Server-side guard is a follow-up.
- **Active event resolution:** most recent event for the org with `status='live'` OR (`starts_at <= now < ends_at`). If none, empty state + CTA to create one.
- **Realtime channels:** subscribe per-event-day via `event_day_id=eq.<id>` filter to avoid noisy fan-out.

## Risks + watch items

1. **No `connections` table yet** — Eventbrite OAuth needs encrypted token storage. Will add in slice 3 with `pgcrypto` (already installed).
2. **`apps/wall-display` does not exist** — plan.md said "already scaffolded" but the dir is absent. Will create from scratch as Expo Router project in slice 4.
3. **Database types stale** — `apps/web/src/types/database.ts` predates the new migrations. Generated types are 151KB so re-merging is a follow-up. For now, queries use locally-declared types matching the migration shapes.
4. **Capacity threshold worker design** — `pg_cron` available but per-second polling not ideal for push latency. Better: a Postgres trigger on `capacity_snapshots` insert that conditionally enqueues a notification job (via `pg_net` or a simple "alerts_outbox" table polled by Edge Function).
