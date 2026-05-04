# INTEGRATIONS-RESEARCH.md — public-API field notes

Cross-project reference doc. Captures what is **publicly known** (as of May 2026) about the developer surface of every platform on the Laylo integration roster — auth scheme, webhook coverage, signing headers, public-app-program status, rate limits, recent breaking changes, and the gotchas that bite on day one.

Reusable for any sibling project that needs to pull / push fan or ticketing data: ezxs-track (event-day ops), ezxs-promote (pre-event marketing), ezxs-settle (finance / income reconciliation), or anything net-new.

> **Scope of "publicly known"**: Some platforms (DICE, Eventim partner API, Tixel, Genni, FanMoments) lock real docs behind partner login or NDA. Where that's the case the doc says so plainly rather than guessing.

---

## At-a-glance index

| Platform | Class | Public API? | Webhooks | Signing | Public app program |
| --- | --- | --- | --- | --- | --- |
| Eventbrite | OAuth2 | ✅ open | ✅ | `x-eventbrite-signature` (HMAC-SHA256 base64) | ✅ open |
| DICE.fm | Bearer | 🔒 partner-only | ❌ poll-only | n/a | ❌ invite-only |
| Posh | Webhook-only | ❌ no | ✅ outbound | none documented | ❌ Zapier-only |
| Tixr | CPK + HMAC | ✅ application required | ✅ | HMAC-style | ⚠️ application |
| Universe | OAuth2 | ✅ open | ✅ | not documented | ✅ open |
| FEVO | JS SDK + publisher key | 🔒 partner-only | ❌ | n/a | ❌ direct partnership |
| Tixel | Pull-only by partners | ❌ no public API | ❌ | n/a | ❌ partner-only |
| Eventim | OAuth2/OIDC | 🔒 partner-only | ✅ partner-only | not documented | ❌ partner contract |
| Weeztix | Bearer | ✅ on request | ✅ | none (HTTPS only) | ⚠️ request |
| Shotgun | Per-organizer token | ❌ no public docs | ✅ partner-only | not documented | ❌ partner-only |
| Fourvenues | Bearer | ✅ open docs | ✅ | not documented | ⚠️ per-venue |
| The Ticketing Co. | n/a | ❌ no public API | ❌ | n/a | ❌ no program |
| GetIn | unknown | ❌ ambiguous | ❌ | unknown | ❌ partner-only |
| Shopify | OAuth2 | ✅ open | ✅ | `X-Shopify-Hmac-Sha256` (HMAC-SHA256 base64) | ✅ App Store |
| Merchtable | n/a | ❌ no public API | ❌ | n/a | ❌ no program |
| SET.live | n/a | ❌ no public API | ❌ | n/a | ❌ partnership |
| Linktree | n/a | ❌ no public API | ❌ | n/a | 🔒 invite-only |
| Instagram (Meta) | OAuth2 | ✅ open w/ App Review | ✅ | `X-Hub-Signature-256` (HMAC-SHA256 hex) | ✅ App Review |
| Bandsintown | `app_id` query param | ✅ open | ❌ poll-only | n/a | ✅ open (read), partner (write) |
| Seated | n/a | ❌ no public API | ❌ | n/a | ❌ partnership |
| FanVids | n/a | ❌ no public API | ❌ | n/a | ❌ partnership |
| FanMoments | n/a | ❌ no public API | ❌ | n/a | ❌ partnership |
| Genni | n/a | ❌ no public API | ❌ | n/a | ❌ partnership (via Songfluencer) |
| Fandiem | n/a | ❌ no public API | ❌ | n/a | ❌ direct BD |
| Flite | n/a | ❌ no public API | ❌ | n/a | ❌ no program |
| UMG UK | n/a | ❌ inbound only (label-internal) | ❌ | n/a | ❌ no program |

---

## Tier 1 — ticketing platforms

### Eventbrite
- **What it is**: Mainstream public-facing event ticketing platform with strong organizer self-serve tools and the largest third-party integration footprint of the seven platforms.
- **Developer docs URL**: https://www.eventbrite.com/platform/docs (live), with legacy reference at https://www.eventbrite.com/developer/v3/
- **API base URL**: `https://www.eventbriteapi.com/v3/`
- **Auth scheme**: OAuth 2.0 (Authorization Code Grant for user-delegated access). Each app also gets a private OAuth token for first-party use, generated under My Account → Developer → App Management. Public OAuth apps are open to any developer who registers an app and configures a redirect URI — no partner gatekeeping.
- **Webhooks**:
  - Available: yes
  - Signing header: `x-eventbrite-signature`
  - Signature algo: HMAC-SHA256 of the JSON request body, base64-encoded, using a webhook key Eventbrite provisions per webhook
  - Events emitted (organizer-relevant subset): `order.placed`, `order.updated`, `order.refunded`, `attendee.updated`, `attendee.checked_in`, `attendee.checked_out`, `event.created`, `event.updated`, `event.published`, `event.unpublished`, `ticket_class.created/updated/deleted`, `venue.updated`, `organizer.updated`
  - Doc link: https://www.eventbrite.com/platform/docs/webhooks
- **Key REST endpoints**: `GET /events/{event_id}/`, `GET /events/{event_id}/attendees/`, `GET /events/{event_id}/orders/`, `GET /orders/{order_id}/`, `GET /events/{event_id}/ticket_classes/`, `POST /webhooks/`, `GET /users/me/organizations/`. Mutating check-in is done via the `attendee.checked_in` field on Attendee PATCH (undocumented in v3 reference but works via the partner integrations team).
- **Public app program**: Yes — open. Any developer can register an app, get OAuth keys, list at https://www.eventbrite.com/apps/. App marketplace listing requires Eventbrite review, but API access is self-serve.
- **Rate limits**: 1,000 calls per hour per OAuth token; 48,000 calls per day per token.
- **Notable existing integrations**: Zapier, Mailchimp, HubSpot, Salesforce, Constant Contact, Klaviyo, Slack, Webflow, Workato, Google Analytics, Meta Pixel, Squarespace, Wix.
- **Recent platform changes**: In 2020 Eventbrite removed the public Event Search/Discovery API for non-organizer apps — third parties can only query events for orgs they have OAuth access to. Platform branding rolled from `developer.eventbrite.com` (v3 reference) to `eventbrite.com/platform` around 2022–2023. v3 remains the current major version.
- **Quirks / gotchas**: Webhooks fire **per-org**, not per-event — you subscribe at the organization level and filter downstream. Webhook payload is just `{api_url, config, action}`; you must call back to `eventbriteapi.com` to fetch the resource. Long-deprecated endpoints (e.g. legacy v2) sometimes still appear in Google results — confirm in the v3 platform docs. Ticket-tier limits, capacity, and check-in-status all live on the Attendee object, not Order. The "private" personal OAuth token is the right choice for first-party server work; only build the OAuth flow if multi-tenant.
- **Last verified**: May 2026.

### DICE.fm
- **What it is**: Curated mobile-first ticketing platform for live music with no print-at-home tickets and a strong fan-data layer; partner-only integration model.
- **Developer docs URL**: https://partners-endpoint.dice.fm/graphql/docs/index.html (live, behind partner-only API key); secondary REST docs at https://www.dicetickets.com/developers/introduction (the white-label "Dice Tickets" platform — separate B2B SaaS than dice.fm consumer).
- **API base URL**: GraphQL: `https://partners-endpoint.dice.fm/graphql`. White-label REST (Dice Tickets): `https://api.dicetickets.com/v1`.
- **Auth scheme**: Bearer token in `Authorization: Bearer <token>` header. The 40-character API key is generated in MIO (DICE's partner admin tool, "MIO" = the partner backend) and is provisioned only to approved partners — there is no self-serve developer signup.
- **Webhooks**:
  - Available: partner-only — DICE does not publicly document a webhook subscription model. Real-time data is pulled via the GraphQL Ticket Holders API; some integrations (e.g. Audience Republic) appear to use server-side polling.
  - Signing header: not publicly documented
  - Signature algo: not publicly documented
  - Events emitted: not publicly documented as webhooks
  - Doc link: N/A
- **Key REST endpoints**: For Dice Tickets (white-label): create/fetch/update/delete event, fetch tickets sold, scan tickets — base URLs and exact paths require partner access. For the consumer DICE GraphQL: queryable types include `events`, `tickets`, `orders`, `extras`, `returns`, `ticketTransfers`, `genreTypes`, all with cursor pagination and filter operators.
- **Public app program**: No — invite-only. DICE is explicitly a partner-relationship integration model.
- **Rate limits**: Not publicly documented.
- **Notable existing integrations**: Audience Republic (CRM/marketing), Spotify (artist linkage), business-intelligence pipelines via partner BI consumption of the Ticket Holders API. Event-creation widget at https://dice.fm/partners/widget.
- **Recent platform changes**: GraphQL Ticket Holders API positioned as the canonical way for partners to consume fan/order data (vs. earlier CSV exports). DICE expanded to US in 2021 and continues to position itself as anti-bot/anti-resale (no transferable barcodes; tickets activate at venue).
- **Quirks / gotchas**: Identifiers are opaque global Relay-style IDs — query via `node(id:)` or via the typed paginated lists on `viewer`. Fan PII access is read-only and scoped to the partner's own events. No public sandbox; integration testing requires DICE to provision a test event. Names are confusing: `dice.fm` (consumer) vs. `dicetickets.com` (the white-label B2B sister product) vs. `partners-endpoint.dice.fm` (the GraphQL endpoint).
- **Last verified**: May 2026.

### Posh
- **What it is**: Nightlife/party-focused ticketing platform with strong consumer discovery; minimal public developer surface.
- **Developer docs URL**: https://support.posh.vip/en/articles/10723719 and https://university.posh.vip/university/post/a-guide-to-webhooks-at-posh (live, public marketing/help articles only — no formal API reference page).
- **API base URL**: No publicly documented REST API base URL.
- **Auth scheme**: No published API authentication scheme. Webhook configuration is dashboard-only (Settings → API Webhooks). No documented OAuth flow, no key issuance for inbound third-party calls.
- **Webhooks**:
  - Available: yes (outbound only)
  - Signing header: not documented — Posh's help article describes no signing/HMAC mechanism, which means receivers should treat the URL as a shared secret and IP-allowlist if possible.
  - Signature algo: not documented
  - Events emitted: `Order Created` (fires when an attendee completes a paid purchase), `Pending Order Created` (fires when a purchase requires approval before confirmation). Payload includes customer name, ticket type, and payment amount; full schema is shown in-dashboard via "View Example Response Body" but not publicly documented.
  - Doc link: https://support.posh.vip/en/articles/10723719-how-to-receive-real-time-purchase-data-with-webhooks
- **Key REST endpoints**: Endpoints not publicly documented. Posh markets all third-party connectivity through Zapier ("Posh Webhooks by Zapier") rather than direct REST.
- **Public app program**: No — Posh has no developer marketplace. Integrations are routed through Zapier.
- **Rate limits**: Not publicly documented.
- **Notable existing integrations**: Zapier (the primary integration surface), with downstream apps reachable via Zapier (Mailchimp, Klaviyo, HubSpot, Slack, Notion, Sheets, etc.).
- **Recent platform changes**: Webhooks were positioned as a "real-time purchase data" feature in 2024–2025; before that, integrations relied entirely on CSV export. Webhooks gating: "available only on the web version of Posh," and Zapier-side a paid plan is required.
- **Quirks / gotchas**: No signature verification means receivers should rely on URL secrecy + IP allowlist. Only two event types — no event-published, no check-in, no refund webhook documented. Brand collision: "Posh" the events platform is unrelated to "PoshVine" (Indian fintech with `apidocs.poshvine.com`); ignore that namespace when researching.
- **Last verified**: May 2026.

### Tixr
- **What it is**: Direct-to-consumer ticketing for music, festivals, and nightlife with strong promoter tooling; one of the more developer-friendly mid-market platforms.
- **Developer docs URL**: Apiary docs at https://tixrapi.docs.apiary.io/ (live) and https://tixrwebhooks.docs.apiary.io/ (live). Knowledge base at https://support.tixr.com/tixr-api-documentation. API access application: https://www.tixr.com/developers.
- **API base URL**: `https://api.tixr.com/v1`
- **Auth scheme**: API key + secret (CPK = Client Public Key, plus a private secret used to HMAC-SHA256-sign each request). Each request is signed; signatures are passed alongside the CPK on the request. Approval is required: developers apply at tixr.com/developers and Tixr provisions a CPK + secret.
- **Webhooks**:
  - Available: yes (configured in Studio, Tixr's organizer admin)
  - Signing header: webhook signing is mentioned in Tixr's webhook docs but the exact header name is not publicly indexed; receivers should consult the partner-issued spec
  - Signature algo: HMAC-style verification (consistent with the request-signing model on the API side)
  - Events emitted: `order.created`, `order.updated`, `order.refunded`, `fan_transfer.initiated`, `fan_transfer.completed`, `event.published`, `event.updated`
  - Doc link: https://tixrwebhooks.docs.apiary.io/
- **Key REST endpoints**: `/events`, `/groups`, `/orders`, `/fans`, `/fan-transfers`, `/forms`, `/form-submissions`. Standard REST verbs returning JSON.
- **Public app program**: No public marketplace; API access is gated via application but is granted broadly to legitimate partners (it's not invite-only in the DICE sense).
- **Rate limits**: Not publicly documented in the Apiary page; Tixr enforces them server-side and documents per partner.
- **Notable existing integrations**: Shift4 (payments), Square, Mailchimp, Klaviyo, Sendgrid, Meta Pixel, Google Analytics, Snowflake exports for enterprise, white-label promoter tools.
- **Recent platform changes**: Tixr published an OpenAPI specification (per apitracker.io) and expanded webhook coverage to fan_transfer events. PolyAPI added Tixr to its catalog of pre-built integrations in 2024.
- **Quirks / gotchas**: Two separate Apiary docs — one for the REST API, one for webhooks; both linked from `tixr.com/developers` but don't cross-reference clearly. CPK + HMAC is unusual for the ticketing space (most peers use Bearer tokens) — expect SDK code rather than raw `curl` to be the norm. `Group` (promoter group) is a first-class scoping object; events live under groups.
- **Last verified**: May 2026.

### Universe (Ticketmaster-owned)
- **What it is**: Self-serve event ticketing platform owned by Ticketmaster (acquired 2015); functions as the developer-friendly entry point into the broader Ticketmaster ecosystem for indie/small-org events.
- **Developer docs URL**: https://developers.universe.com/ (live). GraphQL reference at https://developers.universe.com/docs/graphql. Webhook help at https://support.universe.com/hc/en-us/articles/360002563972.
- **API base URL**: GraphQL: `https://universe.com/graphql` (HTTP POST with `application/json`). Limited REST endpoints exist for guestlists.
- **Auth scheme**: OAuth 2.0 with two flows — Authorization Code Grant (user-delegated, for multi-tenant apps) and Client Credentials (server-to-server for first-party automation). Plus simpler API Access Tokens with a GraphQL scope, generated in the Universe dashboard. Public OAuth app registration is open via the developer portal.
- **Webhooks**:
  - Available: yes
  - Signing header: not prominently documented in public help articles
  - Signature algo: HMAC-style (consistent with industry norm; not explicitly published)
  - Events emitted: covers order/sale events for an account's events. Universe's help article lists webhooks for "sending Universe data to your app" but does not enumerate every action publicly. Common surfaces include order placed, order refunded, attendee check-in.
  - Doc link: https://support.universe.com/hc/en-us/articles/360002563972-Sending-Universe-data-to-your-app-using-webhooks
- **Key REST endpoints**: REST is limited; the GraphQL `viewer.events`, `event.orders`, `event.orderItems`, `event.attendees`, and QR-code retrieval queries cover most ticketing/check-in needs. Universe also documents widget callbacks for redirect-style flows.
- **Public app program**: Yes — open. Self-serve OAuth app creation; integrations also reach Universe via the Ticketmaster Discovery API.
- **Rate limits**: Not publicly documented in the developer portal.
- **Notable existing integrations**: Zapier (5,000+ downstream apps via Zapier per Universe's marketing), Mailchimp, Google Ads, Tradable Bits, Audience Republic, analytics/CRM stacks. Listings are also discoverable via the Ticketmaster Discovery API.
- **Recent platform changes**: Universe has been gradually integrated into the Ticketmaster developer portal at https://developer.ticketmaster.com — newer Ticketmaster Partner API and Discovery API endpoints surface Universe inventory. The standalone Universe Public API is still maintained but receives less roadmap attention than parent-Ticketmaster surfaces.
- **Quirks / gotchas**: GraphQL-first API on a non-`/api` path (POST to `/graphql` on the consumer domain), which surprises devs expecting `api.universe.com`. QR codes for attendee check-in are returned as Base64 strings via GraphQL — not URLs. Universe IDs are global Relay-style IDs (same shape as DICE). Some "Universe" features only exist when reached via the parent Ticketmaster Discovery API.
- **Last verified**: May 2026.

### FEVO
- **What it is**: Group-buy / social-checkout ticketing platform that bolts onto primary ticketing systems (Ticketmaster, AXS, Tickets.com, Paciolan, Front Gate) to enable bundles, split-pay, and "sit with friends" group purchases.
- **Developer docs URL**: https://www.fevo.com/docs/v1 (live — primarily a JS SDK reference). Integration partners listing: https://www.fevo.com/integration-partners.
- **API base URL**: No public REST API base URL. The integration surface is a client-side JavaScript SDK at `https://sdk.fevo.com/v1/fevo.js`.
- **Auth scheme**: Publisher key (`Fevo.init({publisherKey: "..."})`). Provisioned per partner by FEVO's BD/integration team. There is no public OAuth or REST API for arbitrary third-party developers.
- **Webhooks**:
  - Available: partner-only — FEVO operates server-to-server with primary ticketing systems via direct integrations rather than offering generic webhooks
  - Signing header: not publicly documented
  - Signature algo: not publicly documented
  - Events emitted: not publicly documented
  - Doc link: N/A
- **Key REST endpoints**: Endpoints not publicly documented. FEVO's documented surface is just the JS SDK with `Fevo.init()` and `Fevo.purchase()` to embed Social Checkout into a publisher's page.
- **Public app program**: No — direct-partnership-only model.
- **Rate limits**: N/A (no public API).
- **Notable existing integrations**: Ticketmaster, AXS, Tickets.com, Paciolan, Front Gate Tickets, Shift4 (payments), Checkout.com, Zip (BNPL), Stayker (hotels), Parkhub (parking), ID.me (identity), Google Cloud (infra), SADA. Operates with $250M+ in annual transactions.
- **Recent platform changes**: Acquired Groupmatics in 2022 (rebranded as "Fevo GM"), expanding into pro/college sports group sales. Extended the Paciolan partnership in 2024 to exclusivity for group ticketing on Paciolan inventory.
- **Quirks / gotchas**: Not a primary ticketing system — FEVO sits on top of one. Integration with FEVO presumes you already have inventory in Ticketmaster/AXS/Paciolan/etc. The JS SDK runs in an iframe ("Social Checkout") and emits client-side events that publishers can listen to, but there is no documented backend webhook for third-party CRMs. To consume FEVO order data, route through the underlying primary ticketing system (e.g. Ticketmaster's Partner API).
- **Last verified**: May 2026.

### Tixel
- **What it is**: Fan-to-fan secondary ticket marketplace (resale) with fee-cap and ticket-validation guarantees; integrates with primary ticketing platforms to revoke-and-reissue tickets on resale.
- **Developer docs URL**: No public developer portal. Integration documentation is reverse-published by partner platforms (e.g. Ticket Tailor's help center). Supported-platforms list: https://tixel.com/us/integrations.
- **API base URL**: Not publicly documented. Tixel's API is consumed by partner box-office systems, not by arbitrary developers.
- **Auth scheme**: API tokens generated on the partner box-office side (e.g. Ticket Tailor admin generates an API key with Admin scope and provides it to Tixel). Tixel calls back to the primary ticketing system using that token to validate tickets and trigger revoke/reissue. There is no documented OAuth flow or developer-app registration on Tixel's side.
- **Webhooks**:
  - Available: not publicly documented for third parties
  - Signing header: not publicly documented
  - Signature algo: not publicly documented
  - Events emitted: not publicly documented
  - Doc link: N/A
- **Key REST endpoints**: Endpoints not publicly documented. Functional model: at listing time, Tixel calls the partner ticketing system to validate ticket; at sale, the original ticket is voided and a $0 replacement ticket is issued in the buyer's name+email.
- **Public app program**: No — partner-platform-only. Tixel's "integrations" are inbound (Tixel as a marketplace consumer of partner ticketing APIs), not outbound for arbitrary developers.
- **Rate limits**: Not publicly documented.
- **Notable existing integrations**: Ticket Tailor (UK/EU/AU since ~2023, US in early 2026), Leap Event Ticketing, plus an extensive accept-list of 400+ ticket-issuer brands — Ticketmaster, AXS, Eventbrite, DICE, Universe, Moshtix, Oztix, Ticketek, Eventfinda, Tito, StubHub, etc.
- **Recent platform changes**: US market launch with Ticket Tailor in January 2026 (previously UK/EU/AU only).
- **Quirks / gotchas**: Tixel is inverted from the usual "platform exposes API to dev" pattern — Tixel is the consumer, partner ticketing platforms are the providers. To "integrate with Tixel" as an event-ops product, the path is to go to your primary ticketing platform and ensure their Tixel integration is enabled, then read order/refund events from the primary platform's API/webhooks. Direct Tixel data access is mediated through the primary platform.
- **Last verified**: May 2026.

### Eventim / CTS Eventim
- **What it is**: Large European primary ticketing operator (CTS Eventim AG) with a SaaS sub-brand EVENTIM.Tixx for venues, sports clubs, and festivals.
- **Developer docs URL**: No fully public developer portal. EVENTIM.Tixx interface overview at https://www.eventim-tixx.com/en/services/product-platform/interfaces-and-integrations (live, marketing); affiliate/partner onboarding at https://corporate.eventim.de/en (live, partner-only). Reverse-engineered notes at https://gist.github.com/DeveloperMarius/7e8aff4c69ccbf59238d76163c86d9c9 and https://kggx.github.io/pyventim/ (community, unofficial).
- **API base URL**: `https://public-api.eventim.com/` is the public consumer-search base used by eventim.de (e.g. `/websearch/search/api/exploration/v1/products`, `/travel/flexhub/prod/api/v2/min-prices`). EVENTIM.Tixx partner REST APIs are exposed per-tenant under Tixx-Connect with no single public base URL. Tix Event API (Eventim group sub-product) is documented at `https://eventapi.tix-support.com/`.
- **Auth scheme**: EVENTIM.Tixx uses OAuth2 + OpenID Connect for SSO and partner API access. Public OAuth app program is **not open**: partner approval and a contractual agreement with CTS Eventim or a Tixx licensee is required. The reverse-engineered consumer endpoints are unauthenticated but only return search/listing data.
- **Webhooks**:
  - Available: yes, partner-only. Webhooks emit on create/update of contact/booking/order entities.
  - Signing header: not publicly documented.
  - Signature algo: not publicly documented.
  - Events emitted: order/booking create + update, contact create + update (per Unidy integration writeup the webhook only carries a UUID and the consumer must call back into the Eventim webhook API to fetch the payload).
  - Doc link: https://docs.unidy.io/technical-documentation/43Yox8946664zbsR6p9VyD/eventim-ticketcorner-integration/6yUbJYQKWZ3d1Z6cWVcNx8 (third-party description).
- **Key REST endpoints**: Public — `GET /websearch/search/api/exploration/v1/products`, `GET /travel/flexhub/prod/api/v2/min-prices`. Partner Tixx — event/series CRUD, ticket category CRUD, order read, scan/access-control, contact/CRM read; specific paths are under NDA.
- **Public app program**: No. Affiliate Network exists for inventory ingestion; deep API/app program is invite-only via the Tixx partner contact form.
- **Rate limits**: not publicly documented.
- **Notable existing integrations**: Laylo, Unidy (membership CRM), Tink (Pay-by-Bank), See Tickets US affiliate feed.
- **Recent platform changes**: Tixx-Connect positioned as the official RESTful integration layer; group acquired See Tickets and Vivendi Ticketing assets, expanding the perimeter under the same API umbrella.
- **Quirks / gotchas**: Eventim is a federation of regional tenants (eventim.de, eventim.es, eventim.ch via Ticketcorner, oeticket.com, eventim-light.com self-serve). API access varies by tenant; you must contract with the right entity. Webhook payloads via UUID-then-fetch pattern means no body signature (the fetch call carries auth instead). German-language docs are common for partner onboarding.
- **Last verified**: May 2026.

### Weeztix (formerly Eventix)
- **What it is**: Netherlands-based event ticketing SaaS (rebrand of Eventix in 2024) used widely in NL/BE for festivals, clubs, and venues.
- **Developer docs URL**: https://docs.weeztix.com/docs/ (live, public). Help index at https://weeztix.com/help/help.
- **API base URL**: `https://api.weeztix.com` (REST). Storefront/order surface at `https://shop.api.weeztix.com`. Webhook management at `https://webhooks.weeztix.com`.
- **Auth scheme**: Bearer token in `Authorization: Bearer <accessToken>`. Tokens are issued per company; no fully public OAuth-app marketplace — partners request credentials from `apiteam@weeztix.com`.
- **Webhooks**:
  - Available: yes, fully self-serve.
  - Signing header: not documented as a signed header; Weeztix relies on a secret URL + `Authorization` echoed by the consumer plus optional retry.
  - Signature algo: none documented (HTTPS + custom auth). Consumers should validate by calling back into the API with the payload's resource GUID.
  - Events emitted: triggers across resources Order, Shop, Ticket, Event, Ticket Type, Scanner, Scanner Type, Product, Product Group, Export, Event Date, Event Location, Coupon, Coupon Code, Metadata, Waiting List, Signup, Company. Trigger types: `create`, `update`, `delete`, `relation`, `reorder`, `scan`, `paid`, `placed`, `revision`.
  - Doc link: https://docs.weeztix.com/docs/webhooks/create-webhook/
- **Key REST endpoints**: `POST/GET/PUT https://api.weeztix.com/shop`, `https://api.weeztix.com/event`, `/event/:guid`, `/event/:guid/ticket`, `POST https://shop.api.weeztix.com/:shopGUID/order`, `GET https://api.weeztix.com/shop/:shopGUID/payment_methods`, scanner endpoints emit via webhook trigger `scan`.
- **Public app program**: No public marketplace; partner integration is request-and-approve via `apiteam@weeztix.com`.
- **Rate limits**: not publicly documented.
- **Notable existing integrations**: Mailchimp, TicketSwap, Facebook, Google Ads, Laylo, Albato (iPaaS), Let's Get Digital, Eventication.
- **Recent platform changes**: Eventix → Weeztix rebrand; legacy `api.eventix.io` superseded by `api.weeztix.com`.
- **Quirks / gotchas**: Two split base URLs (management API vs storefront/order API). Webhook child-resource trigger semantics drift from documentation (Weeztix notes the "Triggered by child resources" label is no longer literal). No payload signature — anyone with the webhook URL can post; protect with secret tokens or IP allowlists.
- **Last verified**: May 2026.

### Shotgun (shotgun.live)
- **What it is**: Paris-founded ticketing platform for nightlife, electronic music, and festivals; also markets itself as a fan-discovery app.
- **Developer docs URL**: No public developer portal. Token issuance docs at https://support-pro.shotgun.live/hc/en-us/articles/33561354477970-Find-your-Organizer-id-and-API-token (live, behind support center). Widget/iframe embed at https://support-pro.shotgun.live/hc/en-us/articles/360018503879. Partner Smartboard at https://smartboard.shotgun.live/login. Note: shotgun.live is unrelated to Autodesk's "Shotgun Software" / ShotGrid / Flow Production Tracking — those `developer.shotgunsoftware.com` and `developers.shotgridsoftware.com` URLs are a different product despite shared brand history.
- **API base URL**: Not publicly published. Organizer-scoped REST endpoints are exposed for partner ingestions, accessed with an Organizer ID + API token pair generated from the dashboard's APIs panel.
- **Auth scheme**: Per-organizer API token (static bearer-style) plus an Organizer ID, generated under organizer settings → APIs → "Generate a token". No public OAuth app program; tokens are scoped to one organizer.
- **Webhooks**:
  - Available: yes, partner-only (used by Laylo, FanIQ One). Not self-serve to arbitrary developers.
  - Signing header: not publicly documented.
  - Signature algo: not publicly documented.
  - Events emitted: ticket purchase, refund, check-in/scan, attendee update (consumed by Laylo, FanIQ, Meta CAPI integration).
  - Doc link: only via partner onboarding email.
- **Key REST endpoints**: Organizer event listing, ticket sales export, attendee export, scan/check-in feed; external-sales import endpoint to centralize sales from other distributors. Exact paths are not published.
- **Public app program**: No public marketplace. Existing integrations are first-party (Stripe Connect for payments, Meta Pixel + CAPI, Laylo, FanIQ One, Resident Advisor for inventory cross-listing). Apify provides an unofficial scraper Actor at https://apify.com/hypebridge/shotgun-live/api — not an official API.
- **Rate limits**: not publicly documented.
- **Notable existing integrations**: Laylo, FanIQ One, Stripe Connect (payments), Meta Pixel/CAPI, Resident Advisor (inventory), TikTok Pixel.
- **Recent platform changes**: Stripe-published case study notes 560%+ payment volume growth on Stripe Connect; expanded global reach beyond France since 2023.
- **Quirks / gotchas**: Two distinct "Shotgun" namespaces complicate searches. The token is organizer-scoped, so multi-tenant integrations require one credential per client. External-sales import is a one-way pull (from competing distributors into Shotgun), not a public write API for ticket creation.
- **Last verified**: May 2026.

### Fourvenues
- **What it is**: Spain-based 360º nightclub/venue management platform (CRM + reservations + ticketing + scan + cash control), strong in ES/LatAm nightlife.
- **Developer docs URL**: https://docs.fourvenues.com/ (live, public). Index manifest at https://docs.fourvenues.com/llms.txt. OpenAPI specs published as `integrations_api.json`, `channel_manager_api.json`, `reseller_api.json`, `openapi.json` under the same docs host.
- **API base URL**: Not surfaced in the public index (lives inside the OpenAPI spec files); three product surfaces are documented separately: Integrations API (own venues), Channel Manager API (marketplaces / multi-venue), Reseller API (third-party resellers).
- **Auth scheme**: Bearer-token style (`Authorization: Bearer …`) per OpenAPI sec schemes; tokens are obtained from the Fourvenues dashboard for your venue/organization. No public OAuth-app marketplace described — integrations are configured per-venue.
- **Webhooks**:
  - Available: yes, documented under "Webhooks & Events" section.
  - Signing header: not publicly documented in the index.
  - Signature algo: not publicly documented in the index.
  - Events emitted: at minimum `Payment Success` and `Ticket Refund Request` are referenced; the docs index implies broader event coverage tied to bookings, tickets, payments, and discount codes.
  - Doc link: https://docs.fourvenues.com/ → "Webhooks & Events".
- **Key REST endpoints**: organized by category — Authentication & Organizations, Bookings & Availability, Events & Locations, Tickets & Ticket Rates, Passes & Lists, Payments & Refunds, Discount Codes & Custom Taxes. Channel Manager API additionally exposes multi-venue / marketplace operations; Reseller API handles secure third-party resale.
- **Public app program**: No marketplace listing program; credentialed access provisioned per organization.
- **Rate limits**: not publicly documented.
- **Notable existing integrations**: Laylo (https://laylo.com/integrations), various Spanish/LatAm payment gateways. Fourvenues also runs as the operations layer behind several large nightclub groups.
- **Recent platform changes**: 2025 expansion of the Reseller API as a dedicated surface separate from Integrations API.
- **Quirks / gotchas**: Three separate APIs with different scopes — pick the right one (Integrations for own venues vs Channel Manager for marketplaces). Documentation is bilingual (EN/ES) and the marketing site defaults to Spanish; some endpoint descriptions are ES-only. White-label deployments may swap the auth host.
- **Last verified**: May 2026.

### The Ticketing Co.
- **What it is**: US-based independent event ticketing platform (Brooklyn, NY), pitched at promoters and creatives; offers organizer dashboard, live sales reporting, and a scanner mobile app on iOS/Android.
- **Developer docs URL**: None published. No `developer.theticketing.co` or `docs.theticketing.co` portal exists. Marketing site at https://theticketing.co/ (live), iOS app https://apps.apple.com/us/app/the-ticketing-co/id1535703906, Android app https://play.google.com/store/apps/details?id=co.theticketing.main.
- **API base URL**: N/A — no public API.
- **Auth scheme**: N/A — no public API. Account login at https://theticketing.co/login is operator-facing only.
- **Webhooks**: not available.
- **Key REST endpoints**: N/A.
- **Public app program**: No. Not listed on Zapier, no published partner program, no Laylo integration, no Albato connector.
- **Rate limits**: N/A.
- **Notable existing integrations**: None publicly disclosed beyond the first-party iOS/Android scanner.
- **Recent platform changes**: G2 + Trustpilot listings indicate active growth through 2025–2026; product positioning as a low-fee alternative to Eventbrite.
- **Quirks / gotchas**: Easy to confuse with TicketCo (Norway, https://ticketco.events) which DOES have a public API + Zapier app, and Ticketing.events (different vendor with API-key auth). Brand name "Ticketing Co." has poor SEO disambiguation. To integrate, you must contact the company directly via `info@theticketing.co` and request a custom data feed.
- **Last verified**: May 2026.

### GetIn
- **What it is**: Fan-database / audience-management platform referenced as a destination for ticketing CRM data; surfaced as a Laylo integration target ("push fan data directly to your GetIn database for smarter audience management"). Public information is sparse and the brand is ambiguous.
- **Developer docs URL**: None located. No `developer.getin.events`, no `docs.get-in.com`, no public API portal.
- **API base URL**: A bare hostname `api.get-in.com` resolves and is referenced in third-party listings (e.g. `https://api.get-in.com/marryland19?seller_code=getin`-style seller deeplinks for an event-management platform), but it is gated and returns 403 to unauthenticated callers. No published base path scheme.
- **Auth scheme**: Not publicly documented. Laylo's outbound integration suggests a partner-issued API key + account identifier model.
- **Webhooks**: not publicly documented; flow appears to be inbound write (Laylo → GetIn) rather than outbound.
- **Key REST endpoints**: unknown.
- **Public app program**: No. Integrations appear to be hand-built between vendor partners.
- **Rate limits**: unknown.
- **Notable existing integrations**: Laylo (documented). No Zapier, Mailchimp, Klaviyo, or Albato connector found.
- **Quirks / gotchas**: The "GetIn" brand is heavily overloaded. Candidates: (a) **api.get-in.com** — event-production / seller-deeplink platform; (b) **getin.events** — does not return a developer portal; (c) **GetIn / Get-In** Polish event-listing/affiliate tools. **Recommendation: contact Laylo's partner team to obtain GetIn's authoritative integration contact before scoping work; do not assume any of the candidate domains is canonical.**
- **Last verified**: May 2026.

---

## Tier 2 — commerce / merch

### Shopify
- **What it is**: Hosted commerce platform for storefronts, checkout, and order management — used by artists for direct-to-fan merch and ticketing add-ons.
- **Developer docs URL**: https://shopify.dev/docs/api (live)
- **API base URL**: `https://{shop}.myshopify.com/admin/api/{version}/graphql.json` (GraphQL Admin) and `/admin/api/{version}/{resource}.json` (legacy REST)
- **Auth scheme**: OAuth 2.0 for public/custom apps; access token sent as `X-Shopify-Access-Token` header. Granular access scopes (`read_orders`, `write_customers`, `read_products`, `read_checkouts`, `write_draft_orders`, etc.). Custom apps installed inside a single Shopify admin can use admin-generated tokens; private/custom apps for App Store distribution have been on a deprecation path.
- **Webhooks**:
  - Available: yes
  - Signing header: `X-Shopify-Hmac-Sha256`
  - Signature algo: HMAC-SHA256 of the raw request body, keyed with the app's client secret, base64-encoded
  - Events emitted: `orders/create`, `orders/updated`, `orders/paid`, `orders/cancelled`, `orders/fulfilled`, `orders/edited`, `orders/partially_fulfilled`, `orders/delete`, `checkouts/create` (abandoned-cart trigger), `checkouts/update`, `carts/create`, `carts/update`, `customers/create`, `customers/update`, `customers/delete`, `products/create`, `products/update`, `inventory_levels/update`, `app/uninstalled`, plus GDPR mandatory topics (`customers/data_request`, `customers/redact`, `shop/redact`). Full enum: `WebhookSubscriptionTopic` in the GraphQL Admin schema.
  - Doc link: https://shopify.dev/docs/apps/build/webhooks
- **Key REST/GraphQL endpoints / resources**: GraphQL `Order`, `Customer`, `Product`, `DraftOrder`, `AbandonedCheckout`, `InventoryLevel`, `Fulfillment`, `webhookSubscriptionCreate` mutation. Legacy REST equivalents like `GET /admin/api/2025-07/orders.json` are still served but new public apps must build on GraphQL.
- **Public app program**: yes — Shopify App Store. Requires Partner account, GraphQL-only build, mandatory Billing API for charges, App Bridge for embedded UI, and review (typically 4–7 business days, 2–4 weeks total with revisions). Cannot use "Shopify" in the app name.
- **Rate limits**: GraphQL uses calculated cost (leaky bucket): 1,000 max cost per query, default 50 points/sec restore (Standard plan), higher on Shopify Plus. REST: 2 req/sec sustained, 40-request burst per shop on Standard; doubled on Plus. Webhook deliveries are not rate-limited.
- **Notable existing integrations**: Klaviyo, Mailchimp, Meta Shops, TikTok, Spotify for Artists (virtual merch table), Bandsintown, Linktree, Shop app, Shipstation, Recharge, Stripe (via Shopify Payments).
- **Recent platform changes**: API versioning is quarterly — current versions in support window include 2026-04 (latest), 2026-01, 2025-10, 2025-07, 2025-04. As of April 1 2025, all new public apps must use GraphQL Admin (REST is legacy-only for new builds). 2026 introduced per-API-key rate-limit caps for public apps.
- **Quirks / gotchas**: Webhook HMAC must be computed against the **raw, undecoded** request body — Express/Next.js JSON body parsers will silently break verification. Shopify retries failed webhooks for 48 hours then disables the subscription. Cart webhooks (`carts/create`/`update`) only fire for online-store carts, not custom storefronts. App Store review will reject apps that drop storefront performance score by more than 10 points.
- **Last verified**: May 2026.

### Merchtable
- **What it is**: Custom-built DTC merch fulfillment + storefront platform for artists and labels (vinyl, t-shirts, fashion), operated out of Lawrence, Kansas since 2002.
- **Developer docs URL**: None published. No `/developers`, `/api`, `/docs` route exists on merchtable.com.
- **API base URL**: N/A — no public API.
- **Auth scheme**: N/A. Account access is through the artist storefront admin only; no token issuance.
- **Webhooks**: not available.
- **Public app program**: no — Merchtable is closed-platform.
- **Notable existing integrations**: Marketing material lists upstream channels they syndicate to (Shopify, Seated, Bandcamp, Etsy, Meta/Instagram, Facebook, Google) plus SoundScan reporting. These appear to be internal connectors, not third-party APIs they expose.
- **Quirks / gotchas**: Treat Merchtable as a **service vendor**, not a developer platform — any data flow has to be negotiated as a CSV drop, SFTP feed, or hand-rolled scrape, brokered with their support team (785.856.2321, hello@merchtable). If a tighter loop is required, the artist's Shopify storefront (which Merchtable can sit alongside) is the better integration target.
- **Last verified**: May 2026.

---

## Tier 3 — door / on-site

### SET.live
- **What it is**: Web-based, app-less mobile fan-data capture tool for live shows — artists collect names, emails, phones, and survey data in exchange for in-show experiences (giveaways, voting, contests). Built and operated by **MAX (Music Audience Exchange)**, parent domain `max.live`. Not owned by an individual named "Max"; MAX is the company.
- **Developer docs URL**: None published. Product surface is artists.set.live (artist portal) and signup.set.live (fan flows).
- **API base URL**: N/A publicly. Internal APIs power the artist portal but are not documented for third parties.
- **Auth scheme**: N/A externally. Artist accounts authenticate into artists.set.live; brand/sponsor accounts go through max.live sales.
- **Webhooks**: no — not advertised in any public material.
- **Public app program**: no. SET sits inside MAX's broader brand-sponsorship offering; integrations are negotiated, not self-serve.
- **Notable existing integrations**: Used by Alicia Keys, John Legend, Jelly Roll, thuy, Black Pumas, Sleater-Kinney, Miranda Lambert. SET.Fan is the survey sibling product. Marketing language references "first-party data capture and retargeting" but no named CRM/ESP destinations are advertised.
- **Quirks / gotchas**: Functionally a black box from the outside — fan data lives inside SET and exits via CSV export from the artist portal or via white-glove enterprise data-share with MAX. If you want the fan list at the door, plan on ingesting a CSV (or asking MAX for a partner-tier feed) rather than calling an API. Worth contacting hello@max.live before designing any automated flow.
- **Last verified**: May 2026.
- **Fan data produced**: Door check-in events with email + phone + name + survey responses; consent recorded at check-in.

---

## Tier 4 — social / link-in-bio

### Linktree
- **What it is**: Link-in-bio service hosting public profile pages of stacked links (linktr.ee/{handle}) for ~25M creators.
- **Developer docs URL**: https://linktr.ee/marketplace/developer (developer-program EOI, behind a marketing form) and https://linktr.ee/s/about/developer-terms (developer terms — both pages return 403 to non-browser fetchers, indicating gated/anti-bot posture). No public API reference URL is published.
- **API base URL**: N/A publicly. Linktree has historically marketed an early-access SDK/API for approved partners only — no general-availability base URL.
- **Auth scheme**: Invite/partner-only. Approved Link App developers go through Linktree's Marketplace developer program; auth scheme is not documented publicly. End-users connect downstream services (Spotify, YouTube, Shopify, etc.) via OAuth out, not via Linktree issuing tokens to third parties.
- **Webhooks**: no public webhooks.
- **Key REST endpoints / resources**: None published. **No oEmbed endpoint** is advertised. Profile pages are public HTML at `https://linktr.ee/{handle}` and can be fetched, but ToS forbids scraping for redistribution. Community projects (e.g. `keosariel/Linktree-API` on GitHub, the Postman collection at `documenter.getpostman.com/view/14039622/Tzsik4P8`) are unofficial scrapers — they break when Linktree changes its bundle.
- **Public app program**: invite-only — Linktree Marketplace lists 30+ Link Apps (Spotify, YouTube, TikTok, Bandsintown, Shopify, PayPal, Cameo, Typeform, Gleam, Twitch, Reddit, Spring, Twitter); becoming one requires expression-of-interest and approval. No self-serve listing.
- **Rate limits**: N/A publicly. Anti-bot protections (Cloudflare 403s on programmatic fetches without browser headers) imply unofficial scrapes will be blocked.
- **Notable existing integrations**: Spotify, SoundCloud, YouTube, Vimeo, TikTok, Twitch, Shopify, PayPal, Bandsintown, Typeform, Gleam, Cameo, Spring, Mailchimp (via embed), Calendly. Most are embed/iframe-style "Link Apps" that render inside the Linktree, not bidirectional API integrations.
- **Recent platform changes**: Marketplace launched June 2022; developer program remained early-access through 2025–2026.
- **Quirks / gotchas**: Famously has no general-purpose public API. Cannot programmatically add/remove links to a user's tree without that user pasting a URL into the admin (or a partner-tier integration). Treat Linktree as a **destination** (publish a stable URL a user manually adds) rather than an integration target. oEmbed is not supported; standard `<iframe src="https://linktr.ee/{handle}">` works visually but is rate-shaped and bot-detected. Don't ship code that depends on scraping linktr.ee.
- **Last verified**: May 2026.

### Instagram (Meta Graph API — Messaging + Comments)
- **What it is**: Meta's Graph API surface for Instagram Professional/Business accounts that powers DM-to-signup bots, comment-reply automation, and content webhooks. Powers products like Laylo's "DM `RSVP` for tickets" flow.
- **Developer docs URL**: https://developers.facebook.com/docs/instagram-platform/ (live), with messaging at https://developers.facebook.com/docs/messenger-platform/instagram/features/webhook/ and webhooks at https://developers.facebook.com/docs/instagram-platform/webhooks/
- **API base URL**: `https://graph.instagram.com/{version}/...` (Instagram Login flow) and `https://graph.facebook.com/{version}/...` (legacy Facebook-Login-for-Instagram flow). Current versions in active support: v21.0, v22.0, v23.0, v24.0, v25.0.
- **Auth scheme**: OAuth 2.0 issuing user/page access tokens. Required permissions for the DM/comment automation flow: `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`, `pages_manage_metadata`, `pages_show_list`, `business_management`. Account must be Professional (Business or Creator) and linked to a Facebook Page (for the legacy flow) or use Instagram Login direct.
- **Webhooks**:
  - Available: yes
  - Signing header: `X-Hub-Signature-256` (formatted `sha256={hex}`)
  - Signature algo: HMAC-SHA256 of the raw payload keyed with the app secret, hex-encoded
  - Events emitted (fields): `messages`, `message_echoes`, `message_reactions`, `messaging_postbacks`, `messaging_referral` (ig.me deep links — the canonical mechanism for "DM `RSVP` for tickets" flows), `messaging_seen`, `messaging_optins`, `messaging_handover`, `messaging_policy_enforcement`, `comments`, `live_comments`, `mentions`, `story_insights`, `standby`
  - Doc link: https://developers.facebook.com/docs/instagram-platform/webhooks/
- **Key REST endpoints / resources**: `POST /{ig-user-id}/messages` (send DM), `GET /{ig-user-id}/conversations`, `GET /{ig-media-id}/comments`, `POST /{ig-comment-id}/replies` (reply to comment), `POST /me/subscribed_apps` (enable webhooks). Comment-to-DM flow: webhook on `comments` field → match keyword → call `POST /{ig-user-id}/messages` with `recipient.comment_id` to open a private thread.
- **Public app program**: yes — Meta App Review. Requires Business Verification (corporate documents), per-permission video screencast demonstrating exact use, and live data handling proof. Standard permissions land in 2–4 weeks; sensitive scopes like `instagram_manage_messages` can take longer with extra documentation rounds.
- **Rate limits**: Business Use Case (BUC) per-user limit: 200 calls/user/hour, scaling with authenticated user count. Messaging-specific: 100 calls/sec per IG professional account for text/links/reactions/stickers, 10 calls/sec for audio/video, 2 calls/sec base rate for other ops. 24-hour messaging window after a user-initiated DM (replies outside window need message tags).
- **Notable existing integrations**: ManyChat, Manychat-class bot platforms, Sprout Social, Hootsuite, Sprinklr, Sendbird, Khoros, Laylo, Community.com, Postscript, Gorgias, Zendesk Sunshine.
- **Recent platform changes**: v21.0+ deprecated several legacy Messenger-platform-only Instagram permissions. Instagram Login flow (graph.instagram.com) is now preferred over the legacy Facebook Login flow for new apps. Stricter policy enforcement on automated DMs in 2024–2025; comment-to-DM funnels remain the supported pattern but must respect 24h window and policy.
- **Quirks / gotchas**: Webhook subscription only fires after the IG account explicitly grants the page connection AND the app calls `POST /me/subscribed_apps`. App must be in Live mode to receive events for non-test users. Comment webhooks require Advanced Access (granted only post-App-Review). Pro IG account must be set to Public for `comments`/`mentions` webhooks. Only one app can "control" a conversation at a time — multi-app deployments need the messaging handover protocol. Test thoroughly in development mode with role users before review submission; review videos must show the exact production code path, not a mocked screen.
- **Last verified**: May 2026.

### Bandsintown
- **What it is**: Concert/tour-discovery platform with artist-side tools for publishing tour dates, RSVP funnels, and waitlists. Two distinct integration surfaces: (a) the **public Events API + Widget** for displaying tour data, and (b) the **fan opt-in CTA URLs** that drive Follow/RSVP/Notify Me/Waitlist signups back into Bandsintown.
- **Developer docs URL**: https://help.artists.bandsintown.com/en/articles/9186477-api-documentation (live), Swagger spec at https://app.swaggerhub.com/apis-docs/Bandsintown/PublicAPI/3.0.0, fan opt-ins at https://help.artists.bandsintown.com/en/articles/9186761-api-for-fan-opt-ins, widget at https://www.artist.bandsintown.com/widget-api
- **API base URL**: `https://rest.bandsintown.com/`
- **Auth scheme**: `app_id` query parameter (string identifier, not a secret). Artist managers generate one from artist Settings → General → Get API Key. Each `app_id` is bound to a single artist unless Bandsintown explicitly authorizes broader access. No OAuth, no signed requests, no expiring tokens.
- **Webhooks**: no — poll-only on the public API.
- **Key REST endpoints / resources**:
  - `GET /artists/{artist_name}/?app_id={app_id}`
  - `GET /artists/id_{artist_id}/?app_id={app_id}`
  - `GET /artists/fbid_{facebook_page_id}/?app_id={app_id}`
  - `GET /artists/{artist_name}/events/?app_id={app_id}` (with `date={upcoming|past|all|YYYY-MM-DD,YYYY-MM-DD}` filter)
  - Fan opt-in CTA URLs (Follow, Play My City, RSVP, Notify Me, Waitlist) constructed with artist ID, the same `app_id`, optional affiliation code, and `utm_campaign` tracking. The Waitlist variant is enabled by appending `&waitlist=true&utm_campaign=waitlist`.
- **Public app program**: partner-tier — listed marketplace integrations are managed via business-development partnership rather than open app store. Self-serve API access is available to any artist team for read.
- **Rate limits**: Not published. Generally permissive for site-embed-scale usage; high-volume / promoter-tier traffic requires partnership outreach.
- **Notable existing integrations**: Music distribution (CD Baby, DistroKid, Ditto, Too Lost, TuneCore, UnitedMasters), streaming (Spotify, Apple Music, Amazon Music, Shazam, YouTube), search (Google, Apple Maps, Musixmatch), site builders (Squarespace, Wix, WordPress, Bandzoogle, Komi), commerce (Shopify), marketing (Kit, Laylo, Community.com, Openstage, Rivet), tour links (Feature.fm), discovery (Groover, Linktree), analytics (SymphonyOS), career (STRM, Artist Growth, Rostr, Unhurd). **Conspicuously absent**: Mailchimp, Klaviyo.
- **Recent platform changes**: Artist API key self-issuance moved into the Bandsintown for Artists settings panel; Waitlist CTA shipped as a parameterized variant of the RSVP CTA. No 2025–2026 breaking schema changes documented.
- **Quirks / gotchas**: There is **no separate "promoter API"** as a distinct technical surface — the same REST endpoints power both the public widget and the fan opt-in CTAs. The "private" feel comes from partnership-tier business agreements (broader scope per `app_id`, custom CTAs, co-branded campaigns), not a different base URL. The opt-in URLs are constructed client-side and redirect through Bandsintown — fans land on Bandsintown's UI to confirm, so styling is constrained. **No webhook on RSVP/Follow events; you must export contacts from the artist portal or pull through partnership data feeds.** `app_id` is a query string parameter — treat it as a low-sensitivity identifier, not a secret.
- **Last verified**: May 2026.

---

## Tier 5 — fan engagement / niche

### Seated
- **What it is**: Presale/waitlist and tour-date widget platform used by artists to capture fan ticket demand and connect with high-intent fans via SMS/email.
- **Developer docs URL**: No public developer portal found. Artist help center at https://artists.seated.com (behind-login for setup); support docs at https://support.seated.com/hc (live, fan-facing).
- **API base URL**: N/A (referenced as "use their API to build something custom" on marketing pages, but no public endpoint catalog is published).
- **Auth scheme**: No public API exposed; likely partner-only credentials issued by Seated business team.
- **Webhooks**: no info publicly documented.
- **Key REST endpoints / resources**: None public. Embed is delivered as a single-line JS snippet for tour-dates; presale/waitlist enrollment is browser-side via Seated-hosted form.
- **Public app program**: No public app marketplace; partnerships are direct-BD (e.g., Ticketmaster integration announced April 2026).
- **Rate limits**: Not published.
- **Notable existing integrations**: Ticketmaster (April 2026 partnership for waitlist-fed ticket distribution + AutoBuy in US/CA); Sofar Sounds (former parent until founder buy-back); embeddable on artist sites (Squarespace, WordPress, Webflow via JS embed).
- **Recent platform changes**: April 2026 — Ticketmaster partnership lets verified Seated waitlists release additional tickets directly through Ticketmaster fulfillment. Seated founders re-acquired the platform from Sofar Sounds (Billboard, 2025).
- **Quirks / gotchas**: Account upgrades and presale setup require contacting Seated team (no self-serve developer signup). Identity verification on waitlists is a Seated-controlled flow — partners don't get raw fan PII without a data-share agreement.
- **Fan data produced**: Waitlist signups (email + phone with SMS consent), presale registrations, tour-date page impressions/clicks, AutoBuy opt-ins, geographic intent (which show a fan signed up for). Useful for CRM as high-intent ticket-demand events tied to a specific tour date.
- **Last verified**: May 2026.

### FanVids
- **What it is**: Branded UGC platform where fans upload videos/photos from a live show to an artist-specific domain and optionally hand over first-party contact data.
- **Developer docs URL**: No public developer docs found. FAQ at https://www.fanvids.io/faq (live) covers product but not integrations.
- **API base URL**: N/A.
- **Auth scheme**: No public API exposed. Artist/manager/contractor accounts are the only documented surface.
- **Webhooks**: no info.
- **Key REST endpoints / resources**: None public.
- **Public app program**: No.
- **Rate limits**: Not published.
- **Notable existing integrations**: Marketed as feeding "your CRM" with first-party data, but no named CRM connector is listed publicly. Hosting on AWS. Fan upload requires no account/app install (web-based capture).
- **Recent platform changes**: Launched April 2024; CelebrityAccess and Hypebot coverage March 2026 confirms free-for-artists model with planned fan-subscription monetization. Working with artists incl. Kelsea Ballerini and Billy Idol.
- **Quirks / gotchas**: Optional date-of-birth requirement is admin-configurable. Consent is explicit at upload time but exact opt-in field set is not published — assume email + optional phone + DOB.
- **Fan data produced**: Per-show fan video/photo uploads (with metadata: timestamp, artist domain, show), plus opt-in email/phone/name and consent record. CRM-relevant as concert-attendance events with linkable first-party contact.
- **Last verified**: May 2026.

### FanMoments
- **What it is**: Web platform letting fans share concert videos with artists; positioned as a lighter-weight peer to FanVids.
- **Developer docs URL**: No public docs found (https://fanmoments.io renders mostly as a logo splash).
- **API base URL**: N/A.
- **Auth scheme**: No API exposed publicly.
- **Webhooks**: no info.
- **Public app program**: No.
- **Notable existing integrations**: None publicly listed. Active Instagram presence (@fanmoments.io) but no integration directory.
- **Quirks / gotchas**: No public API documentation found via web search; integrations appear to be partner-only / direct-business-development. Likely overlap in positioning with FanVids — treat as same data shape until a partner conversation says otherwise.
- **Fan data produced**: Presumed concert video uploads tied to artist + show, with optional fan contact opt-in. No public confirmation of exact field set.
- **Last verified**: May 2026.

### Genni
- **What it is**: Creator marketplace (operated by Songfluencer) where brands, labels, and artists run paid short-form-video campaigns, contests, and song-promotion drops with TikTok/Reels/Shorts creators. Surfaces in Laylo via the "Laylo x Genni Direct Challenges" partnership.
- **Developer docs URL**: No public developer docs found. Creator portal at https://portal.genni.com (behind-login). Marketing site https://genni.com (live).
- **API base URL**: N/A.
- **Auth scheme**: No public API exposed.
- **Webhooks**: no info.
- **Public app program**: No public marketplace; partnerships are direct (e.g., Laylo).
- **Notable existing integrations**: Laylo (Genni Direct Challenges feed challenge-participant emails/phones into Laylo fan CRM); native posting to TikTok, Instagram Reels, YouTube Shorts; iOS app on App Store (id 1666048155).
- **Recent platform changes**: 10,000+ creator campaigns claimed across brands/labels/festivals. Laylo partnership announced via Songfluencer Nov 2024 and still active as of 2026.
- **Quirks / gotchas**: Genni's fan-data surface is the "Direct Challenge" — a creator-led contest that captures fan email/phone — and it's currently delivered to brands only via the Laylo connector, not a raw API. Artist/brand side is managed through a Genni account manager.
- **Fan data produced**: Challenge-participant contact records (email + phone + creator-attribution), campaign-engagement events, creator-content asset URLs. CRM-relevant as new-fan acquisition events with creator-source attribution.
- **Last verified**: May 2026.

### Fandiem
- **What it is**: "Donate to win" charity sweepstakes platform — fans donate to a partner-selected nonprofit and are entered to win artist/festival/athlete experiences and prizes.
- **Developer docs URL**: No public developer docs found. Partner page at https://fandiem.com/partner-with-us (live).
- **API base URL**: N/A.
- **Auth scheme**: No public API. Fully-managed service model — Fandiem operates the campaign and shares results back to partners.
- **Webhooks**: no — data delivery is described as "data share on opt-in users," delivery mechanism unspecified — likely CSV/scheduled export or pixel-based.
- **Key REST endpoints / resources**: None public. Partner-page references "pixel placement on the campaign page" — implying a Meta/Google-style tracking-pixel injection rather than a REST surface.
- **Public app program**: No. All deals are direct-BD with the Fandiem team.
- **Notable existing integrations**: Our Change Foundation (donation routing / 501(c)(3) compliance — sourced from getchange.io case study); pixel-share supports advertiser ecosystems (Meta/TikTok). No named CRM connector in their public materials.
- **Recent platform changes**: Tracks up to 20 concurrent live sweepstakes per partner (per public marketing). No platform-API announcements as of May 2026.
- **Quirks / gotchas**: Heavy compliance overhead — Fandiem owns sweepstakes legal, nonprofit compliance, and prize insurance, so partners cannot self-serve a campaign. Data share is gated by opt-in checkbox at donation time. Sweepstakes law (state-by-state in US) means schema/eligibility fields will include geographic exclusions.
- **Fan data produced**: Sweepstakes entry events with email + phone (where opted-in), donation amount, nonprofit beneficiary, entry tier (donation entry vs. free social-entry tier per sweepstakes law), campaign/prize ID, geographic state. CRM-relevant as cause-aligned high-intent fan + an explicit donation receipt.
- **Last verified**: May 2026.

### Flite
- **What it is**: Event marketplace + creator OS — ticketing, guest-list, multi-currency payments, SMS/email campaigns, and analytics for nightlife/music events. Marketed as an Eventbrite alternative.
- **Developer docs URL**: No public developer portal found. Marketing at https://www.flite.city (live); creator iOS app on App Store (id 6450822291).
- **API base URL**: N/A.
- **Auth scheme**: No public API exposed.
- **Webhooks**: no info.
- **Public app program**: No public app store.
- **Notable existing integrations**: Built-in (not third-party): SMS + email campaigns, payouts, multi-currency payments, referral/promoter tracking. No named external CRM or DSP integrations on their public site.
- **Recent platform changes**: "Flite Creator" iOS app live; positions on real-time guest/sales/payment tracking.
- **Quirks / gotchas**: Note disambiguation — there are several unrelated "Flite" brands (Flite ad-tech, flitemedia.com record label, Flite synth plugin). The artist/event one is **flite.city**. No public API documentation found via web search; integrations appear to be partner-only / direct-business-development.
- **Fan data produced**: Ticket-purchase events (buyer name, email, phone, payment), guest-list RSVPs, promoter/referral attribution, SMS/email campaign engagement.
- **Last verified**: May 2026.

### UMG UK
- **What it is**: The UK division of Universal Music Group — major label, not a SaaS. Operates internal data platforms (UMA app, UMPG Window royalty portal) and ingests data from streaming/social rather than exposing it.
- **Developer docs URL**: No public developer documentation found. Closest public-facing surfaces: https://www.umgb2b.com (B2B trading login, behind-login), UMPG Window at https://umpgwindow.com (royalty portal, behind-login).
- **API base URL**: N/A.
- **Auth scheme**: No public API. Internal data flows are EDI (Transalis Cloud OpenEDI for retail trading partners) and direct streaming-platform feeds (Spotify, Apple Music, YouTube, Amazon, Pandora, Meta). Artist analytics are delivered through the UMA app, not an API.
- **Webhooks**: no.
- **Public app program**: No. Third-party access is by direct-BD only — examples include Audiense (audience-insights vendor consuming Twitter/Gnip on UMG's behalf) and Transalis (EDI for retail).
- **Notable existing integrations**: Inbound-only — Spotify, Apple Music, Amazon Music, YouTube, Facebook/Instagram, Pandora (royalty + listening data), Transalis EDI (retail), Audiense (social insights).
- **Quirks / gotchas**: UMG UK is **label-internal** — no public partner API for fan data. Treat as "no integration" for non-UMG-signed artists; for UMG-signed artists, request access through their label rep, not through an API.
- **Fan data produced**: To outside parties: effectively none. To UMG-signed artists via UMA: aggregated streaming counts + social follower metrics. No per-fan PII — platform-aggregated only.
- **Last verified**: May 2026.

---

## Cross-cutting observations

### Auth-scheme frequency

| Pattern | Count | Examples |
| --- | --- | --- |
| OAuth 2.0 | 4 | Eventbrite, Universe, Shopify, Instagram (Meta) |
| Bearer token (API key) | 3 | DICE.fm, Weeztix, Fourvenues |
| HMAC-signed request (key + secret) | 1 | Tixr |
| Per-organizer static token | 1 | Shotgun |
| Webhook-only outbound, no inbound API | 1 | Posh |
| Query-param identifier (not secret) | 1 | Bandsintown (`app_id`) |
| OAuth + EDI hybrid | 1 | Eventim partner |
| **No public API** | 12 | Tixel, FEVO, The Ticketing Co., GetIn, Merchtable, SET.live, Linktree, Seated, FanVids, FanMoments, Genni, Fandiem, Flite, UMG UK |

The takeaway: **almost half** the platforms have no public API. Many of those run partner-only or BD-only integration models. If the integration matters to a project, **start with a BD email** rather than spending engineering time reverse-engineering.

### Webhook signing convention

Every platform that does sign webhooks uses some form of HMAC-SHA256 keyed with the app secret:

| Platform | Header | Encoding |
| --- | --- | --- |
| Eventbrite | `x-eventbrite-signature` | base64 |
| Shopify | `X-Shopify-Hmac-Sha256` | base64 |
| Instagram (Meta) | `X-Hub-Signature-256` | hex (`sha256={hex}`) |
| Stripe (industry standard reference) | `Stripe-Signature` | hex with timestamp |
| Tixr | (header not publicly indexed) | HMAC-style |

The platforms with **unsigned webhooks** (Posh, Weeztix's webhooks tier, Eventim partner) all rely on URL secrecy + IP allowlists instead. If you receive their traffic, treat the URL as the secret and don't expose it in client code.

### "Pull through the primary platform" pattern

Three platforms shouldn't be integrated *directly*; you should pull their data through the primary ticketing platform that hosts the inventory:

- **Tixel** — read transfer/refund events from Eventbrite/DICE/Ticket Tailor/etc., not from Tixel
- **FEVO** — read order events from Ticketmaster/AXS/Paciolan, not from FEVO
- **Universe** — for Ticketmaster-flavored data, prefer the Ticketmaster Discovery API; for org-direct data, the Universe API is fine

This avoids duplicate ingestion and respects each platform's contractual model.

### Common gotchas across all platforms

1. **Webhook HMAC verification breaks if a body parser touches the bytes.** Always verify against the **raw, undecoded** request body before parsing. (Shopify, Eventbrite, Meta all share this footgun.)
2. **Webhooks emit at the org/account level, not per-event.** Subscribers must filter downstream. (Eventbrite, Tixr, Posh.)
3. **Consumer-domain GraphQL endpoints surprise REST-trained devs.** Universe and DICE both POST to `/graphql` rather than `api.<host>`.
4. **Per-organizer tokens require one credential per tenant.** Shotgun, Weeztix, Fourvenues — multi-tenant integrations need a credential vault.
5. **Brand collisions confuse search.** `Posh` (events) ≠ `PoshVine` (fintech); `Shotgun` (events) ≠ `Shotgun Software` (Autodesk); `Flite` (events) ≠ `Flite` (ad-tech, synth, label); `The Ticketing Co.` ≠ `TicketCo` (Norway, has API).
6. **Public docs disappear and resurface.** Eventbrite v2 → v3, Eventix → Weeztix, Universe → Ticketmaster developer portal. Always re-verify docs URLs; cached search results lie.
7. **EU platforms often default to non-English docs.** Fourvenues (ES default), Eventim (DE default), Weeztix (EN, but partner ops in NL).
8. **Sweepstakes / regulated data flows can't be self-served.** Fandiem requires legal review; SET.live requires a brand-sponsorship contract; UMG UK is label-internal.

---

## How to use this doc on a new project

When you (or another agent) need to integrate one of these platforms, the workflow is:

1. **Find the row** in the at-a-glance index → know immediately whether public API + webhooks exist.
2. **Read the per-platform section** for auth scheme, signing header, key endpoints, gotchas.
3. **If `❌ no public API`**, route to BD outreach — don't spend engineering cycles reverse-engineering.
4. **If `🔒 partner-only`**, contact their partner team (`apiteam@weeztix.com`, `partners@dice.fm`, `info@theticketing.co`) and request credentials before scoping work.
5. **If `✅ open`**, register for a developer/partner account and start with their public sandbox.
6. **Always verify the docs URL is still live** — these change. If the URL 404s, search for the platform's `/developers` or `/api` page; if neither exists, the platform may have deprecated the integration.
7. **Re-verify in this file's "Last verified"** column. If older than 6 months, re-research the auth scheme and webhook events before designing an implementation. Platform changes are the #1 source of integration-day surprise.

When updating this doc:
- Always include a "Last verified" date per platform
- Always include a direct quote / URL when claiming a specific endpoint or event name exists
- Never invent endpoints — if a platform's docs are paywalled, say so plainly

---

## Appendix — sources

Key sources verified during research:

**Tier 1 ticketing**:
- https://www.eventbrite.com/platform/docs
- https://partners-endpoint.dice.fm/graphql/docs/index.html
- https://support.posh.vip/en/articles/10723719
- https://tixrapi.docs.apiary.io/ + https://tixrwebhooks.docs.apiary.io/
- https://developers.universe.com/
- https://www.fevo.com/docs/v1
- https://tixel.com/us/integrations
- https://www.eventim-tixx.com/en/services/product-platform/interfaces-and-integrations
- https://docs.weeztix.com/docs/
- https://support-pro.shotgun.live/hc/en-us/articles/33561354477970-Find-your-Organizer-id-and-API-token
- https://docs.fourvenues.com/

**Commerce**:
- https://shopify.dev/docs/api
- https://shopify.dev/docs/apps/build/webhooks
- https://merchtable.com/

**Door / social**:
- https://www.max.live/setlive
- https://linktr.ee/marketplace/developer
- https://developers.facebook.com/docs/instagram-platform/
- https://developers.facebook.com/docs/instagram-platform/webhooks/
- https://help.artists.bandsintown.com/en/articles/9186477-api-documentation
- https://app.swaggerhub.com/apis-docs/Bandsintown/PublicAPI/3.0.0

**Niche / fan engagement**:
- https://www.seated.com/artists
- https://www.fanvids.io/faq
- https://genni.com/
- https://fandiem.com/partner-with-us
- https://www.flite.city/
- https://www.umgb2b.com/
