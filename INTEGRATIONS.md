# INTEGRATIONS.md — third-party connection blueprint

Reference doc that maps every third-party integration on the Laylo-style integration roster to **ezxs-track's actual connection mechanics**: what the operator pastes where, what we receive, which Edge Function ingests it, which router handler parses it, and how it lands in our schema.

Read this alongside:
- `supabase/functions/checkin-router/index.ts` — canonical writer of `check_ins` + `tickets` + `orders`
- `supabase/migrations/0031_customers_tickets.sql` — `ticket_source` enum
- `supabase/migrations/0032_orders.sql` — `order_source` enum
- `supabase/migrations/0038_scan_webhooks.sql` — raw inbound webhook log
- `plan.md` — scope locks (the canonical check-in router rule)

---

## Connection-class taxonomy

Every integration falls into exactly one of six connection classes. Pattern, not platform, drives the implementation effort.

| Class | Operator action | What we expose | What we ingest | Examples |
| --- | --- | --- | --- | --- |
| **WEBHOOK_IN** | Paste **our** webhook URL into **their** dashboard | A unique `events.<provider>.ezxs.events/<token>` URL per (org, event) | Their HTTP POST on each fan event | Posh, Eventim, Seated, Universe, Bandsintown, Fandiem, FanVids, FanMoments, Stripe, Shopify |
| **API_KEY_OUT** | Generate a **track API key** in our settings → paste into **their** dashboard | A long-lived bearer token they include on each request | Same shape as WEBHOOK_IN; just a different auth header | SET.live, Tixel, The Ticketing Co., Shotgun, Genni, GetIn, Flite, FanVids (some), Fandiem (some) |
| **API_KEY_IN** | Generate **their API key** in **their** dashboard → paste into **track** settings | A form field that stores the secret (encrypted at rest) | We poll/pull on schedule or on demand | DICE.fm (Ticket holder API token), Tixr (key + secret), Fourvenues (key + secret) |
| **OAUTH** | Click "Connect" → redirect to their OAuth screen → callback lands the access token | OAuth callback URL | Tokens, then poll/subscribe | Eventbrite (current), Weeztix, Shopify (could go either way) |
| **PIXEL** | Embed our pixel JS on **their** checkout page | A `<script>` tag with org-scoped beacon URL | Browser-side pings on checkout success | FEVO, Universe (alt mode), Tixr (alt mode) |
| **COPY_PASTE** | Paste a track URL into their UI; no programmatic flow | A user-visible URL | Nothing (purely outbound) | Linktree |

---

## Per-platform map

Status legend: ✅ shipped · 🟡 scaffolded (enum reserved, handler stub) · ⬜ to-build · ❌ out-of-scope for ezxs-track (Laylo-only)

### Tier 1 — ticketing platforms (the killer flow)

These all write through `checkin-router` → `scan_webhooks` → `tickets` + `orders` + `check_ins`.

#### **Eventbrite** — ✅ shipped (L1)

- **Class:** OAUTH (operator pastes per-event Eventbrite event ID + we hold their OAuth token in `EVENTBRITE_API_TOKEN` Edge secret)
- **Receiver:** `supabase/functions/eventbrite-webhook/index.ts`
- **Signature header:** `x-eventbrite-signature` verified against `EVENTBRITE_WEBHOOK_SECRET`
- **Router branch:** `handleEventbriteWebhook` in `checkin-router/index.ts:109` — handles `attendee.checked_in`, `attendee.updated`, `order.placed`, `order.refunded`, `event.updated`
- **Mapping link:** `events.live_ops_config.eventbrite_event_id` ↔ Eventbrite event ID. Resolved by `resolveEventByEventbriteId`.
- **Operator setup:**
  1. Track → Settings → Integrations → Eventbrite → "Connect"
  2. Sign in to Eventbrite, authorize
  3. On `/events/[slug]`, paste the Eventbrite event ID into the live_ops_config form
  4. In Eventbrite dashboard → Account → Webhooks → add `https://pjxmkliosgfwfbwjycxv.supabase.co/functions/v1/eventbrite-webhook`
  5. Subscribe to: `attendee.checked_in`, `attendee.updated`, `order.placed`, `order.refunded`, `event.updated`
- **Schema landing:** `tickets.source='eventbrite'`, `orders.source='eventbrite'`, `customers.external_ids.eventbrite=<attendee_id>`
- **Operator deferral:** set `EVENTBRITE_WEBHOOK_SECRET` + `EVENTBRITE_API_TOKEN` Edge secrets (see `L0-NOTES.md`)

#### **DICE.fm** — 🟡 scaffolded (v1.5)

- **Class:** API_KEY_IN — DICE issues a **Ticket holder API** access token; operator pastes it into track settings
- **Receiver to build:** `supabase/functions/dice-poll/index.ts` — cron-driven, no webhook from DICE side
- **Auth:** `Authorization: Bearer <DICE_TICKET_HOLDER_TOKEN>` on outbound calls to `https://partners.dice.fm/api/...`
- **Router branch to build:** `handleDicePoll` — fetches `/events/{id}/orders` since last cursor, upserts `tickets` + `orders` + `customers`
- **Mapping link:** `events.live_ops_config.dice_event_id` ↔ DICE event id; new column or jsonb key
- **Operator setup mirror:**
  1. On DICE: company name → Account Settings → Access Tokens → create with **"Ticket holder API"** scope
  2. Track → Settings → Integrations → DICE.fm → paste the access token (write-only field; we encrypt with pgcrypto + service-role-only read)
  3. On `/events/[slug]`, paste DICE event id into live_ops_config
  4. Cron schedules `dice-poll` every 60s while `events.status='live'`
- **Schema landing:** `tickets.source='dice'`, `orders.source='dice'`, `customers.external_ids.dice=<dice_attendee_id>`. Enum already reserved.
- **Owner/scope:** v1.5 fast-follow per `TASKS.md`

#### **Posh** — 🟡 scaffolded (v1.5)

- **Class:** WEBHOOK_IN — Posh pushes "New Order" webhook
- **Receiver to build:** `supabase/functions/posh-webhook/index.ts`
- **Signature:** Posh signs with HMAC-SHA256 in `x-posh-signature` (verify against `POSH_WEBHOOK_SECRET`)
- **Router branch to build:** `handlePoshWebhook` — `order.created` is the primary event; `order.refunded` secondary
- **Mapping link:** `events.live_ops_config.posh_event_id` ↔ Posh event id
- **Operator setup mirror:**
  1. Track → Settings → Integrations → Posh → "Create webhook URL"
  2. Receives `https://pjxmkliosgfwfbwjycxv.supabase.co/functions/v1/posh-webhook?org_id=…`
  3. On Posh: dashboard → Settings → Webhooks → paste URL, toggle "New Order" on, save
  4. Confirm green status on track once first ticket flows
- **Schema landing:** `tickets.source='posh'`, `orders.source='posh'`, `customers.external_ids.posh=<posh_user_id>`. Enum already reserved.
- **Owner/scope:** v1.5 fast-follow

#### **Tixr** — ⬜ to-build

- **Class:** API_KEY_IN (CPK + private key) **plus** WEBHOOK_IN (notification channel they call "Notifications")
- **Receivers to build:**
  - `tixr-webhook/index.ts` (inbound notifications)
  - `tixr-poll/index.ts` (catch-up reconciliation)
- **Auth:** Tixr signs every API call with HMAC; their webhook also includes a signature header
- **Router branch to build:** `handleTixrWebhook` — `order.completed`, `order.refunded`, `attendee.checked_in`
- **Mapping link:** `events.live_ops_config.tixr_event_id` ↔ Tixr event id (called "Channel" + "Group")
- **Operator setup mirror:**
  1. Track → Settings → Integrations → Tixr → reveal **CPK** + **Private Key** + **Webhook URL**
  2. On Tixr: dashboard → Channel → Add Channel ID + secret; Notifications → add webhook URL + select event types (Order / Refund)
  3. Tixr's "Custom Forms" should include an **SMS opt-in checkbox** if you want to capture phone number consent at checkout (mirrors Laylo's recommendation; we land it in `customers.sms_opt_in_at`)
- **Schema landing:** Need to add `'tixr'` to `ticket_source` + `order_source` enums (next migration). `customers.external_ids.tixr=<tixr_user_id>`.
- **Priority:** medium (large in NA EDM scene)

#### **Eventim** — ⬜ to-build

- **Class:** WEBHOOK_IN (Eventim pushes purchase data)
- **Receiver to build:** `eventim-webhook/index.ts`
- **Auth:** Eventim's "Integration Settings" permission gates webhook config; the webhook itself is signed
- **Router branch to build:** `handleEventimWebhook` — primary path is `order.placed` since Eventim's check-in flow lives outside Laylo's scope. Track also wants `attendee.checked_in` if Eventim emits it (some markets do).
- **Mapping link:** `events.live_ops_config.eventim_event_id`
- **Operator setup mirror:**
  1. On Eventim: dashboard → Users → toggle **"Integration Settings"** permission for the operator
  2. Track → Settings → Integrations → Eventim → reveal webhook URL
  3. On Eventim: install Laylo-style integration → paste track webhook URL
- **Schema landing:** Add `'eventim'` to enums. `customers.external_ids.eventim=<eventim_customer_id>`.
- **Priority:** low for NA, high for EU

#### **Universe** — ⬜ to-build

- **Class:** WEBHOOK_IN (also offered as PIXEL alt; we prefer webhook for consistency)
- **Receiver to build:** `universe-webhook/index.ts`
- **Router branch to build:** Universe is owned by Ticketmaster but uses its own webhook shape; standard `order.placed` + `order.refunded`
- **Mapping link:** `events.live_ops_config.universe_event_id`
- **Operator setup mirror:**
  1. Track → Settings → Integrations → Universe → reveal webhook URL
  2. On Universe: dashboard → Webhook Settings → add URL → save
- **Schema landing:** Add `'universe'` to enums.
- **Priority:** low (overlaps with Eventbrite which dominates NA)

#### **Shotgun** — ⬜ to-build

- **Class:** API_KEY_OUT (track issues a key, paste on Shotgun)
- **Receiver to build:** Shotgun calls track's `shotgun-webhook` endpoint with our key as bearer auth
- **Router branch to build:** `handleShotgunWebhook` — `order.placed`, `order.refunded`, `attendee.checked_in`
- **Mapping link:** `events.live_ops_config.shotgun_event_id`
- **Operator setup mirror:**
  1. Track → Settings → Integrations → Shotgun → "Generate API Key" → copy
  2. On Shotgun: Settings → Integration Settings → paste track key → save
- **Schema landing:** Add `'shotgun'` to enums. EU/electronic music scene.
- **Priority:** low for NA

#### **The Ticketing Co.** — ⬜ to-build

- **Class:** API_KEY_OUT
- **Receiver to build:** Same shape as Shotgun (bearer-auth inbound webhook)
- **Operator setup mirror:**
  1. Track → Settings → Integrations → The Ticketing Co. → "Generate API Key"
  2. On Ticketing Co.: Integration Settings → paste track API key → save
- **Schema landing:** Add `'ticketing_co'` to enums.
- **Priority:** low (small platform)

#### **Weeztix** — ⬜ to-build (EU)

- **Class:** OAUTH (Weeztix uses an OAuth2 flow; operator clicks "Log in" → redirected to Weeztix → returns)
- **Receiver to build:** Standard OAuth callback at `/api/integrations/weeztix/callback` + a `weeztix-poll` worker that pulls orders since last cursor
- **Schema landing:** Add `'weeztix'` to enums. Required: ticket setup webhook config on Weeztix side ("Required for Proper Tracking" — operator must set the right product fields in Weeztix for the ticket data to flow correctly).
- **Priority:** low for NA

#### **Fourvenues** — ⬜ to-build (EU/Spain)

- **Class:** API_KEY_IN (track + Fourvenues exchange keys both ways — bidirectional)
- **Operator setup mirror:**
  1. Track → Settings → Integrations → Fourvenues → "Create API Keys" → copy public + private
  2. On Fourvenues: paste both keys
- **Schema landing:** Add `'fourvenues'` to enums.
- **Priority:** low for NA

#### **Tixel** — ⬜ to-build (resale)

- **Class:** API_KEY_OUT (Tixel posts to track via our key)
- **Distinct from primary ticketing:** Tixel is **resale only**. The ticket already exists from a primary source; Tixel webhook tells us the new owner.
- **Router branch to build:** `handleTixelTransfer` — looks up the existing `tickets` row by `external_id`, updates `customer_id` to the new owner, sets `state='transferred'`, leaves `valid_for_days[]` untouched.
- **Schema landing:** No new enum value (keep original source); add `customers.external_ids.tixel=<tixel_user_id>` + `tickets.metadata.transferred_via='tixel'`.
- **Priority:** low (resale is rare for indie ops; high for festivals)

#### **FEVO** — ⬜ to-build

- **Class:** PIXEL — group-buy + bundle-sale specialist; emits browser-side pings on checkout success
- **Receiver to build:** `fevo-pixel/index.ts` — simple HTTP POST endpoint that takes `{event_id, fan_email, ticket_count}` and writes a soft `tickets` row + `orders` row marked `metadata.source_pixel='fevo'`
- **Schema landing:** Add `'fevo'` to enums. Pixel data is less reliable than webhook, so set `tickets.metadata.confidence='pixel'`.
- **Priority:** low

### Tier 2 — non-ticketing fan signal sources (different write path)

These don't write `tickets` or `orders` — they update `customers` (CRM-side) or `check_ins` (door-side).

#### **SET.live** — ⬜ to-build (could land on `check_ins`)

- **Class:** API_KEY_OUT
- **Track interpretation:** SET.live runs door check-in. Their event "fan checked in" is exactly our `check_ins` row. Different from ticketing webhooks because there's no prior ticket — SET.live is the source of truth for the door event.
- **Receiver to build:** `setlive-webhook/index.ts` → calls `checkin-router` with `source: 'setlive_webhook'`
- **Router branch to build:** `handleSetliveWebhook` — creates a synthetic `tickets` row with `source='setlive', external_id=<setlive_id>` if no prior ticket exists, then writes the `check_ins` row through the canonical path. This keeps every check_in routed through one writer.
- **Operator setup mirror:**
  1. Track → Settings → Integrations → SET.live → "Create API Key"
  2. On SET.live: Settings → Integrations → Laylo tile → "Connect to track" (operator pastes track API key)
- **Schema landing:** Add `'setlive'` to `ticket_source` enum.
- **Priority:** medium (unique value: door check-in without selling them a ticket first)

#### **Seated, Bandsintown, FanVids, FanMoments, Genni, GetIn, Flite, Fandiem, UMG UK** — ❌ out-of-scope

These are **fan-marketing CRM** integrations: opt-in widgets, fan content collection, presale signups. They don't produce tickets, orders, or check-ins. They produce *customer rows with marketing-source tags*.

For ezxs-track (event-day live ops), these are out of scope. They belong on **ezxs-promote** (the pre-event marketing wedge) which is a separate sibling product.

If we ever want any of them on the track side, the integration is uniform:
- WEBHOOK_IN endpoint that does only `customers` upsert + `customers.tags += 'opt-in:<provider>:<event_id>'`
- No `tickets` / `orders` / `check_ins` writes

That's the cross-product seam in `CLAUDE.md`: "Notify-me capture (promote) → will-call (track)". Promote owns these integrations; track reads `customers.tags` to surface relevant fans.

### Tier 3 — commerce / pos (separate from ticketing)

#### **Stripe** — 🟡 scaffolded (skeleton in checkin-router; full handler L2)

- **Class:** WEBHOOK_IN (we're already a Stripe app)
- **Receiver:** `supabase/functions/stripe-webhook/index.ts`
- **Signature header:** `stripe-signature` verified against `STRIPE_WEBHOOK_SECRET`
- **Router branch:** `handleStripeWebhook` — TODO list in `checkin-router/index.ts:316`:
  - `terminal.reader.action_succeeded` → POS auto-checkin (Stripe Terminal)
  - `checkout.session.completed` → online presale, no auto-checkin
  - `charge.refunded` → mark `orders.status='refunded'`, leave `check_ins` alone
- **Schema landing:** `tickets.source='stripe_checkout'`, `orders.source='stripe_checkout' | 'pos_stripe_terminal'`. Enums already reserved.
- **Operator setup:** set `STRIPE_WEBHOOK_SECRET` + Stripe API key as Edge secrets

#### **Square** — 🟡 scaffolded (enum reserved, handler not yet written)

- **Class:** WEBHOOK_IN
- **Receiver to build:** `square-webhook/index.ts`
- **Distinct from Stripe:** Square Terminal is the alternate POS hardware; same auto-checkin contract as Stripe Terminal but different webhook event names (`payment.created`, etc.)
- **Schema landing:** `orders.source='pos_square_terminal'`. Enum reserved.

#### **Shopify** — ⬜ to-build (merch)

- **Class:** OAUTH (Shopify Admin API + Shopify-managed webhook subscription)
- **Distinct from ticketing:** Shopify orders are **merch**, not tickets. They don't get auto-checkin. They do feed `orders` table for revenue reconciliation with ezxs-settle.
- **Schema landing:** `orders.source='shopify'`, no `tickets` row. `orders.metadata.shopify_order_number=<num>`.
- **Operator setup mirror:** install track app from Shopify App Store → OAuth back → track auto-subscribes to webhooks via Admin API
- **Priority:** medium (track's primary commerce surface is /pos, not Shopify; but reconciling merch into the same `orders` table is valuable for settle)

#### **Merchtable** — ❌ out-of-scope

Merch fulfillment, no event-day ops surface.

### Tier 4 — outflow only (we don't ingest)

#### **Linktree** — COPY_PASTE only

Operator pastes their public track event/profile URL into a Linktree button. Zero programmatic flow on the track side — we just need the public URLs to be stable + share-friendly (e.g. `https://track.ezxs.events/e/<slug>`).

**Status:** ✅ public event URLs already exist via `(events-mode)/events/[slug]/page.tsx`. No track-side work needed.

#### **Instagram DMs and Comments** — ❌ out-of-scope (Laylo wedge)

Laylo's distinctive wedge: handle Instagram DM signups + comment-based drop announcements. Belongs on **ezxs-promote** (marketing product), not track (ops product).

#### **UMG UK** — ❌ out-of-scope

Label-specific data feed; not relevant for venue/event ops.

---

## What needs to land in code

### Schema migrations (when we ship Tier 1 platforms)

```sql
-- Next migration: 0115_ticket_source_extensions.sql
ALTER TYPE ticket_source ADD VALUE 'tixr';
ALTER TYPE ticket_source ADD VALUE 'eventim';
ALTER TYPE ticket_source ADD VALUE 'universe';
ALTER TYPE ticket_source ADD VALUE 'shotgun';
ALTER TYPE ticket_source ADD VALUE 'ticketing_co';
ALTER TYPE ticket_source ADD VALUE 'weeztix';
ALTER TYPE ticket_source ADD VALUE 'fourvenues';
ALTER TYPE ticket_source ADD VALUE 'fevo';
ALTER TYPE ticket_source ADD VALUE 'setlive';

ALTER TYPE order_source ADD VALUE 'tixr';
ALTER TYPE order_source ADD VALUE 'eventim';
ALTER TYPE order_source ADD VALUE 'universe';
ALTER TYPE order_source ADD VALUE 'shotgun';
ALTER TYPE order_source ADD VALUE 'ticketing_co';
ALTER TYPE order_source ADD VALUE 'weeztix';
ALTER TYPE order_source ADD VALUE 'fourvenues';
ALTER TYPE order_source ADD VALUE 'fevo';
```

### Per-platform secrets table (encrypted)

A new table to hold operator-pasted API keys for the API_KEY_IN class. Service-role-only access; pgcrypto-encrypted columns for the secret values.

```sql
-- Next migration: 0116_integration_credentials.sql
create table public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,           -- 'dice', 'tixr', 'fourvenues', 'shopify', ...
  label text,                       -- operator-friendly nickname
  encrypted_secret bytea,           -- pgcrypto sym encryption
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (org_id, provider, label)
);
alter table public.integration_credentials enable row level security;
-- Only service_role can read encrypted_secret (Edge Functions use it via getServiceRoleClient).
-- Org members can see provider + label + created_at via a view that omits the secret.
```

### Operator UI surface

A `/integrations` page under `(events-mode)` that:
- Lists every supported provider with a status pill (connected / pending / disconnected)
- For WEBHOOK_IN providers, shows the webhook URL with a "Copy" button
- For API_KEY_OUT providers, has a "Generate key" button + copy
- For API_KEY_IN providers, has a paste field that calls a Postgres RPC to encrypt + store
- For OAUTH providers, has a "Connect with X" button that kicks off the OAuth flow

This page mirrors Laylo's `Settings → Integrations`. It's the next operator UI deliverable — currently track has no integrations UI.

### Edge Function scaffolds

For each Tier-1 platform we ship, the function pattern is:

```
supabase/functions/<provider>-webhook/index.ts
```

Mirroring `eventbrite-webhook`:
1. Verify signature → write to `scan_webhooks` row with `provider=<slug>` + raw payload
2. Invoke `checkin-router` with `source: '<provider>_webhook' + scan_webhook_id`
3. `checkin-router` adds the matching `handleXxxWebhook` branch that resolves the event/ticket and writes via `writeTicketScan`

The router gives us idempotency (scan_webhooks PK on `(provider, external_event_id)`) + replayability (replay any `scan_webhooks` row).

---

## Priority order for ezxs-track

Driven by NA event-day ops, not Laylo's marketing-CRM ranking:

1. **Eventbrite** — ✅ shipped (NA dominant)
2. **DICE.fm** — 🟡 v1.5 (electronic / underground)
3. **Posh** — 🟡 v1.5 (NA nightlife)
4. **Stripe Terminal** — finish handler in L2
5. **Tixr** — large in NA EDM, worth a sprint
6. **Square Terminal** — POS hardware parity with Stripe
7. **Set.live** — door check-in fills a unique gap
8. **Universe** — only if a customer asks (Eventbrite-owned)
9. **Shopify** — merch reconciliation into ezxs-settle
10. **Eventim / Weeztix / Shotgun / Fourvenues** — EU build later

Everything else (Bandsintown, Seated, FanVids, FanMoments, Genni, Flite, Fandiem, UMG UK, Instagram DMs, Linktree marketing) belongs on **ezxs-promote**, not track. The cross-product seam (`customers.tags`) is the contract.

---

## What changed in track to support all of this

Today track ships with these integration-relevant pieces:

- ✅ `checkin-router` Edge Function with `eventbrite_webhook` + `stripe_webhook` (skeleton) + `qr_scanner` / `manual_lookup` / `pos_auto_checkin` direct paths
- ✅ `scan_webhooks` table with provider-agnostic shape + idempotency
- ✅ `tickets.source` + `orders.source` enums covering Eventbrite, DICE, Posh, Stripe Checkout, Shopify, Square, POS variants, manual, comp
- ✅ `customers.external_ids` jsonb that namespaces per-provider IDs
- ✅ `email_outbox` table + `email-send` Edge Function for any inbound that needs to fan out a confirmation email
- ✅ `notification_rules` editor at `/notification-rules` for routing capacity_threshold / ros_publish / etc. — including `eventbrite_webhook_failed` already wired

What we'd add for each new platform is **incremental + uniform**: one migration to extend the enum, one Edge Function for the receiver, one router branch in `checkin-router`, and one row in the `/integrations` UI surface.
