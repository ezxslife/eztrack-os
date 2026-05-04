# supabase/

Schema migrations + Edge Functions for ezxs-track (Events Mode on top of eztrack-os).

## Layout

```
supabase/
├─ README.md                   ← you are here
├─ migrations/
│  ├─ 0000_BASELINE_README.md  ← run `supabase db pull` to seed 0000_baseline.sql
│  ├─ 0001_workspace_venue_mode.sql
│  ├─ 0002_profiles_phone_oauth.sql
│  ├─ 0030_events_event_days.sql
│  ├─ 0031_customers_tickets.sql
│  ├─ 0032_orders.sql
│  ├─ 0033_check_ins_capacity_snapshots.sql
│  ├─ 0034_shift_assignments.sql
│  ├─ 0035_staff_event_grants.sql
│  ├─ 0036_incident_escalation_rules.sql
│  ├─ 0037_wall_display_sessions.sql
│  ├─ 0038_scan_webhooks.sql
│  ├─ 0099_rls_events.sql
│  └─ 0100_realtime_publication_events.sql
└─ functions/
   ├─ _shared/
   │  ├─ supabase.ts          (service-role client for Edge Functions)
   │  ├─ cors.ts              (CORS preflight helper)
   │  └─ signature.ts         (HMAC verification for inbound webhooks)
   ├─ eventbrite-webhook/
   │  └─ index.ts             (receives `attendee.checked_in`, `order.placed`, etc.)
   ├─ stripe-webhook/
   │  └─ index.ts             (receives `terminal.reader.action_succeeded`, `charge.refunded`)
   └─ checkin-router/
      └─ index.ts             (canonical writer — fans in from webhooks, POS, manual-lookup, own-scanner)
```

## First-run order

```bash
# 1. Snapshot the existing live schema into 0000_baseline.sql
supabase link --project-ref <your-project-ref>
supabase db pull -f supabase/migrations/0000_baseline.sql
# Review the diff. Commit the baseline.

# 2. Apply events-domain migrations (in order)
supabase db push

# 3. Deploy Edge Functions
supabase functions deploy eventbrite-webhook --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy checkin-router

# 4. Set webhook URLs in providers
#    - Eventbrite:    POST https://<project>.supabase.co/functions/v1/eventbrite-webhook
#    - Stripe:        POST https://<project>.supabase.co/functions/v1/stripe-webhook
#    - Verify with: supabase functions logs eventbrite-webhook
```

## Environment variables required at deploy time

Set as Supabase secrets via `supabase secrets set KEY=VALUE`:

```
EVENTBRITE_WEBHOOK_SECRET=<from Eventbrite app settings>
STRIPE_WEBHOOK_SECRET=<from stripe dashboard>
SUPABASE_SERVICE_ROLE_KEY=<already set by Supabase>
```

## Naming conventions used in new migrations

- `org_id` for tenant scope (matches eztrack-os existing convention; do **not** use `workspace_id`)
- `created_at`, `updated_at` (timestamptz, default `now()`)
- `deleted_at` (timestamptz, nullable — soft-delete pattern matching eztrack-os)
- `record_number` text via `next_record_number(prefix text)` RPC for user-facing IDs (matches eztrack-os pattern; e.g. `EVT-00012`, `TKT-08372`)
- snake_case for table + column names
- Foreign keys: `<table>_id` (e.g. `event_id`, `event_day_id`, `personnel_id`)
- Enums declared via `CREATE TYPE` in the same migration that introduces them
- RLS policies live in dedicated `0099_rls_events.sql` to keep table migrations tidy

## See also

- `/plan.md` — full Events-Mode build plan
- `/L0-NOTES.md` — L0 sprint notes + manual setup steps
