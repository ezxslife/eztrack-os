# ezxs-track — Build Plan (Pivot v2, Multi-Day Aware)

> **What this is.** Canonical build plan for **ezxs-track**, the *event-day live operations* product, built as **Events Mode inside the existing `eztrack-os` codebase**. Sibling products: `ezxs-promote` (pre-event) and `ezxs-settle` (post-event).
>
> **Why v2.** v1 was structured around Scanner-as-flagship. Pressure-tested against the reality that 70% of avatar promoters use Eventbrite Organizer / DICE Door / Posh native scanners (free, bundled, sticky) — **scanner-led wedge fails**. v2 leads with the layer above the scanner: multi-platform Live capacity ingestion · POS-with-auto-checkin · Incidents/Dispatch/Briefings (already shipped in eztrack-os).
>
> **What's also new.** v2 must serve **single-day and multi-day events** (festivals, multi-day conferences, residencies, tour stops). This shapes the entire event/ticket/capacity model.
>
> **Self-assessment.** Perfectly engineered for a 4-sprint, 5–6 week shippable wedge that adds Events Mode on top of the existing eztrack-os platform. ~50% smaller scope than v1 because the security/venue-ops platform you already built (Personnel · Dispatch · Briefings · Incidents · Alerts · Realtime · Wall-display shell) is the foundation. The new build is: 3 net-new event hubs (Live · POS · Run-of-show timeline) + an Events Mode flag that reframes 4 existing modules + webhook-first scan ingestion + a multi-day event model.

---

## 1. The pivot — what we lead with

| v1 led with | v2 leads with |
|---|---|
| Scanner ("5 scans in 4 seconds") | **Live** — multi-platform capacity board, ingests scan webhooks from Eventbrite/DICE/Posh/Stripe |
| Per-scan pricing | $99/event flat for the layer + pay-as-you-go for POS/own-scanner |
| Replace native scanner | **Sit above** the native scanner; let Eventbrite keep scanning, we ingest the stream |
| Standalone product | **Events Mode inside eztrack-os**, same auth, same RLS, same Personnel/Dispatch/Briefings/Incidents |
| `tonight.ezxs.events` (event-only framing) | `track.ezxs.events` ("Venue ops year-round. Event mode tonight.") |

### The defensible position

- Eventbrite/DICE/Posh own the **scanner**. Each owns scanning *for their own inventory*.
- Nobody owns the **canonical multi-platform layer** that aggregates scans from all of them, ties them to one capacity bar, one staff console, one incident log.
- That's the wedge. Operator keeps their existing scanner; we read its webhook and write to canonical `CheckIn` rows.
- **Scanner becomes opt-in v1.5** for: multi-platform operators wanting one app, custom-checkout operators with no native scanner (Stripe Checkout, Shopify, bare Square Online), POS-auto-checkin flows (where the POS sale IS the scan).

---

## 2. Brand promise

> *"Connect Eventbrite, DICE, Posh, Stripe Checkout — keep using whatever scanner you already use. We aggregate every scan into one live capacity board, one staff console, one incident log. Take walk-up sales that auto-check-in. Run year-round venue ops the rest of the time."*

**First-win moment.** Operator wires Eventbrite scan webhook in 5 minutes; their next show's capacity bar moves in real time on the manager's iPad in the production trailer with zero changes to door staff workflow.

---

## 3. ICP — single-day AND multi-day

| Trait | Single-day | Multi-day |
|---|---|---|
| Persona | "Alex Chen" promoter; venue manager | Festival producer; conference organizer; multi-night residency promoter; tour ops manager |
| Volume | 4–24 events/year | 1–6 multi-day events/year, often anchoring the calendar |
| Event size | 200–5,000 attendees | 500–25,000 attendees across 2–7 days |
| Door pattern | One push, 30–90 min | Daily door cycles + re-entry across days |
| Ticket types | GA · VIP · Comp | Day-pass · Multi-day pass (wristband) · VIP pass · Single-day VIP upgrade |
| Bleeding question | *"Are we at capacity, where are my staff, is door flow OK?"* | *"What's tonight's capacity vs Saturday's? Who got a wristband on Day 1 and is re-entering Day 2? Is Day-2 staffing covered? What's the rolling P&L across days?"* |
| Anchor price | $99/event flat + pay-as-you-go | $99/day flat + pay-as-you-go (festival pricing tier in v1.5: $349 multi-day cap) |

---

## 4. Scope — IN and OUT

### IN (v1 — 4 sprints, 5–6 weeks)

| Layer | Ships |
|---|---|
| **Net-new hubs (3)** | `/live` (multi-day-aware capacity board) · `/pos` (Stripe Terminal Tap-to-Pay walk-ups with auto-checkin) · `/run-of-show` (extends Briefings with timeline + auto-publish at T-2hr) |
| **Reframed hubs (4)** | Personnel + Dispatch → unified **Staff Console** under Events Mode · Visitors → **Will-call** · Patrons → **VIP & Deny list** · Briefings → **Run-of-show + Broadcasts** |
| **Reused as-is (5)** | Incidents · Lost & Found · Work Orders · Anonymous Reports · Alerts & Notifications |
| **Wall-display app** | Capacity board + recent scans + door-flow chart (pulled forward from "planned" — this is the green-room/production-trailer demo asset) |
| **Multi-day event model** | `events.is_multi_day`, `event_days` table, day-pass vs multi-day-pass tickets, re-entry counters per day, per-day capacity & staffing & RoS |
| **Webhook-first scan ingestion** | Edge Function `/api/checkin` accepting Eventbrite `attendee.checked_in`, Stripe Checkout, Square Terminal, manual POS, plus a CSV import path |
| **Live connectors (5)** | Eventbrite (orders + scan webhooks) · Stripe Terminal · Square · Twilio · Slack/Discord |
| **Auth port from ezxs-os** | Google · Apple · phone OTP · profile-completion shell — replaces eztrack-os's email+password-only |
| **Schema migrations checked in** | `0000_baseline.sql` snapshotting the existing live Supabase schema + `0030+` events-domain additive migrations |

### v1.5 (2-week fast-follow, parallelizable)

| Capability | Why |
|---|---|
| **Own scanner** (`expo-camera` + decoder, replaces `(standalone)/scanner` placeholder) | For multi-platform operators wanting one app, and for POS-auto-checkin flows |
| **Bluetooth handheld scanners** (Linea Pro, Socket Mobile via HID) | Professional-grade option |
| **DICE CSV import + Posh API poll** | Eventbrite + Stripe webhook covers ~70% of avatar; DICE/Posh covers the rest |
| **Bluetooth ticket printers** | Venue-specific; not v1 critical |
| **Per-event capacity threshold overrides** | Cohort feedback |
| **Custom incident escalation rule editor** | Hardcoded defaults in v1 |
| **Festival pricing tier ($349 multi-day cap)** | After multi-day usage data |
| **Re-entry rules editor** (count once / count once-per-day / count every / count by tier) | v1 ships count-once-per-day default |
| **Audit log UI** | Backend writes log in v1; UI surfaces in v1.5 |

### OUT (Phase 2+)

Turnstile counter integrations · multi-venue parallel ops (one operator running 2 venues simultaneously) · crowd-density heatmap · voice-driven incident logging · Clover · DICE webhook-based real-time (waiting on DICE API). Anything explicitly in eztrack-os's existing security-ops domain that doesn't anchor to events stays in Security Mode and is invisible inside Events Mode (Cases, Vehicles, full Patron encounter history, Daily Log).

---

## 5. Sidebar IA — Events Mode reveals the event hubs

eztrack-os already ships a sidebar with security/venue ops modules. Events Mode toggles via a `VENUE_MODE` switch in the workspace header (or per-event, when the operator picks an active event).

```
┌─ Workspace switcher ─────────────────────────────┐
│  Aurora Sound Collective ▼                       │
│  Mode: [ Security · Events · Both ]              │  ← VENUE_MODE picker
│  Tonight: Skyline · Day 2 of 3                   │  ← active event + day indicator
└──────────────────────────────────────────────────┘

[ + Quick Add ▼ ]                                  (top CTA)

────────────────  EVENTS MODE  ────────────────    (visible when mode includes 'events')

TONIGHT                            ← glows when an event is live
├─ ⚡ Live              /live      ← multi-day-aware command center (NEW)
├─ 💵 POS              /pos       ← walk-up sales, auto-checkin (NEW)
├─ 📅 Run-of-show      /ros       ← per-day timeline (extends Briefings)
├─ 👥 Staff Console    /staff     ← merges Personnel + Dispatch under events lens
├─ ⚠ Incidents        /incidents ← reused
├─ 🎫 Will-call        /will-call ← reframed Visitors
└─ 🚫 VIP & Deny       /vip-deny  ← reframed Patrons

EVENT OPS                          ← always available in events mode
├─ 📦 Lost & Found     /lost-found
├─ 🔧 Work Orders      /work-orders
├─ 🔕 Anonymous Reports /anon-reports
└─ 🔔 Alerts           /alerts

────────────────  SECURITY MODE  ──────────────    (visible when mode includes 'security')

OPERATIONS
├─ 📋 Daily Log
├─ 🗂 Cases
├─ 👤 Patrons (full encounter history view)
├─ 🚗 Vehicles
└─ 📒 Contacts

SHARED                             (always visible)
├─ 📊 Analytics       /analytics
└─ 📑 Reports         /reports

[ ⚛ Ask the assistant ]            (persistent button)

────────────────────────────────── (footer)
⚙ Settings · Guides · Theme
[ Workspace card ]
```

**Mode rules.**
- `VENUE_MODE = 'events'` — Tonight + Event Ops + Shared groups visible. Security group hidden.
- `VENUE_MODE = 'security'` — Security + Shared visible. Events groups hidden.
- `VENUE_MODE = 'both'` — Everything visible. Tonight group glows when an event is live.
- The picker is per-workspace AND per-session (operator can toggle without losing state).

### Mobile

Bottom-bar with the 5 most-used items in current mode. In events mode: ⚡ Live · 💵 POS · [+] Quick Add · 👥 Staff · ⚠ Incidents. Hamburger drawer for the rest.

```
┌─────────────────────────────────────┐
│         (page content)              │
├─────────────────────────────────────┤
│  ⚡    💵    [+]    👥    ⚠         │  ← bottom bar (events mode)
│ Live  POS         Staff  Inc        │
└─────────────────────────────────────┘
```

---

## 6. Multi-day event model — how it threads through every hub

### 6.1 Data shape

An `Event` becomes a container; an `EventDay` is the per-day slot.

```ts
type Event = {
  id: ID;
  workspaceId: ID;
  name: string;
  slug: string;
  isMultiDay: boolean;
  startsAt: ISODate;        // first day's startsAt
  endsAt: ISODate;          // last day's endsAt
  capacity?: number;        // total cap (multi-day passes count once)
  status: 'draft' | 'on-sale' | 'sold-out' | 'live' | 'past' | 'cancelled';
  liveOpsConfig?: { ... };
  // ...
};

type EventDay = {
  id: ID;
  eventId: ID;
  dayIndex: number;         // 1, 2, 3...
  label: string;            // 'Day 1', 'Friday', 'Night 2', 'Conference Day 3'
  date: ISODate;            // YYYY-MM-DD
  startsAt: ISODate;        // doors open
  endsAt: ISODate;          // doors close (may be past midnight)
  capacity: number;         // per-day cap (often === event.capacity for single-day)
  doorOpenAt?: ISODate;
  reentryPolicy: 'count-once-per-day' | 'count-once-per-event' | 'count-every-scan' | 'no-reentry';
  rosId?: ID;               // RunOfShow per day
};

type Ticket = {
  id: ID;
  eventId: ID;
  externalId?: string;      // Eventbrite/DICE/Posh attendee ID
  source: 'eventbrite' | 'dice' | 'posh' | 'stripe-checkout' | 'square' | 'pos' | 'manual' | 'comp';
  customerId?: ID;
  tier: string;             // 'GA', 'VIP', 'Day-1 GA', 'Weekend Pass', etc.
  validForDays: ID[] | 'all';  // EventDay IDs or 'all' for full-event passes
  state: 'valid' | 'used' | 'refunded' | 'transferred' | 'voided';
};

type CheckIn = {
  id: ID;
  workspaceId: ID;
  eventId: ID;
  eventDayId: ID;           // which day this scan is for
  ticketId?: ID;
  customerId?: ID;
  scannedAt: ISODate;
  scannedBy: ID;            // Personnel
  device?: string;
  source: 'eventbrite-webhook' | 'dice-csv' | 'posh-api' | 'stripe-webhook' | 'square-webhook' | 'qr-scanner' | 'manual-lookup' | 'pos-auto-checkin';
  result: 'success' | 'already-scanned' | 'invalid' | 'expired' | 'wrong-day' | 'wrong-event';
  entryNumber: number;      // 1 = first scan today, 2+ = re-entry; bound by reentryPolicy
  location?: string;        // 'Main Gate', 'VIP Entry'
};

type CapacitySnapshot = {
  id: ID;
  eventId: ID;
  eventDayId: ID;           // capacity is per-day
  recordedAt: ISODate;
  sold: number;             // tickets valid for this day
  checkedIn: number;        // unique tickets scanned today
  reentries: number;        // re-entry scans today
  onFloorEstimate: number;
  capacityPct: number;      // checkedIn / eventDay.capacity
};
```

### 6.2 UX threading

| Surface | Single-day | Multi-day |
|---|---|---|
| `/live` header | "Skyline · Tonight" | "Skyline · **Day 2 of 3** · Friday" — day picker dropdown defaults to current day inferred from clock |
| `/live` capacity bar | Single bar | Per-day bar with rolling-event total below; toggle: *Today* / *Total* |
| `/live` recent scans | Last 20 | Last 20 with day pill (D1/D2/D3) on each |
| `/live` door-flow chart | 60-min by minute | 60-min today + 24h-stacked per-day toggle |
| `/scanner` (v1.5) | Single mode | Auto-detects current `EventDay`; flags "wrong day" mismatches as orange banner |
| `/pos` | Tier list | Tier × day matrix when multi-day (Day-1 GA, Day-2 GA, Weekend Pass, etc.); Multi-day passes auto-scan into Day 1 if doors open |
| `/run-of-show` | Single timeline | Tab strip per day (Day 1 · Day 2 · Day 3); per-day shift assignments + checklist; "clone Day-1 to Day-2" action |
| `/staff` | One on-shift list | Per-day shift schedule; on-shift list filtered to today; coverage gaps include "Day 3, 11pm Door 2 = 0 covered" |
| `/incidents` | Chronological | Day pill on each row; filter by day |
| `/will-call` | One list | Per-day pickup status; multi-day-pass holders get a `wristbanded_at_day_id` flag once handed a wristband |
| `/wall-display` | One board | Multi-day rotation OR three-up split (Today big, other days small) |
| Reports / Analytics | One report | Per-day rollup + event-total rollup |

### 6.3 Re-entry handling

`EventDay.reentryPolicy` drives scanner banner behavior:

| Policy | First scan today | Second scan today | Third+ |
|---|---|---|---|
| `count-once-per-day` *(default)* | Green: "CHECKED IN — Day 2" | Yellow: "RE-ENTRY ✓" (counts as reentry, not a new check-in) | Yellow: "RE-ENTRY ✓" |
| `count-once-per-event` | Green: "CHECKED IN" | Yellow: "RE-ENTRY ✓" (regardless of day) | Yellow: "RE-ENTRY ✓" |
| `count-every-scan` | Green: "ENTRY 1" | Green: "ENTRY 2" | Green: "ENTRY N" — each counts as a new check-in (festivals with no exit-tracking) |
| `no-reentry` | Green: "CHECKED IN" | Red: "ALREADY SCANNED" | Red: "ALREADY SCANNED" |

### 6.4 Multi-day pass mechanics

- A `Ticket.validForDays = 'all'` ticket is a multi-day pass.
- First scan on Day 1 marks `wristbanded_at_event_day_id = Day1`.
- Subsequent scans on Day 2/3 are governed by `reentryPolicy`.
- For festivals: typical setup is `validForDays = 'all'` + `reentryPolicy = 'count-once-per-day'`. First scan each day = green check-in for that day; subsequent scans = re-entry.
- POS sale of a multi-day pass at the gate: `validForDays = 'all'`; auto-checkin into current day; remaining days unlocked.

---

## 7. Per-hub spec (events mode)

### 7.1 Live (`/live`) — NEW

The single most-opened screen during an event.

**Header.** Event name · Day-of-event indicator (single-day: "Tonight"; multi-day: "Day 2 of 3 · Friday") · day picker dropdown (multi-day) · clock · mode pill ("Events").

**Components.**
- **Capacity bar** — per-day for multi-day; thresholds (green <75%, yellow 75–90%, red 90+, alert at 100%).
- **Counts row** — Sold (today) · Checked-in (today) · Re-entries (today) · Left.
- **Door-flow chart** — last 60 min by minute; surge banner if `volume > 2× baseline`.
- **On-floor estimate** — checked-in − checked-out (if exit-scan) or just checked-in.
- **Recent scans feed** — last 20 with day pill, source pill (EB / DICE / POSH / Stripe / POS / Manual), result state, auto-scrolling.
- **Quick actions** — Pause sales · Open will-call · Page staff · Log incident.
- **Multi-day rolling totals card** — Total sold across event · Total checked-in across event · Day-by-day pacing.

**Daily-use cadence.** Constantly during an event; never otherwise.

### 7.2 POS (`/pos`) — NEW

Walk-up sales with auto check-in. Stripe Terminal Tap-to-Pay primary; Square Terminal API secondary; cash mode v1.

**Multi-day tier list.** When `event.isMultiDay`, tiers are presented as a matrix (or a tier-then-day picker on phone): Day-1 GA · Day-2 GA · Day-3 GA · Weekend Pass · VIP Day-1 · VIP Weekend, etc.

**Auto-checkin behavior.** Default ON. POS sale → Order + Income (back-flows to ezxs-settle) + CheckIn for the appropriate `EventDay`:
- Single-day: CheckIn into the only day.
- Multi-day with day-pass: CheckIn into that day.
- Multi-day with multi-day-pass: CheckIn into current `EventDay` (inferred from clock vs `EventDay.startsAt`); subsequent days follow re-entry policy.

**Completion modal.** Green checkmark · "Tickets auto-checked in for [Day]" · email-receipt single-field input · optional Bluetooth print.

### 7.3 Run-of-show (`/ros`) — extends Briefings

Tabs per day: Day 1 · Day 2 · Day 3. Each day's tab shows:

- **Timeline editor** — chronological slots (load-in / sound check / vendor arrivals / doors / sets / last-call / load-out). Per-slot description.
- **Per-slot shift assignments** — which Personnel in which role during which window. Pulls from existing eztrack-os Personnel.
- **Coverage check** — auto-validates every role has a Personnel member.
- **Pre-event checklist** — load-in · sound check · radio test · bar setup · ID check training.
- **Auto-publish at T-2hr** — push notifications via existing Alerts hub to every assigned Personnel with their personal schedule + map. Reuses Briefings publish mechanic.
- **Clone day** — "Clone Day-1 to Day-2" duplicates timeline, shifts, checklist; operator edits deltas.

### 7.4 Staff Console (`/staff`) — merges Personnel + Dispatch under events lens

Lifts the existing Personnel + Dispatch surfaces into a single events-anchored view.

- **Broadcast bar** — one-tap Twilio + push (via Alerts hub) to all on-shift staff or to a role group.
- **On-shift list** — every Personnel currently working today (filtered by `Shift.startsAt`/`endsAt` + `EventDay`); status pill (en-route 🟡 / on-shift 🟢 / break 🟠 / off ⚫); role; last-seen; geofence verification.
- **Coverage gaps** — auto-detected uncovered shifts with Reassign + Page-on-call CTAs. Multi-day: surfaces gaps for upcoming days too.
- **Per-day schedule view** — grid of Personnel × time-slots × day; drag-to-reassign in v1.5.
- **Dispatch queue** — existing eztrack-os Dispatch — priority-based call dispatch with officer assignment, anchored to current event.

### 7.5 Incidents (`/incidents`) — reused as-is

eztrack-os's existing Incidents module ships with: full lifecycle, narratives, participants, financials, media. Events Mode adds:
- Day pill on each incident
- `eventDayId` foreign key
- Filter by day
- Post-event report auto-compile (per-day + per-event rollup) — runs at `EventDay.endsAt` for single-day, at last day's `endsAt` for multi-day

### 7.6 Will-call (`/will-call`) — reframed Visitors

Reuses eztrack-os Visitors module (pre-registration, sign-in/out, NDA, badge management). Events Mode adds:
- Linked to `Ticket` rows (tickets flagged `pickup_required` from Eventbrite/Stripe become Visitor records auto)
- Per-day pickup status
- Multi-day-pass holders get a `wristbanded_at_event_day_id` flag once they collect their wristband
- Comp/guest-list capture from `ezxs-promote` notify-me + on-sale flows lands here

### 7.7 VIP & Deny list (`/vip-deny`) — reframed Patrons

Reuses eztrack-os Patrons module (flags, bans, photos, encounter history). Events Mode adds:
- VIP flag (positive)
- Deny flag (negative — surfaces red banner on scanner if their ticket gets scanned)
- Photo lookup from manual will-call screen
- Sync to `ezxs-promote` Audience tags (`vip:event-id`, `deny:reason`)

### 7.8 Reused-as-is

- **Lost & Found** — directly relevant. `eventDayId` foreign key added.
- **Work Orders** — equipment break/fix during show creates a Work Order, not just an Incident. Mic pack 3 dead → Work Order assigned to tech lead.
- **Anonymous Reports** — public submission with admin queue. Each event gets a unique QR pointing at `<handle>.ezxs.events/<event-slug>/report`.
- **Alerts & Notifications** — push/email/SMS already supported. Twilio + Slack/Discord wire through here.
- **Analytics + Reports** — existing infrastructure with event-anchored views added.

### 7.9 Wall-display app

Standalone Expo build (`apps/wall-display` already scaffolded). Shows:
- Multi-day event: 3-up split (Today big · Tomorrow + Day-after small) with auto-rotate option
- Single-day event: full-screen capacity bar + recent scans + door-flow chart
- Auth: Read-only token scoped to one event; QR-code pairing with manager's logged-in session

### 7.10 Settings

| Sub-tab | Purpose |
|---|---|
| Workspace | Name, handle, brand color, role roster, **VENUE_MODE default** |
| Connections | Eventbrite · Stripe Terminal · Square · Twilio · Slack/Discord (single "Connect Eventbrite" card surfaces scan-webhook + order ingestion) |
| Personnel | Master roster — roles, shifts, zones, certifications (existing eztrack-os) |
| Incidents | Category list, escalation rules, auto-assign (existing eztrack-os) |
| Capacity | Default thresholds; per-event-day overrides |
| Re-entry | Default policy; per-event override (`count-once-per-day` default) |
| Hardware | Connected scanners, POS readers, Bluetooth printers |
| Notifications | Push + SMS fallback rules per category (existing Alerts hub) |
| Billing | Plan, payment method, per-event vs flat-rate selection |

---

## 8. Quick Add menu (events mode)

| Item | Action |
|---|---|
| Quick Sale | → `/pos` with default tier preselected for current EventDay |
| Log Incident | → New incident modal scoped to current event/day |
| Page Staff | → Broadcast modal via Alerts hub |
| Add Walk-up (comp) | → Manual will-call entry, comp ticket, optional auto-checkin |
| Add Note | → Event journal (operator's diary), per-day |

5 actions. Quick Sale and Log Incident pin visually.

---

## 9. v1 connectors

| # | Provider | Auth | Reads | Writes | Webhooks |
|---|---|---|---|---|---|
| 1 | **Eventbrite** | OAuth (shared with `ezxs-promote`) | Events, tickets, attendees, orders, refunds, scan events | Promo codes, walk-up sales | `attendee.checked_in`, `attendee.updated`, `order.placed`, `order.refunded`, `event.updated` |
| 2 | **Stripe Terminal** | Stripe Connect | Reader status, terminal payments, refunds | Charges, refunds | `terminal.reader.action_succeeded`, `charge.refunded` |
| 3 | **Square** | OAuth | POS terminal, payments | Charges, refunds | `payment.created`, `payment.updated` |
| 4 | **Twilio** | API key (eztrack-os already supports SMS via Alerts) | SMS history, delivery | SMS broadcasts to Personnel | `message-status` |
| 5 | **Slack / Discord** | Webhook URL | — | Ops channel notifications | — |

**Coming Soon (v1.5):** DICE CSV import · Posh API poll · Boca printer · Linea Pro / Socket Mobile handheld scanners · turnstile counters · MS Teams · weather APIs · venue Wi-Fi sign-on tracking · Clover.

---

## 10. Auth & shell — port ezxs-os into eztrack-os

eztrack-os today: Supabase Auth + email+password only · `profiles` table joined to `auth.users.id` · org-scoped via `org_id` + RLS · demo/wall-mode flag (`NEXT_PUBLIC_DISABLE_AUTH`, `NEXT_PUBLIC_WALL_MODE`).

Port from ezxs-os: the richer auth flow without breaking what's already shipped.

| Module | From `ezxs-os/apps/web/src/lib/` | What we replace in eztrack-os |
|---|---|---|
| Supabase client | `lib/supabase/client.ts` | Replaces `lib/supabase-browser.ts` (similar shape) |
| Supabase server | `lib/supabase/server.ts` | Replaces `lib/supabase-server.ts` |
| Supabase middleware | `lib/supabase/middleware.ts` | New addition (eztrack-os has no session-refresh middleware today) |
| Auth helpers | `lib/supabase/auth.ts` | Adds `sendPrimaryOTP`, `verifyOTP`, OAuth handshakes; replaces `lib/auth-actions.ts` |
| Auth hooks | `lib/api/hooks.ts` | New — adds `useAuth`, `useRequireAuth`, `useOrganization` |
| Auth shell | `app/(auth)/AuthShell.tsx` + `layout.tsx` | Replaces eztrack-os `(auth)/login` with full multi-step flow (welcome → google/apple/phone → OTP → profile-completion → get-notified → welcome-animation) |
| OAuth callbacks | `app/auth/callback/route.ts` + `app/auth/otp/callback/route.ts` | New routes |
| Mobile auth flow | `apps/mobile/app/(auth)/*` | Replaces eztrack-os mobile `(auth)/` with the canonical 8-screen flow |

**Profile extension.** eztrack-os's `profiles` table extends; doesn't break. Existing demo accounts keep working. New columns: `phone`, `phone_verified_at`, `oauth_providers[]`.

**RLS posture preserved.** Existing org-scoped policies stay. **New event-scoped policy** for door staff: `staff_event_grants` (Personnel × Event × permissions[]) — door staff get scoped read on `events.*`, write on `check_ins` only for events they're granted.

**`VENUE_MODE` flag.** New env var: `NEXT_PUBLIC_VENUE_MODE_DEFAULT='security' | 'events' | 'both'`. Per-workspace override stored in `workspaces.venue_mode_default`. Per-session override in localStorage.

---

## 11. Schema concept — extend eztrack-os, don't redefine

### 11.1 What eztrack-os already has (do not redefine)

From the existing live Supabase schema (must be `supabase db pull`'d into `0000_baseline.sql` as the first build action):

`profiles` · `personnel` · `dispatches` · `incidents` · `briefings` · `cases` · `work_orders` · `lost_found` · `patrons` · `visitors` · `vehicles` · `contacts` · `daily_logs` · `anonymous_reports` · `alerts` · `notifications` · `analytics` · `reports` · `settings`.

Plus enums: `case_status`, `incident_status`, `incident_severity`, `dispatch_priority`, `dispatch_status`, `work_order_status`, `lost_found_status`, `daily_log_status`, `patron_flag`.

### 11.2 What we add in Events Mode (events-domain migrations)

```ts
// shared (lift to packages/shared/types.ts)
type Workspace = { /* extend existing — add venue_mode_default */ };
type Customer = { /* new — fan/ticketholder identity, distinct from auth.users */ };
type Event = { /* new — see §6.1 */ };
type EventDay = { /* new — see §6.1 */ };
type Ticket = { /* new — see §6.1 */ };
type Order = { /* new — POS + ticketing-platform orders */ };
type CheckIn = { /* new — see §6.1, unified scan record across providers */ };
type CapacitySnapshot = { /* new — per-day */ };
type ShiftAssignment = { /* new — Personnel × EventDay × time-window × role */ };
type StaffEventGrant = { /* new — Personnel × Event × permissions[] for scoped RLS */ };
type IncidentEscalationRule = { /* new — extends eztrack-os Incidents */ };
type WallDisplaySession = { /* new — read-only paired session for kiosk */ };
type ScanWebhook = { /* new — raw inbound webhook log for debugging + replay */ };
```

### 11.3 Migrations layout

```
supabase/migrations/
├─ 0000_baseline.sql                    # supabase db pull — snapshot existing schema
├─ 0001_workspace_venue_mode.sql        # add workspaces.venue_mode_default
├─ 0002_profiles_phone_oauth.sql        # add profiles.phone, oauth_providers[], phone_verified_at
├─ 0030_events_event_days.sql
├─ 0031_customers_tickets.sql
├─ 0032_orders.sql
├─ 0033_check_ins_capacity_snapshots.sql
├─ 0034_shift_assignments.sql
├─ 0035_staff_event_grants.sql
├─ 0036_incident_escalation_rules.sql
├─ 0037_wall_display_sessions.sql
├─ 0038_scan_webhooks.sql
├─ 0099_rls_events.sql                  # workspace + event-scoped policies for new tables
└─ 0100_realtime_publication_events.sql # publish check_ins, capacity_snapshots, incidents, shift_assignments to Realtime
```

### 11.4 Linkages to existing eztrack-os tables

| Existing eztrack-os table | Linkage in Events Mode |
|---|---|
| `personnel` | `shift_assignments.personnel_id` FK; `staff_event_grants.personnel_id` FK; `dispatches` already supports officer assignment |
| `incidents` | adds `event_id`, `event_day_id` nullable FKs; reuses lifecycle/severity enums unchanged |
| `briefings` | linked from `run_of_show.briefing_id` for the auto-publish-at-T-2hr message |
| `lost_found` | adds `event_id`, `event_day_id` nullable FKs |
| `work_orders` | adds `event_id`, `event_day_id` nullable FKs |
| `anonymous_reports` | adds `event_id` nullable FK; QR routing |
| `patrons` | reused for VIP/Deny; adds `vip_for_event_ids[]`, `deny_for_event_ids[]` |
| `visitors` | reused for Will-call; adds `ticket_id` nullable FK |
| `alerts`, `notifications` | unchanged; events-mode broadcasts ride existing infra |

---

## 12. Backend foundation

What's already in eztrack-os: Supabase Auth · Postgres · RLS · Realtime hooks (`useRealtimeSubscription` + `RealtimeBridge`) · Storage · `next_record_number` RPC · Zod-validated forms.

What we add for Events Mode:

| Component | Tech | Purpose |
|---|---|---|
| Webhook receivers | Supabase Edge Functions per provider with signature middleware | Eventbrite + Stripe + Square inbound |
| Scan ingestion router | Edge Function `/api/checkin` | Accepts internal POSTs (own-scanner v1.5, manual lookup, POS auto-checkin) AND fans out from webhook receivers; writes canonical `CheckIn` rows |
| Realtime publications | Already have the bridge | Add `check_ins`, `capacity_snapshots`, `shift_assignments` to publication |
| Push notification | **Add to existing Alerts hub** — Expo Push (mobile) + web push | Wire Twilio fallback |
| Capacity threshold worker | Postgres trigger + Edge Function | DB trigger on `check_ins` insert evaluates `EventDay.capacity` thresholds; enqueues notification job via existing Alerts hub |
| Incident escalation worker | Postgres function + scheduled Edge | Watches `incidents.status` + `incidents.created_at`; pages handler via Alerts; auto-escalates after N min |
| RoS auto-publish | Scheduled Edge Function | At `EventDay.startsAt - 2h`, fires Briefings publish for each assigned Personnel |
| Token vault | `connections.encrypted_tokens` (pgcrypto) | OAuth tokens, Twilio key, Slack webhook |
| Wall-display pairing | Edge Function | Issues short-lived read-only JWT scoped to one event for kiosk session |

### Real-time architecture

```
QR scan via Eventbrite webhook
  → /api/checkin Edge Function (signature-verified)
  → Looks up Ticket by externalId; resolves to canonical CheckIn
  → Writes CheckIn row with eventDayId, source='eventbrite-webhook', entryNumber
  → Postgres trigger evaluates capacity threshold for that EventDay
  → Realtime publishes 'event:{id}:day:{dayId}:checkins' to subscribers
  → /live (web + wall-display + mobile) updates in <250ms

POS sale via Stripe Terminal
  → /api/pos-charge Edge Function
  → Confirms charge → writes Order + (if autoCheckinAtPos) CheckIn
  → Same downstream as scan
  → Email receipt fires via existing Alerts hub
  → Order back-flows to ezxs-settle for P&L

Capacity threshold breach
  → Trigger evaluates on every CheckIn insert
  → If breach, enqueues notification job
  → Existing Alerts hub fans out push + SMS to on-shift Personnel + manager
  → Banner appears in /live within 1s

Incident logged
  → POST to existing eztrack-os incidents endpoint with event_id + event_day_id
  → Existing escalation worker pages handler
  → If unresolved in N min, escalation job re-pages next-up
```

**Latency budget.** Scan → /live banner ≤ 500ms (relaxed from v1's 250ms because of webhook-source dependency; Eventbrite webhooks land in 100–300ms typical).

---

## 13. AI assistant tools — events mode

Phase-aware tools registered when `VENUE_MODE` includes `'events'`:

| Tool | Behavior |
|---|---|
| `live_status_for_event` | Current capacity %, door flow rate vs baseline, staff coverage status, open incidents — for current `EventDay` |
| `live_status_multi_day` | Per-day capacity rollup, identifies the day-of-week with the steepest pacing or biggest miss |
| `recommend_action_now` | Highest-leverage operator action right now (e.g., *"Day-3 staffing has a 30-min gap at 11pm Door 2 — page on-call"*) |
| `incident_summary_today` | Briefs the operator on every incident in chronological order with resolution status; multi-day version groups by day |
| `staff_coverage_check` | Validates upcoming shift coverage; flags gaps; for multi-day, walks every remaining day |
| `post_event_report` | Auto-compiled report (incidents, scan stats, POS stats, staff hours); per-day + event-total |
| `door_flow_anomaly` | Flags surges or drops vs operator's baseline for similar events; multi-day learns from prior days |
| `wristband_status` | Multi-day pass holders: how many wristbanded on Day 1 vs returning each subsequent day (drop-off proxy) |

Context inheritance — assistant on `/live` auto-includes event + current day + recent scans + open incidents + staff status.

---

## 14. Sprint sequence — 4 sprints, 5–6 weeks

| Sprint | Duration | Ships | Definition of done |
|---|---|---|---|
| **L0 — Foundation** | 1 wk | `supabase db pull` snapshots existing schema as `0000_baseline.sql`. Auth shell ported from ezxs-os (web + mobile). `VENUE_MODE` flag wired. Events-domain migrations 0030–0038 applied. Webhook receiver Edge Function (Eventbrite + Stripe). Scan ingestion router. Capacity threshold worker. Realtime publications added. | New tenant signs up via OTP, lands in events mode (or gets mode picker). Test workspace OAuths Eventbrite. A test scan fires the Eventbrite webhook → CheckIn row written → Realtime publishes → dev client receives event in <500ms. |
| **L1 — Live + Wall-display** | 1.5 wk | `/live` real-time command center with capacity bar (single + multi-day), counts row, door-flow chart, recent-scans feed, quick actions. Multi-day day picker. Capacity threshold push alerts via existing Alerts hub. **`apps/wall-display` v1**: capacity board + recent scans + door-flow chart with paired-session auth. | Operator wires Eventbrite webhook on a real event (single-day). Capacity bar updates within 500ms on every native-Eventbrite scan. Manager's iPad shows wall-display in production trailer. Push fires at 75% threshold. |
| **L2 — POS + Run-of-show + Reframes** | 2 wk | `/pos` with Stripe Terminal Tap-to-Pay + Square + auto-checkin toggle + completion modal with email receipt + multi-day tier matrix. `/run-of-show` extending Briefings — per-day timeline, shift assignments pulled from Personnel, auto-publish at T-2hr, clone-day action. Visitors → Will-call relabel + Ticket FK. Patrons → VIP/Deny relabel + ticket-hold flag. Personnel + Dispatch unified surface at `/staff` under events mode. | Operator runs a single-day event end-to-end: takes 3 walk-up POS sales (each auto-checkins + Income → settle + email receipt), runs RoS published at T-2hr to staff phones, dispatches a staff member, logs an incident — all from one app. |
| **L3 — Multi-day + Polish** | 1 wk | Full multi-day support: `EventDay` editor in event detail, re-entry policies, per-day capacity, multi-day pass mechanics on POS, per-day RoS tabs, multi-day wall-display rotation, post-event report per-day rollup. Audit log writes (UI v1.5). Onboarding tour for events mode. Mobile-web parity polish. | Operator runs a 3-day festival end-to-end: configures 3 EventDays, sells multi-day passes via POS that wristband on Day 1 and re-enter on Day 2/3, runs separate RoS per day with cloned staffing, generates a multi-day post-event report that reconciles to ezxs-settle. |

**Total: 5–6 weeks** to v1 covering single-day AND multi-day. v1.5 fast-follow (own-scanner, DICE/Posh, Bluetooth hardware) adds 2 weeks if pursued.

---

## 15. Pricing

| Tier | Anchor | What's in |
|---|---|---|
| **Founding cohort** (first 25 events) | $0/scan + **$49/event flat** for the layer (Live + RoS + Staff + Incidents + Will-call + VIP/Deny). +$0.50/POS sale only. Locked for 12 months. | Everything in v1 |
| **Standard event** | $99/event flat | Layer + read-only ingestion (Eventbrite webhook, Stripe Checkout) — operator keeps native scanner |
| **Standard + POS** | $99/event + $0.50/POS sale | Adds walk-up sales + auto-checkin |
| **Standard + Own-scanner** (v1.5) | $99/event + $0.50/scan | Adds expo-camera scanner + multi-platform aggregation |
| **Multi-day cap** (v1.5) | $349 flat for the entire multi-day event regardless of day count | Festival/conference pricing |
| **Year-round Venue Ops** (eztrack-os Security Mode) | $X/mo (existing eztrack-os pricing) | Everything in Security Mode + Events Mode included free for events at this venue |
| **Pro** (Phase 2) | $499/event + custom escalation + custom thresholds + dedicated support during event | Standard + Pro features |
| **Enterprise** | Custom | Multi-venue, white-label, custom integrations |

**Pricing principle.** Charge for **actions we take on the operator's behalf** (POS transactions, own-scanner-scans), NOT for actions their existing tooling already handles for free (native scanning). The flat per-event fee is for the canonical layer.

---

## 16. Success criteria — 90 days post-launch

| Metric | Target |
|---|---|
| Founding cohort filled | 25 paying events run |
| Median webhook → /live banner latency | ≤ 500ms |
| Median operator-app-opens during doors | ≥ 10 |
| % of events with POS used | ≥ 50% |
| Median POS sales per event | ≥ 8 |
| % of events with auto-checkin enabled | ≥ 60% |
| Incidents logged per event (median) | ≥ 3 |
| % of events with post-event report generated | ≥ 90% |
| Personnel per event using companion app | ≥ 4 |
| Operator NPS | ≥ 50 |
| Re-book rate within 30 days | ≥ 70% |
| Multi-day events run | ≥ 5 in cohort (proves multi-day model) |
| % of multi-day events with multi-day-pass POS sales | ≥ 40% |
| Connect-to-first-event time | ≤ 30 minutes |

---

## 17. Cross-product seams

| Flow | Direction | Mechanism |
|---|---|---|
| POS sale (track) → Income (settle) | track → settle | Shared `Order` row; `track_pos_sales_view` exposes to settle |
| Scan webhook (track) → recovered-revenue attribution (promote) | track → promote | `CheckIn.ticketId` joins to `ezxs-promote.Order.attribution.sendId` for Money waterfall |
| Notify-me capture (promote) → will-call lookup (track) | promote → track | Promote writes `Customer.tags += 'notify-me:<eventId>'`; track will-call search resolves |
| Incident category (track) → post-event survey suppression (promote) | track → promote | Track writes `Customer.tags += 'incident:medical'`; promote post-event sequence filters |
| Pre-event "you're in!" SMS (promote) → does NOT duplicate scan-success (track) | coordination | Track checks for `Send.sentAt within 12hr` before firing scan-success notification |
| On-site upsell rule (promote) ← scan event (track) | track → promote | Track publishes `event:{id}:checkins` to Realtime; promote `OnSiteUpsellRule` worker subscribes |
| Run-of-show shift hours (track) → labor expense (settle) | track → settle | `ShiftAssignment.endsAt - startsAt × Personnel.hourlyRate` lands as Expense rows in settle on event close |
| Multi-day post-event report (track) → multi-day P&L close (settle) | track → settle | Per-day rollup CSV + per-event total PDF; settle ingests into multi-day event detail |

---

## 18. Architectural notes for build

- **Single-repo posture.** Rename `eztrack-os` → keep public name `ezxs-track` (display) but keep internal repo name `eztrack-os` for git history continuity. New marketing site at `track.ezxs.events`.
- **Framework.** Next.js 16 + React 19 + Tailwind 4 (eztrack-os baseline, unchanged). Expo SDK 54 mobile (eztrack-os baseline, unchanged).
- **Mode flag.** `NEXT_PUBLIC_VENUE_MODE_DEFAULT='security' | 'events' | 'both'`. Per-workspace and per-session override.
- **Folder discipline.** `apps/web/src/lib/events/` for events-mode-only code (cannot import into `lib/security/`); `apps/web/src/lib/shared/` for shared. Lint rule enforces.
- **Auth.** All routes except `(auth)/`, `auth/`, public bio-link/event/anon-report routes require `useRequireAuth` or middleware redirect. Door staff get scoped grants via `staff_event_grants`.
- **Realtime.** Reuse existing `useRealtimeSubscription` + `RealtimeBridge`. Add `check_ins`, `capacity_snapshots`, `shift_assignments` to Realtime publication.
- **Caching.** Existing `useFormState` + Zod patterns reused for create/edit modals on new entities.
- **Theme.** eztrack-os iOS 26 design system (13px base, 36px touch targets) — bump to **44pt minimum** on `/scanner` (v1.5), `/pos`, and `/live` quick-action buttons for outdoor/dim-lighting speed-first surfaces. Full-width #34C759 success / #EF4444 reject banners on scan results.
- **Mobile-first.** Bottom-bar nav with 5 events-mode items. Center [+] = Quick Add.
- **Hardware.** v1 ingest-from-webhook only; no own-scanner. v1.5 phone camera (expo-camera) + Bluetooth HID handhelds.
- **Demo / wall mode flags.** eztrack-os already has `NEXT_PUBLIC_DISABLE_AUTH` and `NEXT_PUBLIC_WALL_MODE` — reuse for kiosk capacity boards.

---

## 19. Open decisions

| Decision | Default | Trigger to revisit |
|---|---|---|
| Repo + branding | Same repo (`eztrack-os` git, `ezxs-track` brand). New domain `track.ezxs.events`. | Marketing review |
| Pricing per event | $99 flat + pay-as-you-go for POS/own-scanner | Founding cohort revenue analysis |
| Multi-day pricing | $99/day in v1; $349 multi-day cap in v1.5 | First festival cohort feedback |
| Re-entry default | `count-once-per-day` | Per-event-type override patterns |
| Webhook-only or also own-scanner v1 | Webhook-only v1; own-scanner v1.5 | Multi-platform operator demand |
| Auth migration timing | L0 — replaces email+password before any other build | Existing eztrack-os user complaints |
| Wall-display priority | L1 — pulled forward from "planned" | If demo asset value confirmed |
| `staff_event_grants` design | Per-event scoped grants with permissions[] | Door staff identity model — opt-in `auth.users` linkage vs QR-only access |
| MVP target operator | TBD — needs customer-discovery pass | First confirmed 2-week test partner |
| DICE / Posh path | CSV import v1.5 only (no real-time webhook from DICE) | DICE API improvements |
| Wall-display authentication | Short-lived read-only JWT from manager session | Multi-display-per-event scaling needs |

---

## 20. TL;DR

- **Pivot.** Lead with the layer above the scanner. Live capacity board + POS + reframed Personnel/Dispatch/Briefings/Visitors/Patrons. Scanner becomes opt-in v1.5.
- **Built on eztrack-os.** Same repo, same Supabase, same auth (extended with ezxs-os multi-method flow), same RLS pattern, same iOS 26 design system.
- **3 net-new hubs** (Live · POS · Run-of-show timeline) + **4 reframes** (Staff Console · Will-call · VIP-Deny · Briefings extended) + **5 reuses as-is** (Incidents · Lost & Found · Work Orders · Anonymous Reports · Alerts).
- **Multi-day native.** `EventDay` model threads through every hub — capacity per-day, RoS per-day, staffing per-day, re-entry policy per-day, post-event report per-day + per-event.
- **Webhook-first scan ingestion.** Eventbrite native scanner stays in place; we read its webhook. Same pattern for Stripe Checkout / Square / DICE-CSV / Posh-API.
- **Wall-display v1** in L1 — production-trailer demo asset.
- **5–6 weeks to v1** across L0 + L1 + L2 + L3.
- **$99/event flat for the layer + pay-as-you-go for actions** (POS, own-scanner). Multi-day cap $349 in v1.5. Year-round venue ops bundle stays.
- **`track.ezxs.events`** — "Venue ops year-round. Event mode tonight."
- **Companion mobile app** (Expo) for staff, reuses ezxs-os mobile chrome.
- **POS sales flow into shared `Order` + `Income`** — track feeds settle for free.
- Build from this doc.
