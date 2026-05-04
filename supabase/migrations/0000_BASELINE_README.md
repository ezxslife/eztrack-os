# 0000_baseline.sql — placeholder

The baseline snapshot of the existing eztrack-os live schema is **not** committed yet because Claude doesn't have your Supabase project credentials.

## Run this on your Mac, once

```bash
cd /Users/rostam/Desktop/Projects/Sauce/ezxs-track

# Install the Supabase CLI if you haven't:
#   brew install supabase/tap/supabase

# Link to your existing eztrack-os project
supabase link --project-ref <YOUR_EZTRACK_OS_PROJECT_REF>
# You'll be prompted for your database password.

# Pull the live schema into a baseline migration
supabase db pull -f supabase/migrations/0000_baseline.sql

# Inspect the diff — should include all existing tables:
#   profiles · personnel · dispatches · incidents · briefings · cases ·
#   work_orders · lost_found · patrons · visitors · vehicles · contacts ·
#   daily_logs · anonymous_reports · alerts · notifications · settings · etc.
git status

# Commit
git add supabase/migrations/0000_baseline.sql
git commit -m "supabase: snapshot baseline schema"

# Then DELETE THIS FILE — it has served its purpose.
rm supabase/migrations/0000_BASELINE_README.md
git add -u && git commit -m "supabase: drop baseline placeholder readme"
```

## Why we need this

- The events-domain migrations (`0001+`) reference existing tables (`profiles`, `personnel`, `incidents`, `briefings`, `lost_found`, `work_orders`, `anonymous_reports`, `patrons`, `visitors`) via foreign keys.
- Without the baseline checked in, anyone running `supabase db push` against a fresh local Supabase instance will fail because those parent tables don't exist.
- The baseline + the new migrations together must be replayable end-to-end on a fresh Postgres.

## What the baseline must include

At minimum, these tables (verified via the eztrack-os feature list and `apps/web/src/lib/queries/`):

```
auth.users                       (Supabase-managed)
public.profiles                  (id FK auth.users, org_id, full_name, role, ...)
public.organizations             (or whatever name eztrack-os uses for the org table)
public.personnel
public.dispatches
public.incidents
public.briefings
public.cases
public.work_orders
public.lost_found
public.patrons
public.visitors
public.vehicles
public.contacts
public.daily_logs
public.anonymous_reports
public.alerts
public.notifications
public.analytics                 (or views — confirm)
public.reports                   (or views — confirm)
public.settings
```

Plus enums:
```
case_status · incident_status · incident_severity ·
dispatch_priority · dispatch_status · work_order_status ·
lost_found_status · daily_log_status · patron_flag
```

Plus the `next_record_number(prefix text)` RPC and any existing RLS policies.
