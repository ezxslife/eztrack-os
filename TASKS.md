# ezxs-track — Build TASKS

> Live tracker. Updated each round. Sub-sprints land on `events-mode/L?-<slug>` branches off `main`.

## L0 — Foundation

### L0a — Schema + Edge Functions + VENUE_MODE flag + auth shims
- [x] Clone eztrack-os `main` into ezxs-track folder
- [x] supabase/migrations 0001–0100 (events domain + RLS + Realtime)
- [x] supabase/functions: eventbrite-webhook, stripe-webhook, checkin-router (skeleton)
- [x] apps/web venue-mode lib + hook
- [x] apps/web supabase shim modules (client/server/middleware)
- [x] apps/web root proxy (session refresh; Next.js 16 replacement for middleware)
- [x] apps/web api/hooks (useAuth, useRequireAuth, useOrganization)
- [x] .env.example.events-mode + L0-NOTES.md
- [x] Apply migrations 0001→0100 to eztrack-prod (`pjxmkliosgfwfbwjycxv`) via Supabase MCP — 13 migrations registered
- [x] Deploy Edge Functions to eztrack-prod via MCP (eventbrite-webhook v1, stripe-webhook v1, checkin-router v1)
- [x] Append events-mode env vars to .env.example
- [x] Fix `0037_wall_display_sessions.sql` — Postgres rejected `now()` in partial-index predicate (must be IMMUTABLE); dropped `expires_at > now()` from index, filter at query time

### L0a — Follow-ups before /live demo
- [ ] **You:** `supabase secrets set EVENTBRITE_WEBHOOK_SECRET=<from Eventbrite app>`
- [ ] **You:** Optional for order/ticket enrichment: `supabase secrets set EVENTBRITE_API_TOKEN=<Eventbrite private token>`
- [ ] **You:** `supabase secrets set STRIPE_WEBHOOK_SECRET=<from Stripe dashboard>`
- [ ] **You:** Optional for manual/cron worker protection: `supabase secrets set CAPACITY_WORKER_SECRET=<random secret>`
- [ ] **You:** Wall-display JWT issuer: `supabase secrets set SUPABASE_JWT_SECRET=<Supabase project JWT secret>`
- [ ] **You:** Subscribe Eventbrite webhook → `POST https://pjxmkliosgfwfbwjycxv.supabase.co/functions/v1/eventbrite-webhook` (actions: `attendee.checked_in`, `attendee.updated`, `order.placed`, `order.refunded`, `event.updated`)
- [ ] **You:** Subscribe Stripe webhook → `POST https://pjxmkliosgfwfbwjycxv.supabase.co/functions/v1/stripe-webhook` (events: `charge.succeeded`, `charge.refunded`, `checkout.session.completed`, `terminal.reader.action_succeeded`)
- [x] Harden new helper functions: add `SET search_path = public` to `refresh_event_multi_day_flag`, `current_event_day`, `refresh_capacity_snapshot` (`0101_function_search_path.sql`)

### Pre-existing tech debt surfaced during L0 verification
- [ ] `packages/api/src/supabase.ts:5–6` — uses `process.env` but `@types/node` is missing from `packages/api/package.json` (broken since initial commit `aae184f`, hidden until L0 verification ran type-check)
- [ ] `apps/mobile` — `@react-navigation/native-stack` is imported by `app/(create)/_layout.tsx`, `src/navigation/native-header-items.tsx`, `src/navigation/stack-screen-options.ts` but missing from `apps/mobile/package.json` (broken since `79e712d` "Overhaul mobile navigation"). Add `@react-navigation/native-stack` to deps.

### L0b — Auth port from ezxs-os
- [x] L0b-1: Port `lib/supabase/auth.ts` (sendPrimaryOTP, verifyOTP, OAuth helpers)
- [x] L0b-1: Web OAuth callback route
- [x] L0b-1: Web OTP callback route
- [x] L0b-1: sessionApiCache module (clearAllApiCache used by signOut)
- [x] L0b-1: middleware.ts dual export (createClient + updateSession)
- [x] L0b-2: Web `(auth)/welcome/page.tsx` (provider picker — Google/Apple buttons wired, finish provider config in L0b-4)
- [x] L0b-2: Web `(auth)/welcome/phone-signin/page.tsx`
- [x] L0b-2: Web `(auth)/welcome/phone-verify/page.tsx`
- [x] L0b-2: Web `(auth)/welcome/profile-completion/page.tsx`
- [x] L0b-3: Mobile `OTPInput.tsx` (port verbatim w/ eztrack-os theme)
- [x] L0b-3: Mobile `lib/auth/otp.ts` (sendPrimaryOTP, verifyPrimaryOTP, completeProfile)
- [x] L0b-3: Mobile `(auth)/phone-signin.tsx`
- [x] L0b-3: Mobile `(auth)/phone-verify.tsx`
- [x] L0b-3: Mobile `(auth)/profile-completion.tsx`
- [x] L0b-3: Mobile `(auth)/_layout.tsx` registers new screens
- [x] L0b-3: Fix mobile typography refs in `phone-signin.tsx`/`phone-verify.tsx`/`profile-completion.tsx` — used Material naming (`titleLarge`/`bodyMedium`) on initial port; eztrack-os uses iOS naming (`title1`/`body`)
- [ ] L0b-3-tail: Mobile `CountryPhoneInput.tsx` (deferred — text entry works in v1; port from ezxs-os when picker UX needed)
- [ ] L0b-3-tail: Mobile `(auth)/welcome.tsx` (deferred — operator can navigate from existing /login)
- [ ] L0b-3-tail: Wire mobile auth flow into existing `useAuthStore` (currently bypasses it; works for OTP but doesn't update authStore listeners)
- [ ] L0b-4: **You:** Set Google OAuth client + Apple Sign-In Service ID, configure Supabase Auth providers (deploy time)
- [ ] L0b-4: Customize Supabase email template "Change Email Address" to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}` for `sendSecondaryOTP` to work
- [ ] L0b-4: Create `images` Supabase Storage bucket + RLS policy for avatar uploads
- [ ] L0b-4: Configure Twilio (or other SMS provider) in Supabase → Auth → Providers → Phone
- [ ] L0b-5: Welcome-animation + get-notified screens (cosmetic — can defer to L1)

## L1 — Live + Wall-display
- [x] /live route (multi-day-aware capacity board, recent scans, door flow)
- [x] Capacity threshold worker (Edge Function or pg_cron)
- [x] Full Eventbrite handler in checkin-router
- [x] apps/wall-display: capacity board + recent scans + door-flow chart
- [x] Wall-display pairing flow (`Settings → Wall Display → Add display`)

## L2 — POS + RoS + Reframes
- [ ] /pos route (Stripe Terminal + Square + cash mode)
- [ ] Auto-checkin toggle wiring
- [ ] /run-of-show route (extends Briefings, timeline editor, T-2hr auto-publish)
- [ ] Visitors → Will-call relabel + ticket FK linkage
- [ ] Patrons → VIP/Deny relabel
- [ ] Personnel + Dispatch → /staff unified surface

## L3 — Multi-day + Polish
- [ ] EventDay editor in event detail
- [ ] Re-entry policy editor
- [ ] Multi-day pass mechanics on POS
- [ ] Per-day RoS tabs + clone-day action
- [ ] Multi-day post-event report

## v1.5 fast-follow (parallelizable)
- [ ] Own scanner: replace `(standalone)/scanner` placeholder with expo-camera
- [ ] Bluetooth handheld scanner support (Linea Pro, Socket Mobile via HID)
- [ ] DICE CSV import + Posh API poll
- [ ] Festival pricing tier ($349 multi-day cap)
- [ ] Audit log UI
- [ ] Onboarding tour for events mode
