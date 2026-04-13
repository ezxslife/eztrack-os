# Mobile Navigation Audit — Flow Gaps & Missing Routes

> **Date:** 2026-04-11
> **Scope:** EZTrack `apps/mobile/app/` navigation structure, route transitions, deep links
> **Reference:** `mobile-plan/04-NAVIGATION-SHELL.md`, EZXS-OS navigation patterns

---

## Current Navigation Architecture

EZTrack mobile uses Expo Router file-based navigation with 5 route groups:

```
app/
├── (auth)/          # Stack — login flow
├── (tabs)/          # NativeTabs (iOS) / Tabs (Android) — 8 tab roots
├── (create)/        # Stack (fullScreenModal) — creation/edit forms
├── (detail)/        # Stack (card) — record detail views
├── (standalone)/    # Stack (card) — full-page list views (secondary modules)
└── settings/        # Stack — settings screens
```

### Navigation Files Built

| File | Purpose | Status |
|------|---------|--------|
| `src/navigation/tab-specs.ts` | Tab definitions + SF Symbols | ✅ |
| `src/navigation/native-header-items.tsx` | Native header button builders | ✅ |
| `src/navigation/stack-screen-options.ts` | Stack screen option presets | ✅ |
| `src/navigation/route-metadata.ts` | Route metadata for breadcrumbs | ✅ |
| `src/navigation/NativeHeaderContext.tsx` | Header context provider | ✅ |
| `src/navigation/TabRootStackLayout.tsx` | Reusable tab root stack layout | ✅ |
| `src/navigation/SearchableIndexStackLayout.tsx` | Stack layout with native search | ✅ |
| `src/navigation/useIOSNativeSearchHeader.ts` | iOS native search integration | ✅ |

---

## MISSING: Auth Flow Screens

### Current Auth Flow
```
login.tsx → [authenticated] → (tabs)/
```

### Target Auth Flow (from mobile-plan/03-AUTH-DATA-LAYER.md)
```
login.tsx → email/password auth
         → forgot-password.tsx          🔴 MISSING
         → magic-link-sent.tsx          🔴 MISSING
         → [org selection if multi-org] 🔴 MISSING
         → (tabs)/
```

| Screen | Path | Status | Notes |
|--------|------|--------|-------|
| Login | `(auth)/login.tsx` | ✅ | |
| Forgot password | `(auth)/forgot-password.tsx` | 🔴 | Email entry → reset link sent |
| Reset password | `(auth)/reset-password.tsx` | 🔴 | New password entry (deep link target) |
| Magic link sent | `(auth)/magic-link-sent.tsx` | 🔴 | Confirmation screen after magic link |
| Org selector | `(auth)/select-org.tsx` | 🔴 | When user belongs to multiple orgs |
| Invite acceptance | `(auth)/accept-invite.tsx` | 🔴 | Deep link from org invitation email |
| Onboarding | `(auth)/onboarding.tsx` | 🔴 | First-time user onboarding slides |

---

## MISSING: Tab Bar Configuration Gaps

### Current Tab Bar (8 tabs)
```
Dashboard | Daily Log | Incidents | Dispatch | Personnel | Analytics | Reports | More
```

### Issues & Enhancements

| Issue | Status | Fix Needed |
|-------|--------|------------|
| **Role-based tab visibility** | 🔴 Missing | Staff should see 5 tabs, Managers 7, Admins 8. Use `roleGating.ts` from mobile-plan |
| **Tab badge counts** | 🔴 Missing | Badge on Incidents (unresolved), Dispatch (active), Notifications (unread) |
| **Tab long-press** | 🔴 Missing | Long-press tab to see quick actions (e.g., long-press Incidents → "New Incident") |
| **iOS NativeTabs with SF Symbols** | 🟡 Partial | `_layout.ios.tsx` exists but needs verified SF Symbol mapping + liquid glass tab bar |
| **Android fallback** | 🟡 Partial | `_layout.tsx` exists but needs Material 3 bottom bar styling |
| **Scroll-to-top on tab re-tap** | 🔴 Missing | Re-tapping active tab should scroll list to top |
| **Tab bar hide on scroll** | 🔴 Missing | Option to hide tab bar on scroll for more content space |

### Role-Based Tab Mapping (Planned)

```typescript
// From mobile-plan — tab-specs.ts should implement:
const ROLE_TABS = {
  staff:     ['dashboard', 'daily-log', 'incidents', 'dispatch', 'more'],
  lead:      ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'more'],
  manager:   ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'analytics', 'more'],
  admin:     ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'analytics', 'reports', 'more'],
};
```

---

## MISSING: Deep Link Routes

Deep links are critical for push notification taps and cross-module navigation.

| Deep Link | Target Screen | Status | Trigger |
|-----------|--------------|--------|---------|
| `eztrack://incident/{id}` | `(detail)/incidents/[id]` | 🔴 | Push: "New incident reported" |
| `eztrack://dispatch/{id}` | `(detail)/dispatch/[id]` | 🔴 | Push: "Dispatch assigned to you" |
| `eztrack://daily-log/{id}` | `(detail)/daily-log/[id]` | 🔴 | Push: "Log entry requires review" |
| `eztrack://case/{id}` | `(detail)/cases/[id]` | 🔴 | Push: "Case assigned to you" |
| `eztrack://alert/{id}` | Alert detail (missing) | 🔴 | Push: "Emergency alert" |
| `eztrack://briefing/{id}` | `(detail)/briefings/[id]` | 🔴 | Push: "New briefing posted" |
| `eztrack://work-order/{id}` | `(detail)/work-orders/[id]` | 🔴 | Push: "Work order assigned" |
| `eztrack://notification` | Notifications list | 🔴 | Push: Generic notification tap |
| `eztrack://auth/reset?token=X` | Password reset | 🔴 | Email: Password reset link |
| `eztrack://auth/invite?token=X` | Invite acceptance | 🔴 | Email: Org invitation link |

### Deep Link Configuration Needed

```typescript
// app.config.ts — add:
scheme: 'eztrack',
intentFilters: [
  { action: 'VIEW', data: [{ scheme: 'eztrack' }] }
],
// Universal links for web → app:
associatedDomains: ['applinks:app.eztrack.com'],
```

---

## MISSING: Modal Flows & Sheet Routes

### Quick-Action Modals (from More tab or contextual)

| Flow | Presentation | Status | Notes |
|------|-------------|--------|-------|
| Quick-create incident | `fullScreenModal` | 🔴 | Streamlined 3-field incident creation |
| Quick-create dispatch | `fullScreenModal` | 🔴 | Streamlined dispatch creation |
| Quick-add log entry | `formSheet` | 🔴 | Single-field log entry |
| Scanner (QR/barcode) | `fullScreenModal` | 🔴 | QR scan for visitor check-in, lost & found |
| Search (global) | `formSheet` | 🔴 | Universal search across all modules |
| Org switcher | `formSheet` | 🔴 | Switch between organizations |
| Filter panel | `formSheet` | 🔴 | Advanced filters for any list |

### Confirmation Sheets (Contextual)

| Sheet | Trigger | Status |
|-------|---------|--------|
| Delete confirmation | Any delete action | 🔴 |
| Status change confirmation | Changing incident/dispatch status | 🔴 |
| Archive confirmation | Archiving records | 🔴 |
| Close shift confirmation | Ending a shift | 🔴 |
| Transfer confirmation | Transferring record to another officer | 🔴 |

---

## MISSING: Cross-Module Navigation Flows

These flows involve navigating between modules and need smooth transitions.

### Flow 1: Incident → Dispatch (P0)

```
Incident detail → "Create Dispatch" button
  → (create)/dispatch/new.tsx (pre-filled with incident location + description)
  → On save → return to incident detail with dispatch linked
```
**Status:** 🔴 Not connected

### Flow 2: Dispatch → Incident (P0)

```
Dispatch detail → "View Incident" link
  → (detail)/incidents/[id].tsx
```
**Status:** 🔴 Not connected

### Flow 3: Incident → Case Escalation (P1)

```
Incident detail → "Escalate to Case" action
  → (create)/cases/new.tsx (pre-filled from incident data)
  → On save → return to incident with case linked
```
**Status:** 🔴 Not connected

### Flow 4: Patron → Incident History (P1)

```
Patron detail → "Incidents" tab
  → Filtered incident list for this patron
  → Tap incident → (detail)/incidents/[id].tsx
```
**Status:** 🔴 Not connected

### Flow 5: Dashboard → Module Drill-Down (P0)

```
Dashboard KPI card (e.g., "12 Active Incidents") → tap
  → (tabs)/incidents/index.tsx with "Active" filter pre-applied
```
**Status:** 🔴 Not connected

### Flow 6: Notification → Target Record (P0)

```
Push notification → tap
  → Deep link to (detail)/[module]/[id]
  → Back button returns to wherever user was
```
**Status:** 🔴 Not connected (requires deep link setup)

### Flow 7: More Tab → Secondary Modules (P0)

```
More tab → Tap "Cases"
  → (standalone)/cases/index.tsx
  → Tap case → (detail)/cases/[id].tsx
  → Edit → (create)/cases/edit/[id].tsx
```
**Status:** 🟡 Screens exist but navigation links from More tab not wired

### Flow 8: Global Search → Any Record (P1)

```
Search bar (any screen) → type query
  → Results grouped by module (incidents, dispatches, personnel, etc.)
  → Tap result → (detail)/[module]/[id]
```
**Status:** 🔴 Not built

---

## MISSING: Navigation Utilities

| Utility | Purpose | Status | EZXS-OS Reference |
|---------|---------|--------|-------------------|
| **Route history store** | Track navigation for "recently viewed" | 🔴 | `routeHistoryStore.ts` |
| **Mode route mapper** | Map routes between modes (if role-based views differ) | 🔴 | `modeRouteMapper.ts` |
| **Navigation type defs** | TypeScript route param types for all routes | 🔴 | `types/navigation.ts` |
| **Breadcrumb trail** | Show navigation path in detail views | 🔴 | N/A (web has breadcrumbs) |
| **Back destination override** | Custom "back" targets (e.g., save → go to list, not form) | 🔴 | Common pattern |

---

## ENHANCEMENT: Existing Layout Files

### `app/_layout.tsx` (Root)

**Current:** Basic provider chain + route registration.
**Needs:**
- Theme hydration gate (wait for MMKV)
- Auth state gate (redirect to auth if not logged in)
- Deep link handling setup
- Splash screen hold until hydrated
- Error boundary wrapping
- Notification listener registration

### `app/(tabs)/_layout.tsx` and `_layout.ios.tsx`

**Current:** Basic tab configuration.
**Needs:**
- Role-based tab filtering from `tab-specs.ts`
- Badge count integration (real-time from Supabase)
- SF Symbol mapping verification
- Liquid glass tab bar on iOS 26
- Custom tab bar press handlers (scroll-to-top, long-press)
- Tab bar hide on scroll option

### `app/(create)/_layout.tsx`

**Current:** Basic stack layout with modal presentation.
**Needs:**
- `fullScreenModal` presentation style
- Swipe-to-dismiss with unsaved changes warning
- Glass header with "Cancel" (left) and "Save" (right) buttons
- Auto-save draft on dismiss

### `app/(detail)/_layout.tsx`

**Current:** Basic stack layout with card presentation.
**Needs:**
- `card` presentation with native push transition
- Transparent-at-rest header for immersive hero (maps, photos)
- Share button in header right
- Context menu (long-press) for edit/delete/archive

### `app/(standalone)/_layout.tsx`

**Current:** Basic stack layout.
**Needs:**
- Native search header integration
- Filter button in header right
- Sort button in header right
- Badge count in header (unresolved items)

---

## PRIORITY IMPLEMENTATION ORDER

1. **Auth flow completion** — forgot-password, org selector, onboarding
2. **Role-based tab filtering** — staff vs. manager vs. admin tabs
3. **Cross-module navigation** — incident↔dispatch, dashboard→drill-down, more→standalone
4. **Deep link setup** — push notification targets, email links
5. **Modal flows** — quick-create, global search, org switcher
6. **Tab enhancements** — badges, scroll-to-top, long-press
7. **Layout enhancements** — hydration gate, auth gate, error boundaries
8. **Navigation utilities** — route history, type defs, breadcrumbs
