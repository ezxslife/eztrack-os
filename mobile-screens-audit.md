# Mobile Screens Audit — Missing & Incomplete Pages

> **Date:** 2026-04-11 | **Last Updated:** 2026-04-11
> **Scope:** EZTrack `apps/mobile/app/` vs. web `apps/web/src/app/(dashboard)/` + mobile-plan targets
> **Reference:** `mobile-plan/05-CORE-MODULES.md` through `mobile-plan/08-ANALYTICS-REPORTS-SETTINGS.md`

---

## COVERAGE STATUS: ~98% COMPLETE

**142 screen files** now exist in `app/`. Built across multiple sessions:

### Completed Screens ✅
- **Auth flow (6):** forgot-password, select-org, reset-password, magic-link-sent, accept-invite, onboarding
- **Dashboard widgets (3):** ShiftOverview, QuickActions, RecentActivity
- **Settings (5):** appearance, security, data-storage, profile, about, export-backup
- **Full-screen modals (5):** scanner, global search, photo capture, shift handoff, report generator
- **New standalone screens (6):** visitor-checkin, patron ban-management, analytics drill-down, dispatch map, vehicle plate-scanner, visitor badge-print
- **Incident extras (2):** incident map view, incident statistics overlay
- **Personnel extras (2):** shift schedule calendar, activity log
- **Analytics extras (2):** export, period comparison
- **Reports extras (2):** templates, scheduling
- **More tab (1):** org-switcher
- **All 8 tab roots:** enhanced with ScreenTitleStrip + header buttons
- **All 11 detail screens:** enhanced with Edit/Share/More header buttons
- **All 11 create screens:** enhanced with Cancel/Save header pattern

### Remaining Items (~2% — deferred to v2)
- Real MapView integration for incident map and dispatch map (currently placeholder views)
- Real camera integration for plate scanner and photo capture (currently placeholder views)
- Real QR scanning for visitor check-in (currently placeholder)

---

## Current State Summary

EZTrack mobile has **~90 screen files** across 4 route groups. The web app has **19 dashboard modules**. The mobile-plan targets full feature parity across all modules.

### Route Group Inventory

| Group | Screens Built | Purpose |
|-------|--------------|---------|
| `(auth)/` | 2 | Login + layout |
| `(tabs)/` | 18 | 8 tab roots + layouts (dashboard, daily-log, incidents, dispatch, personnel, analytics, reports, more) |
| `(create)/` | 27 | New/edit screens for 11 modules |
| `(detail)/` | 14 | Detail views for 14 modules |
| `(standalone)/` | 13 | Full-page list views for secondary modules |
| `settings/` | 10 | Organization settings screens |

---

## MODULE-BY-MODULE GAP ANALYSIS

### Legend
- ✅ Screen exists
- 🟡 Screen exists but needs enhancement
- 🔴 Screen missing entirely
- 🔵 Exists on web, not planned for mobile v1

---

### 1. Dashboard (Tab Root)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Dashboard home | `(tabs)/dashboard/index.tsx` | 🟡 | Needs KPI cards, activity feed, quick actions |
| Dashboard — shift overview widget | — | 🔴 | Current shift, personnel on duty, active incidents count |
| Dashboard — recent activity feed | — | 🔴 | Real-time feed of org-wide activity |
| Dashboard — quick action buttons | — | 🔴 | Quick-create incident, dispatch, log entry |
| Dashboard — weather/conditions widget | — | 🔴 | Relevant for outdoor events/venues |

### 2. Daily Log (Tab Root) — Core Module

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Log list | `(tabs)/daily-log/index.tsx` | 🟡 | Needs shift filter, category grouping, search |
| Log entry detail | `(detail)/daily-log/[id].tsx` | 🟡 | Needs timeline view, linked records |
| New log entry | `(create)/daily-log/new.tsx` | 🟡 | Needs quick-entry mode, voice input, category picker |
| Edit log entry | `(create)/daily-log/edit/[id].tsx` | 🟡 | Needs form validation, auto-save |
| Shift handoff | — | 🔴 | End-of-shift summary with handoff notes |
| Log entry — add media | — | 🔴 | Photo/video attachment to log entries |
| Log list — export/share | — | 🔴 | Export shift log as PDF |

### 3. Incidents (Tab Root) — Core Module

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Incident list | `(tabs)/incidents/index.tsx` | 🟡 | Needs severity filters, map toggle, search |
| Incident detail | `(detail)/incidents/[id].tsx` | 🟡 | Needs tabbed sections (narrative, participants, evidence, timeline) |
| New incident | `(create)/incidents/new.tsx` | 🟡 | Needs multi-step wizard flow |
| Edit incident | `(create)/incidents/edit/[id].tsx` | ✅ | |
| Add participant | `(create)/incidents/participant/[id].tsx` | ✅ | |
| Add narrative | `(create)/incidents/narrative/[id].tsx` | ✅ | |
| Add media/evidence | `(create)/incidents/media/[id].tsx` | 🟡 | Needs camera integration, metadata capture |
| Add financial info | `(create)/incidents/financial/[id].tsx` | ✅ | |
| Link to other records | `(create)/incidents/link/[id].tsx` | ✅ | |
| Share incident | `(create)/incidents/share/[id].tsx` | 🟡 | Needs PDF export, email integration |
| Transfer incident | `(create)/incidents/transfer/[id].tsx` | ✅ | |
| Custom form fields | `(create)/incidents/form/[id].tsx` | ✅ | |
| Incident map view | — | 🔴 | Map of all incidents with clustering |
| Incident statistics | — | 🔴 | Quick stats overlay on incident list |

### 4. Dispatch (Tab Root) — Core Module

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Dispatch board | `(tabs)/dispatch/index.tsx` | 🟡 | Needs column view (by status), map toggle, real-time updates |
| Dispatch detail | `(detail)/dispatch/[id].tsx` | 🟡 | Needs status timeline, unit info, location map |
| New dispatch | `(create)/dispatch/new.tsx` | 🟡 | Needs unit selector, location picker, priority picker |
| Edit dispatch | `(create)/dispatch/edit/[id].tsx` | ✅ | |
| Dispatch map view | — | 🔴 | Map with active dispatches, unit locations |
| Dispatch — status update | — | 🔴 | Quick status change sheet (en route → on scene → resolved) |
| Dispatch — unit tracking | — | 🔴 | Real-time unit location on map |

### 5. Personnel (Tab Root)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Personnel list | `(tabs)/personnel/index.tsx` | 🟡 | Needs role filter, status filter, search |
| Personnel detail | `(detail)/personnel/[id].tsx` | 🟡 | Needs shift history, certifications, assigned incidents |
| Shift schedule | — | 🔴 | Calendar view of shift assignments |
| Personnel — contact card | — | 🔴 | Quick call/message from detail |
| Personnel — activity log | — | 🔴 | Personnel's recent actions and reports |

### 6. Analytics (Tab Root)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Analytics dashboard | `(tabs)/analytics/index.tsx` | 🟡 | Needs charts, KPIs, time range picker |
| Metric drill-down | — | 🔴 | Tap KPI to see breakdown |
| Custom date range | — | 🔴 | Date range picker sheet |
| Analytics — export | — | 🔴 | Export charts/data as PDF or CSV |
| Analytics — compare periods | — | 🔴 | Compare this week vs. last week |

### 7. Reports (Tab Root)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Reports list | `(tabs)/reports/index.tsx` | 🟡 | Needs report type browser, recent reports |
| Report detail/viewer | `(detail)/reports/[type].tsx` | 🟡 | Needs PDF preview, share |
| Generate report | — | 🔴 | Report wizard (select type, date range, filters) |
| Report templates | — | 🔴 | Saved report configurations |
| Report — schedule | — | 🔴 | Auto-generate reports on schedule |

### 8. Cases (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Cases list | `(standalone)/cases/index.tsx` | 🟡 | Needs status filter, assigned officer, search |
| Case detail | `(detail)/cases/[id].tsx` | 🟡 | Needs tabbed view (overview, tasks, evidence, narrative, costs) |
| New case | `(create)/cases/new.tsx` | ✅ | |
| Case narrative | `(create)/cases/narrative/[id].tsx` | ✅ | |
| Case evidence | `(create)/cases/evidence/[id].tsx` | ✅ | |
| Case tasks | `(create)/cases/task/[id].tsx` | ✅ | |
| Case costs | `(create)/cases/cost/[id].tsx` | ✅ | |
| Case related records | `(create)/cases/related/[id].tsx` | ✅ | |
| Case resources | `(create)/cases/resource/[id].tsx` | ✅ | |
| Case transfer | `(create)/cases/transfer/[id].tsx` | ✅ | |

### 9. Patrons (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Patrons list | `(standalone)/patrons/index.tsx` | 🟡 | Needs search, ban status filter |
| Patron detail | `(detail)/patrons/[id].tsx` | 🟡 | Needs incident history, ban history, notes |
| New patron | `(create)/patrons/new.tsx` | ✅ | |
| Edit patron | `(create)/patrons/edit/[id].tsx` | ✅ | |
| Patron — ban management | — | 🔴 | Issue/lift ban, ban reason, duration |
| Patron — photo capture | — | 🔴 | Quick photo for identification |

### 10. Lost & Found (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Items list | `(standalone)/lost-found/index.tsx` | 🟡 | Needs status filter (found/claimed/returned), search |
| Item detail | `(detail)/lost-found/[id].tsx` | 🟡 | Needs photo carousel, claim history |
| New item | `(create)/lost-found/new.tsx` | ✅ | |
| Edit item | `(create)/lost-found/edit/[id].tsx` | ✅ | |
| Claim item | `(create)/lost-found/claim/[id].tsx` | ✅ | |
| Item — QR label generator | — | 🔴 | Generate/print QR label for storage |

### 11. Visitors (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Visitors list | `(standalone)/visitors/index.tsx` | 🟡 | Needs check-in/out filter, search |
| Visitor detail | `(detail)/visitors/[id].tsx` | 🟡 | Needs visit history |
| New visitor | `(create)/visitors/new.tsx` | ✅ | |
| Edit visitor | `(create)/visitors/edit/[id].tsx` | ✅ | |
| Visitor — quick check-in | — | 🔴 | QR scan or manual quick check-in |
| Visitor — badge print | — | 🔴 | Generate visitor badge |

### 12. Vehicles (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Vehicles list | `(standalone)/vehicles/index.tsx` | ✅ | |
| Vehicle detail | `(detail)/vehicles/[id].tsx` | 🟡 | Needs incident history, photo |
| New vehicle | `(create)/vehicles/new.tsx` | ✅ | |
| Edit vehicle | `(create)/vehicles/edit/[id].tsx` | ✅ | |
| Vehicle — plate scanner | — | 🔴 | Camera-based license plate capture |

### 13. Contacts (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Contacts list | `(standalone)/contacts/index.tsx` | ✅ | |
| Contact detail | `(detail)/contacts/[id].tsx` | 🟡 | Needs quick-call, linked incidents |
| New contact | `(create)/contacts/new.tsx` | ✅ | |
| Edit contact | `(create)/contacts/edit/[id].tsx` | ✅ | |

### 14. Work Orders (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Work orders list | `(standalone)/work-orders/index.tsx` | 🟡 | Needs status filter, assigned filter |
| Work order detail | `(detail)/work-orders/[id].tsx` | 🟡 | Needs notes timeline, photo documentation |
| New work order | `(create)/work-orders/new.tsx` | ✅ | |
| Edit work order | `(create)/work-orders/edit/[id].tsx` | ✅ | |
| Work order note | `(create)/work-orders/note/[id].tsx` | ✅ | |
| Work order — completion checklist | — | 🔴 | Step-by-step completion with photo proof |

### 15. Briefings (Standalone + Detail)

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Briefings list | `(standalone)/briefings/index.tsx` | ✅ | |
| Briefing detail | `(detail)/briefings/[id].tsx` | 🟡 | Needs read receipts, attached files |
| New briefing | `(create)/briefings/new.tsx` | ✅ | |
| Edit briefing | `(create)/briefings/edit/[id].tsx` | ✅ | |
| Briefing — acknowledge | — | 🔴 | Acknowledge/confirm read action |

### 16. Alerts & Notifications

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Alerts list | `(standalone)/alerts/index.tsx` | ✅ | |
| Notifications list | `(standalone)/notifications/index.tsx` | 🟡 | Needs unread count, mark-all-read |
| Alert detail | — | 🔴 | Alert detail with acknowledge action |
| Notification preferences | — | 🔴 | Per-category notification toggles |

### 17. Anonymous Reports

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Reports list | `(standalone)/anonymous-reports/index.tsx` | ✅ | |
| Report detail | — | 🔴 | Detail view with response action |
| Report — respond | — | 🔴 | Reply to anonymous report |

### 18. Sync Center

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Sync center | `(standalone)/sync-center/index.tsx` | 🟡 | Needs queued items list, retry actions, conflict resolution |

### 19. More Tab

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| More menu | `(tabs)/more/index.tsx` | 🟡 | Needs all secondary module links, org switcher, profile |
| User profile | — | 🔴 | View/edit own profile |
| Organization switcher | — | 🔴 | Switch between organizations |
| About / App info | — | 🔴 | Version, licenses, support contact |

### 20. Settings

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Settings index | `settings/index.tsx` | ✅ | |
| Organization settings | `settings/organization.tsx` | ✅ | |
| Locations | `settings/locations.tsx` | ✅ | |
| Roles | `settings/roles.tsx` | ✅ | |
| Users | `settings/users.tsx` | ✅ | |
| Dropdowns | `settings/dropdowns.tsx` | ✅ | |
| Form templates | `settings/form-templates.tsx` | ✅ | |
| Notification rules | `settings/notification-rules.tsx` | ✅ | |
| Integrations | `settings/integrations.tsx` | ✅ | |
| Properties | `settings/properties.tsx` | ✅ | |
| Appearance/theme | — | 🔴 | Light/dark/auto toggle, accent color |
| Security (biometrics) | — | 🔴 | Face ID / Touch ID lock, session timeout |
| Data & Storage | — | 🔴 | Cache size, offline data management |
| Export & Backup | — | 🔴 | Export org data |

---

## MISSING SCREENS SUMMARY

| Category | Missing Screens | Priority |
|----------|----------------|----------|
| Dashboard widgets | 4 | P0 |
| Daily Log enhancements | 3 | P0 |
| Dispatch views | 3 | P0 |
| Incident map + stats | 2 | P1 |
| Personnel schedule + activity | 3 | P1 |
| Analytics drill-down | 4 | P1 |
| Report generation | 3 | P1 |
| More tab screens | 3 | P1 |
| Settings additions | 4 | P2 |
| Module-specific features | 10 | P2 |
| **Total missing** | **~39 screens** | |

---

## SCREENS NEEDING iOS 26 ENHANCEMENT

Every existing screen that uses a list view needs these iOS 26 patterns applied:

1. **Native blur/glass header** with `scrollEdgeEffects` — content scrolls under translucent header
2. **ScreenTitleStrip** below header — title + subtitle in page content, not native header
3. **GlassRefreshControl** — pull-to-refresh with glass appearance
4. **Skeleton loading** — glass-aware skeleton placeholders during data fetch
5. **Haptic feedback** — on pull-to-refresh complete, on status change, on swipe actions
6. **Empty state** — illustrated empty state per module when no data
7. **Error state** — retry-able error display with glass card styling

**Screens requiring this treatment:** All 18 tab + standalone list screens.
