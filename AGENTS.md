# AGENTS.md — ezxs-track

This file orients Codex (or any successor agent) when working in this repo. Read this first, every session.

## What this is

**ezxs-track** is the *event-day live operations* product of the EZXS Operator OS suite, built as **Events Mode on top of the existing eztrack-os codebase**. eztrack-os is the security/venue-ops platform; ezxs-track adds 3 net-new event hubs (Live · POS · Run-of-show), reframes 4 existing modules (Personnel+Dispatch → Staff Console, Visitors → Will-call, Patrons → VIP/Deny, Briefings → Run-of-show timeline), and reuses 5 modules as-is.

Sibling products live under `/Users/rostam/Desktop/Projects/Sauce/`:
- `ezxs-os/ezxs-os-1/` — canonical auth layer + Supabase project. Auth shell ported from here in L0b.
- `ezxs-promote/` — pre-event marketing wedge (separate Next.js app, plan only)
- `ezxs-settle/` — post-event finance product (Vite/React, already shipped). Receives Income from track POS sales via shared `Order` table.
- `2Wedges/` — concept docs that informed plan.md

## Quick reference

**Start here, in order:**

1. `plan.md` — canonical Events Mode plan (5–6 week, 4-sprint scope). Multi-day-aware.
2. `TASKS.md` — live task tracker. Update as items complete.
3. `L0-NOTES.md` — L0a sprint notes (schema + Edge Functions + VENUE_MODE flag + auth shims).
4. `L0b-NOTES.md` — L0b sprint notes (auth port from ezxs-os).
5. `supabase/README.md` — schema migrations + Edge Functions index.
6. `00-OVERVIEW.md` through `06-THEME-AND-TOKENS.md` — eztrack-os foundation docs (existing).

## Pre-flight — run this once before L1 starts

L0a + L0b code is scaffolded but the live Supabase project hasn't been migrated yet. Run these from the repo root before any other build work:

```bash
cd /Users/rostam/Desktop/Projects/Sauce/ezxs-track

# 0. Clean leftover sandbox file (from when this repo was seeded)
rm -f _write_test .git/index.lock

# 1. Configure git identity if missing
git config user.name  || git config user.name "Shawn"
git config user.email || git config user.email "support@ezxs.events"

# 2. Make the L0 feature branch
git status
git checkout -b events-mode/L0-foundation 2>/dev/null || git checkout events-mode/L0-foundation

# 3. Snapshot the live eztrack-os schema as the baseline
brew list supabase >/dev/null 2>&1 || brew install supabase/tap/supabase
supabase link --project-ref <YOUR_PROJECT_REF>     # ← ask Shawn for the ref
supabase db pull -f supabase/migrations/0000_baseline.sql
rm supabase/migrations/0000_BASELINE_README.md
git add supabase/migrations/0000_baseline.sql
git rm  supabase/migrations/0000_BASELINE_README.md

# 4. Inspect baseline — confirm it includes profiles, personnel, incidents, briefings,
#    dispatches, lost_found, work_orders, patrons, visitors, vehicles, contacts,
#    daily_logs, anonymous_reports, alerts, notifications, settings (+ enums + RPCs)
git diff --stat HEAD~ supabase/migrations/0000_baseline.sql

# 5. Apply events-domain migrations (0001 → 0100)
supabase db push --dry-run
supabase db push
#   If 0001_workspace_venue_mode.sql errors with "Could not find the org/workspace
#   table", edit it to reference the actual table name (likely `organizations`).

# 6. Set Edge Function secrets
supabase secrets set EVENTBRITE_WEBHOOK_SECRET=<from Eventbrite app>
supabase secrets set STRIPE_WEBHOOK_SECRET=<from Stripe dashboard>

# 7. Deploy Edge Functions
supabase functions deploy eventbrite-webhook --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy checkin-router

# 8. Append events-mode env vars
cat .env.example.events-mode >> .env.example
# Edit .env.local to set NEXT_PUBLIC_VENUE_MODE_DEFAULT + EXPO_PUBLIC_VENUE_MODE_DEFAULT

# 9. Install any missing deps (middleware needs @supabase/ssr)
pnpm install
pnpm typecheck
pnpm test --run --filter @eztrack/web

# 10. Commit + push
git add -A
git commit -m "L0: scaffold Events Mode (schema, Edge Functions, VENUE_MODE flag, auth port)"
git push -u origin events-mode/L0-foundation
```

After step 10, open a PR against `main` for review. Once merged, register the webhook URLs in Eventbrite + Stripe (URLs are printed in `L0-NOTES.md` §5).

## Architectural locks (DO NOT DEVIATE without surfacing first)

Per plan.md and L0a/L0b sprint decisions:

- **Framework:** Next.js 16 App Router (web) + Expo SDK 54 (mobile). Never Vite/Remix/Pages Router.
- **Backend:** existing eztrack-os Supabase project. Never new infra. Edge Functions for webhook receivers + canonical write paths.
- **Mode flag:** `NEXT_PUBLIC_VENUE_MODE_DEFAULT='security' | 'events' | 'both'` + `EXPO_PUBLIC_VENUE_MODE_DEFAULT`. Per-workspace override stored in `organizations.venue_mode_default`. Per-session override in localStorage.
- **Subdomain:** `track.ezxs.events` (NOT `tonight.ezxs.events` — the year-round venue-ops + event-mode framing supersedes the original "tonight only" framing).
- **Auth:** ezxs-os auth shell (Google · Apple · phone OTP · profile-completion). Email+password legacy `/login` keeps working. **Do not break /login.**
- **Naming:** `org_id` for tenant scope (NOT `workspace_id` — matches eztrack-os existing convention). snake_case for SQL. `created_at`/`updated_at`/`deleted_at` (soft delete). `record_number` text via the existing `next_record_number(prefix)` RPC for human-facing IDs.
- **Multi-day:** every event hub must respect `events.is_multi_day` + `event_days.*` + `tickets.valid_for_days[]` + `event_days.reentry_policy`. Do not write code that assumes single-day.
- **Pixel/scan canonicalization:** every check-in lands in `check_ins` regardless of source (Eventbrite webhook / Stripe / manual / POS / own-scanner). The `checkin-router` Edge Function is the single writer. Do not bypass it.
- **Latency budget:** scan → /live banner ≤ 500ms.
- **Theme — split by mode:**
  - **Security mode** (`(dashboard)/*` route group + every legacy eztrack-os surface): existing eztrack-os iOS 26 tokens (13px base, 36px touch targets). **Do not modify.** This is a live product.
  - **Events mode** (`(events-mode)/*` route group, wall-display app, mobile `(events-mode)/*` screens): **ezxs-settle is the canonical chrome + token source.** Inherits settle's full iOS 26 + Laylo-inspired token sheet (`tokens.css`, `laylo.css`, `sidebar.css`, `mobile.css`, `drilldown.css`, `public.css`, `assistant.css`) and chrome components (`Layout`, `Sidebar`, `MobileNav`, `QuickAddSheet`, `AssistantPanel`, `ThemeToggle`). Imported under `apps/web/src/styles/settle/` and gated to events mode only — wrapped in `[data-venue-mode="events"]` so security-mode pages are untouched.
  - **Both modes** still bump to **44pt minimum** on `/scanner` (v1.5), `/pos`, `/live` quick-action buttons + full-width `#34C759` success / `#EF4444` reject banners on scan results.
- **Style boundary rule:** never reference settle CSS classes (`.app`, `.sidebar`, `.btn-money`, `.stat-card`, etc.) outside `(events-mode)/*` and never reference eztrack-os legacy classes inside it. The two design systems are mutually exclusive per route group.

If a request implies deviation from any of these, surface the lock and ask before proceeding.

## Where the build phases live

```
L0a — Schema + Edge Functions + VENUE_MODE flag + auth shims     (DONE)
L0b — Auth port from ezxs-os                                      (DONE — except L0b-3-tail)
L0b-3-tail — Mobile CountryPhoneInput + welcome.tsx + authStore wiring (TODO)
L0c — Settle CSS bundle dropped at apps/web/src/styles/settle/    (DONE — see styles/settle/README.md; React chrome ports below in L1)
L1  — /live + wall-display + full Eventbrite handler + scaffold (events-mode)/ route group with layout.tsx that:
      • imports "@/styles/settle/index.css"
      • wraps children in <div data-venue-mode="events">
      • ports settle's Layout/Sidebar/MobileNav/QuickAddSheet/AssistantPanel/ThemeToggle React components
        (adapt: react-router-dom → next/link + usePathname; import.meta.env → process.env.NEXT_PUBLIC_*;
         settle's Zustand useStore → track's stores/; APP_BRAND → track-events brand file)
L2  — /pos (Stripe Terminal + Square + cash) + Run-of-show + reframes
L3  — Multi-day editor + re-entry rules + multi-day pass POS + per-day RoS tabs
v1.5 fast-follow — own-scanner, Bluetooth handhelds, DICE/Posh, audit log UI
```

See `TASKS.md` for the full checklist.

## Scope discipline — what's in eztrack-os today vs what we add

eztrack-os ships these modules and they stay as-is or are reframed in events mode:

| Existing eztrack-os | Events Mode role |
|---|---|
| Incidents | Reused (gets `event_id`, `event_day_id` FKs) |
| Personnel + Dispatch | Reframed → unified Staff Console at `/staff` under events mode |
| Briefings | Extended → `/run-of-show` timeline + auto-publish at T-2hr |
| Visitors | Reframed → `/will-call` (linked to `tickets.id`) |
| Patrons | Reframed → `/vip-deny` |
| Lost & Found | Reused (gets `event_id` FK) |
| Work Orders | Reused (gets `event_id` FK) |
| Anonymous Reports | Reused (per-event QR routing) |
| Alerts & Notifications | Reused — Twilio + Slack/Discord wire through here |
| Daily Log, Cases, Vehicles | Security Mode only — hidden in `events`-only mode |

Net-new hubs: `/live`, `/pos`, `/run-of-show` (extends Briefings), wall-display app.

## Cross-product seam contract

When working on `Order`, `Customer`, `Event`, `Ticket`, `CheckIn`, `Staff`, `Shift`, or `Personnel`, remember the data flows downstream:

- **POS sale (track) → Income (settle):** shared `Order` row. Don't shape `Order` in track-specific ways without checking ezxs-settle.
- **Notify-me capture (promote) → will-call (track):** promote writes `customers.tags += 'notify-me:<eventId>'`; track reads it.
- **Incident (track) → post-event survey suppression (promote):** track writes `customers.tags += 'incident:<category>'`.
- **Scan event (track) → on-site upsell rule (promote):** promote subscribes to track's Realtime `event:{id}:checkins` channel.

If a schema change breaks a downstream contract, surface it before applying.

## Verification protocol

After any code change:

1. `pnpm typecheck` from repo root (or per app: `pnpm --filter @eztrack/web typecheck`).
2. `pnpm test --run` for affected workspaces.
3. UI changes: verify light + dark mode, mobile + desktop, security + events mode.
4. Schema changes: `supabase db diff` and confirm RLS on every new table.
5. Edge Function changes: `supabase functions logs <name>` after deploy.
6. Auth flow changes: smoke test `/login` (legacy) AND `/welcome` (new).

## Known issues from initial seed (Cowork sandbox artifacts)

When this repo was seeded, the FUSE mount blocked file deletion. Two harmless artifacts may exist:

- `_write_test` at the repo root — `rm -f _write_test`
- `.git/index.lock` — `rm -f .git/index.lock`

The pre-flight script above cleans both.

## Tone

The plan is opinionated. Keep responses opinionated. Surface lock conflicts immediately rather than negotiating. Default to "the plan says X; if you want to deviate, here's what changes."

When pressure-tested decisions appear in the plan (e.g. why we don't lead with Scanner — see plan.md §1 "The pivot"), respect them. Re-deriving the same decisions wastes time.

## Workflow preferences

- UI changes: apply directly. Plan mode only if 5+ files involved or the request is genuinely ambiguous.
- Schema changes: always write a new migration file, never modify a committed one. Even small column adds get their own `00NN_<slug>.sql`.
- New Edge Functions: scaffold under `supabase/functions/<slug>/index.ts` + use `_shared/` helpers. Never duplicate signature verification or service-role client setup.
- New events-domain pages: live under `apps/web/src/app/(events-mode)/<hub>/...` — do NOT add to existing `(dashboard)` route group, which is Security Mode.
- Mobile events-mode screens: live under `apps/mobile/app/(events-mode)/...` once that route group is added in L1. For now, scaffolded screens use the existing `(auth)` group.
- Document each sprint with a sibling `L<n>-NOTES.md` at the repo root — same shape as `L0-NOTES.md` and `L0b-NOTES.md`. Update `TASKS.md` after each commit.

## When in doubt

`plan.md` is the source of truth for product scope and architecture. `TASKS.md` is the source of truth for what's done and what's next. The migrations under `supabase/migrations/` are the source of truth for schema. Read those first, ask second.
