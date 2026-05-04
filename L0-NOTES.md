# L0 — Foundation sprint notes

> Status: **scaffolded — needs your hands on a Mac to finish.**
>
> Everything below was added on top of the existing eztrack-os `main` branch
> (last upstream commit `79e712d`, 2026-04-13). Nothing existing was modified —
> only additive files. plan.md is at the repo root.

---

## What landed in L0a (this round)

### Schema (`supabase/migrations/`)

| File | Purpose |
|---|---|
| `0000_BASELINE_README.md` | Placeholder. Tells you to run `supabase db pull` to seed `0000_baseline.sql`. |
| `0001_workspace_venue_mode.sql` | Adds `venue_mode_default` enum + column to the org/workspace table. Auto-detects the table name. |
| `0002_profiles_phone_oauth.sql` | Adds `phone`, `phone_verified_at`, `oauth_providers[]`, `profile_completed_at`, `welcome_seen_at` to `profiles`. |
| `0030_events_event_days.sql` | Core event + per-day model. `events`, `event_days`. Multi-day-aware. Includes `current_event_day(event_id)` helper + `refresh_event_multi_day_flag` trigger. |
| `0031_customers_tickets.sql` | `customers` (fan identities) + `tickets` (canonical record from any provider). |
| `0032_orders.sql` | `orders` + `order_line_items`. Source-of-truth for ezxs-settle Income. |
| `0033_check_ins_capacity_snapshots.sql` | `check_ins` (canonical scan record) + `capacity_snapshots` + `refresh_capacity_snapshot` trigger. |
| `0034_shift_assignments.sql` | `run_of_show`, `ros_slots`, `checklist_items`, `shift_assignments`. Soft-links to existing `personnel` and `briefings`. |
| `0035_staff_event_grants.sql` | Scoped door-staff permissions per event + `has_event_permission()` RLS helper. |
| `0036_incident_escalation_rules.sql` | Rules table layered on top of existing eztrack-os incidents. |
| `0037_wall_display_sessions.sql` | Short-lived paired sessions for kiosk capacity boards. |
| `0038_scan_webhooks.sql` | Raw inbound webhook log with idempotency on `(provider, external_event_id)`. |
| `0099_rls_events.sql` | RLS on every new table. Adds `is_org_member()` helper. |
| `0100_realtime_publication_events.sql` | Adds new tables to `supabase_realtime` publication. |

### Edge Functions (`supabase/functions/`)

| Function | Purpose |
|---|---|
| `_shared/supabase.ts` | Service-role client. |
| `_shared/cors.ts` | CORS preflight helper. |
| `_shared/signature.ts` | HMAC verification for Eventbrite, Stripe, Square. |
| `eventbrite-webhook/index.ts` | Receives Eventbrite webhooks. Logs raw to `scan_webhooks`. Dispatches to `checkin-router`. |
| `stripe-webhook/index.ts` | Receives Stripe webhooks. Same pattern. |
| `checkin-router/index.ts` | **Canonical writer.** Skeleton in L0; full Eventbrite handler lands in L1, Stripe handler in L2. Direct-scan path (own-scanner / manual lookup / POS auto-checkin) is fully implemented including re-entry policy logic. |

### Web app (`apps/web/src/`)

| File | Purpose |
|---|---|
| `lib/venue-mode.ts` | VenueMode type, resolution order, localStorage helpers. |
| `hooks/useVenueMode.ts` | React hook for the current effective venue mode. |
| `lib/supabase/client.ts` | Shim around existing `getSupabaseBrowser()` matching ezxs-os API. |
| `lib/supabase/server.ts` | Shim re-exporting existing `createClient()`. |
| `lib/supabase/middleware.ts` | NEW — session-refresh middleware (eztrack-os didn't have one). |
| `middleware.ts` | NEW — wires the session-refresh middleware. |
| `lib/api/hooks.ts` | `useAuth`, `useRequireAuth`, `useOrganization` hooks ported from ezxs-os. |

### Other

| File | Purpose |
|---|---|
| `.env.example.events-mode` | New env vars introduced by Events Mode. Merge into `.env.example` + `.env.local`. |
| `supabase/README.md` | Schema + Edge Functions index. |
| `plan.md` | Full Events Mode build plan (already in repo). |

---

## What you need to do on your Mac

### 1. Make a feature branch and stash plan + L0 work

The Cowork sandbox can write but not delete on the FUSE mount, so I couldn't
run git operations from here. Before pushing anything, set the local branch up:

```bash
cd /Users/rostam/Desktop/Projects/Sauce/ezxs-track

# Sanity check: should show the new files as untracked
git status

# Remove the placeholder file from earlier permissions test (harmless)
rm -f _write_test

# Configure git identity if not already set
git config user.name "Shawn"
git config user.email "support@ezxs.events"

# Create the L0 branch
git checkout -b events-mode/L0-foundation

# Stage everything new
git add plan.md L0-NOTES.md .env.example.events-mode \
        supabase/ \
        apps/web/src/lib/venue-mode.ts \
        apps/web/src/hooks/useVenueMode.ts \
        apps/web/src/lib/supabase/ \
        apps/web/src/lib/api/ \
        apps/web/src/middleware.ts

git status
```

### 2. Snapshot the live schema as the baseline

```bash
# Install Supabase CLI if needed
brew install supabase/tap/supabase

# Link to your existing eztrack-os project — find the project ref in the
# Supabase dashboard URL (the part before .supabase.co)
supabase link --project-ref <YOUR_PROJECT_REF>
# Prompts for the database password

# Pull the live schema as the baseline
supabase db pull -f supabase/migrations/0000_baseline.sql

# Inspect — should include profiles, personnel, dispatches, incidents, etc.
git diff --stat supabase/migrations/0000_baseline.sql

# Once you're happy, drop the placeholder
rm supabase/migrations/0000_BASELINE_README.md
git add supabase/migrations/0000_baseline.sql
git rm supabase/migrations/0000_BASELINE_README.md
```

### 3. Apply the new migrations to your live project

```bash
# Dry-run first
supabase db push --dry-run

# Apply
supabase db push

# Confirm new tables exist
supabase db diff
```

If `0001_workspace_venue_mode.sql` fails with the
"Could not find the org/workspace table" exception, edit that migration to
reference your actual org table name (probably `organizations` or `orgs`),
re-run.

### 4. Set Edge Function secrets

```bash
supabase secrets set EVENTBRITE_WEBHOOK_SECRET=<from Eventbrite app>
supabase secrets set STRIPE_WEBHOOK_SECRET=<from Stripe dashboard>
# Service role + URL are auto-provided
```

### 5. Deploy the Edge Functions

```bash
supabase functions deploy eventbrite-webhook --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy checkin-router
```

Subscribe in providers:

- **Eventbrite app webhook:** `POST https://<project>.supabase.co/functions/v1/eventbrite-webhook`
  - Actions: `attendee.checked_in`, `attendee.updated`, `order.placed`, `order.refunded`, `event.updated`
- **Stripe webhook endpoint:** `POST https://<project>.supabase.co/functions/v1/stripe-webhook`
  - Events: `charge.succeeded`, `charge.refunded`, `checkout.session.completed`, `terminal.reader.action_succeeded`

### 6. Merge env vars

```bash
# The .env.example.events-mode file lists the new vars. Append them to
# both .env.example and .env.local.
cat .env.example.events-mode >> .env.example
# Edit .env.local manually to set your local values
```

### 7. Install Next.js middleware deps if missing

```bash
cd apps/web
pnpm add @supabase/ssr  # if not already present
cd ../..
```

The new `apps/web/src/middleware.ts` requires `@supabase/ssr`. eztrack-os
already lists it in the `@eztrack/api` package per the existing patterns,
but verify with `pnpm why @supabase/ssr` from the repo root.

### 8. Commit + push

```bash
git add -A
git commit -m "L0: scaffold Events Mode (schema, Edge Functions, VENUE_MODE flag, auth shims)"
git push -u origin events-mode/L0-foundation
```

Open a PR against `main`. Ship after manual review.

---

## What's intentionally NOT in L0a

These land in subsequent sub-sprints:

### L0b (auth port completion)
- Full ezxs-os `(auth)/AuthShell.tsx` + multi-step welcome → google/apple/phone-OTP → profile-completion flow
- Mobile `(auth)/` 8-screen flow port
- OAuth callback routes (`app/auth/callback/route.ts`, `app/auth/otp/callback/route.ts`)
- Demo-mode preservation: existing `NEXT_PUBLIC_DISABLE_AUTH` flow stays as fallback

### L1 (Live + Wall-display)
- `/live` route (multi-day-aware)
- `apps/wall-display` filled in
- Capacity threshold worker (separate Edge Function or pg_cron job)
- Full Eventbrite ingestion in `checkin-router` (look up Order via Eventbrite API, resolve to canonical Ticket, write CheckIn)

### L2 (POS + RoS + Reframes)
- `/pos` with Stripe Terminal Tap-to-Pay + Square + cash mode
- `/run-of-show` extending Briefings (timeline editor + auto-publish at T-2hr)
- Visitors → Will-call · Patrons → VIP/Deny relabels
- Personnel + Dispatch unified at `/staff`

### L3 (Multi-day + polish)
- EventDay editor in event detail
- Re-entry policy editor
- Multi-day pass mechanics on POS
- Per-day RoS tabs
- Multi-day post-event report

---

## Risks + watch items

1. **`0001_workspace_venue_mode.sql` table-name auto-detect** — fails if your
   org table isn't named `organizations`, `orgs`, or `workspaces`. If it fails,
   the error message tells you what to do.

2. **`is_org_member()` in `0099_rls_events.sql`** — assumes membership via
   `profiles.org_id`. If eztrack-os already has a richer membership model
   (a join table like `org_members`), update the function body in
   `0099_rls_events.sql` BEFORE `supabase db push`.

3. **The existing `auth-actions.ts` + `(auth)/login/page.tsx` are unchanged.**
   Email+password still works. The new auth files live alongside; they don't
   replace anything yet. Full replacement happens in L0b once the OAuth
   provider configs are in place.

4. **No `tickets` ingestion path is hot yet.** Webhooks log to
   `scan_webhooks` but `checkin-router` Eventbrite/Stripe handlers are skeleton-only.
   You won't see canonical CheckIns until L1 lands the Eventbrite path.

5. **Stripe Terminal SDK is not yet wired** in the web app. POS shell lands in L2.

6. **The auto-detected baseline file is ignored by .gitignore**? — confirm
   nothing in `.gitignore` masks `supabase/migrations/`. As of `main`, it
   doesn't, but worth a sanity check.

---

## Verifying L0

Smoke tests once everything is deployed:

```bash
# 1. Hit the Eventbrite webhook with a fake payload (will 401 on signature,
#    but should land in scan_webhooks with signature_valid = false)
curl -X POST https://<project>.supabase.co/functions/v1/eventbrite-webhook \
  -H 'content-type: application/json' \
  -H 'x-eventbrite-signature: sha256=deadbeef' \
  -d '{"api_url":"https://test","config":{"action":"attendee.checked_in"}}'

# 2. Confirm the row landed
psql $(supabase db ssh) -c "select id, provider, event_type, signature_valid, processing_error from public.scan_webhooks order by received_at desc limit 5;"

# 3. Hit checkin-router directly (will 400 on unknown source, but proves it deployed)
curl -X POST https://<project>.supabase.co/functions/v1/checkin-router \
  -H 'authorization: Bearer <SERVICE_ROLE_KEY>' \
  -H 'content-type: application/json' \
  -d '{"source":"foo"}'
```

When L1 lands, the killer demo is: connect Eventbrite OAuth → trigger a real
test scan → see the CheckIn appear + capacity bar move on `/live`.
