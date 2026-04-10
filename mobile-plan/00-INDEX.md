# EZTrack Mobile App — Master Plan Index

> **Codename:** AEGIS Mobile
> **Reference Architecture:** EZXS-OS Mobile (Expo 55 + React Native 0.83 + iOS 26 Liquid Glass)
> **Target:** Full feature parity with EZTrack web, native iOS-first design
> **Backend:** Shared Supabase (same project, same RLS, same types)

---

## Plan Documents

| Phase | Document | Focus | Est. Duration |
|-------|----------|-------|---------------|
| 1 | [01-FOUNDATION.md](./01-FOUNDATION.md) | Monorepo setup, Expo config, shared packages, CI/CD | 3–4 days |
| 2 | [02-DESIGN-SYSTEM.md](./02-DESIGN-SYSTEM.md) | iOS 26 Liquid Glass theme, colors, typography, glass components, fallbacks | 3–4 days |
| 3 | [03-AUTH-DATA-LAYER.md](./03-AUTH-DATA-LAYER.md) | Supabase client, auth flow, Zustand stores, MMKV, React Query | 3–4 days |
| 4 | [04-NAVIGATION-SHELL.md](./04-NAVIGATION-SHELL.md) | Tab bar, stack navigators, header patterns, role-based routing | 2–3 days |
| 5 | [05-CORE-MODULES.md](./05-CORE-MODULES.md) | Daily Log, Incidents, Dispatch — the critical operations trio | 5–7 days |
| 6 | [06-SECONDARY-MODULES.md](./06-SECONDARY-MODULES.md) | Cases, Patrons, Personnel, Lost & Found | 4–5 days |
| 7 | [07-SUPPORT-MODULES.md](./07-SUPPORT-MODULES.md) | Visitors, Vehicles, Contacts, Work Orders, Briefings | 4–5 days |
| 8 | [08-ANALYTICS-REPORTS-SETTINGS.md](./08-ANALYTICS-REPORTS-SETTINGS.md) | Analytics dashboards, report generation, org settings | 3–4 days |
| 9 | [09-REALTIME-NOTIFICATIONS-OFFLINE.md](./09-REALTIME-NOTIFICATIONS-OFFLINE.md) | Supabase Realtime, push notifications, offline-first sync | 3–4 days |
| 10 | [10-POLISH-TESTING-RELEASE.md](./10-POLISH-TESTING-RELEASE.md) | Accessibility, testing, performance, App Store submission | 3–4 days |
| 11 | [11-ADVANCED-PATTERNS.md](./11-ADVANCED-PATTERNS.md) | Coach marks, global search, QR scanner, skeletons, map, biometrics, swipe actions, haptics, accessibility, quick actions, error recovery | Reference |
| 12 | [12-STORE-ARCHITECTURE.md](./12-STORE-ARCHITECTURE.md) | Complete Zustand store inventory, persistence tiers, draft store, filter store, cleanup on auth boundaries, hydration gate | Reference |
| 13 | [13-IOS26-DESIGN-REFERENCE.md](./13-IOS26-DESIGN-REFERENCE.md) | iOS 26 Liquid Glass standards, three-tier rendering, header patterns, glass components, color system, typography, animations, haptics, accessibility, decision flowcharts | Reference |

**Total estimated: 5–7 weeks** (with parallel work across phases)

> Phases 11–13 are **reference documents** — not sequential phases. They provide implementation details to be integrated into Phases 1–10 during development.

---

## Architecture Principles (Learned from EZXS-OS)

1. **Three-tier rendering:** Every visual component renders in three tiers — Glass (iOS 26+), Blur (iOS 18–25), Opaque (Android/older). Never assume glass availability.

2. **Shared packages first:** Types, enums, validation schemas, and constants live in `packages/shared`. The mobile app imports them — never duplicates.

3. **Native tabs on iOS:** Use `NativeTabs` from expo-router on iOS for native tab bar with SF Symbols. Custom `Tabs` fallback on Android.

4. **Header content separation:** Real screen titles go in `ScreenTitleStrip` (in page content), not in the native header. Native header stays minimal (back button, action buttons).

5. **Theme hydration gate:** Never render UI until `uiStore._hasHydrated` is true. Color scheme must load from MMKV before first frame.

6. **Auth lifecycle FSM:** Use a finite state machine for auth lifecycle: `initializing → authenticating → onboarding → active → signed_out → error`.

7. **Offline-first by default:** Critical operations (daily log entry, incident report) queue locally and sync when online. SQLite + MMKV for persistence.

8. **Suite-path API calls:** All Supabase calls use direct client queries (not edge functions) matching the web pattern. Same `getSupabaseBrowser()` singleton.

9. **Role-gated UI:** Navigation items and actions are gated by the 7-tier role hierarchy. Staff sees dispatch; Managers see analytics; Admins see settings.

10. **Haptic feedback:** Every primary action (submit, status change, toggle) gets appropriate haptic feedback, gated by user preference.

---

## What Gets Shared vs. Built Fresh

### Shared from `packages/` (reuse as-is)
- `packages/shared/src/types.ts` — All domain types (Organization, Incident, Dispatch, etc.)
- `packages/shared/src/enums.ts` — All status/role/priority enums
- `packages/shared/src/constants.ts` — Status colors, priority colors, dispatch codes, nav items
- `packages/shared/src/validation.ts` — All Zod schemas (13 modules)
- `packages/shared/src/utils.ts` — Shared utilities
- `packages/api/src/supabase.ts` — Supabase client factory (adapt for React Native)
- `packages/ui/src/tokens.ts` — Brand colors, typography scales, spacing

### Built Fresh for Mobile
- `apps/mobile/src/theme/` — React Native theme system with iOS 26 glass
- `apps/mobile/src/components/ui/` — Native component library (glass-tier aware)
- `apps/mobile/src/navigation/` — Expo Router file-based navigation
- `apps/mobile/src/stores/` — Zustand stores with MMKV persistence
- `apps/mobile/src/lib/api/` — React Query hooks wrapping Supabase queries
- `apps/mobile/src/hooks/` — Platform-specific hooks (haptics, glass detection, safe areas)
- `apps/mobile/app/` — Screen files (Expo Router)

---

## Key Dependencies (from EZXS-OS reference)

```
expo: ~55.0.0
react-native: ~0.83.0
react: ~19.2.0
expo-router: ~5.0.0
@supabase/supabase-js: ^2.49.0
zustand: ^5.0.0
react-native-mmkv: ^3.2.0
@tanstack/react-query: ^5.0.0
expo-blur: ~14.1.0
expo-glass-effect: ~0.1.0
expo-haptics: ~14.0.0
react-native-reanimated: ~3.17.0
react-native-gesture-handler: ~2.30.0
react-native-safe-area-context: ~5.4.0
@gorhom/bottom-sheet: ^5.2.0
zod: ^3.23.0
date-fns: ^4.1.0
lucide-react-native: ^0.460.0
```

---

## File Structure Target

```
apps/mobile/
├── app/
│   ├── _layout.tsx                    # Root: providers, theme gate, auth gate
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx                # NativeTabs (iOS) / Tabs (Android)
│   │   ├── dashboard/index.tsx
│   │   ├── daily-log/index.tsx
│   │   ├── dispatch/index.tsx
│   │   ├── incidents/index.tsx
│   │   └── more/index.tsx
│   ├── (detail)/
│   │   ├── incidents/[id].tsx
│   │   ├── daily-log/[id].tsx
│   │   ├── dispatch/[id].tsx
│   │   ├── cases/[id].tsx
│   │   ├── patrons/[id].tsx
│   │   ├── personnel/[id].tsx
│   │   ├── lost-found/[id].tsx
│   │   ├── work-orders/[id].tsx
│   │   ├── visitors/[id].tsx
│   │   └── vehicles/[id].tsx
│   ├── (create)/
│   │   ├── incident.tsx
│   │   ├── daily-log.tsx
│   │   ├── dispatch.tsx
│   │   └── [module].tsx               # Generic create screen
│   ├── settings/
│   │   ├── index.tsx
│   │   ├── organization.tsx
│   │   ├── locations.tsx
│   │   └── profile.tsx
│   ├── analytics/index.tsx
│   ├── reports/index.tsx
│   ├── notifications/index.tsx
│   └── alerts/index.tsx
├── src/
│   ├── theme/
│   │   ├── index.tsx                  # ThemeProvider + hooks
│   │   ├── colors.ts                  # Light/dark palettes
│   │   ├── glass.ts                   # Glass recipes + header options
│   │   ├── typography.ts              # iOS HIG type scale
│   │   ├── spacing.ts                 # Spacing tokens
│   │   └── statusColors.ts            # Map shared constants to RN styles
│   ├── components/
│   │   ├── ui/
│   │   │   ├── glass/                 # GlassAlert, GlassPill, GlassSheet, etc.
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── PriorityBadge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ScreenTitleStrip.tsx
│   │   ├── data/
│   │   │   ├── DataList.tsx           # Native FlatList-based data list
│   │   │   ├── DataCard.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   └── FormTextArea.tsx
│   │   └── layout/
│   │       ├── ScreenContainer.tsx
│   │       └── SectionHeader.tsx
│   ├── hooks/
│   │   ├── useSupportsLiquidGlass.ts
│   │   ├── useGlassTheme.ts
│   │   ├── useBlurHeaderInset.ts
│   │   ├── useFormState.ts
│   │   ├── useRealtimeSubscription.ts
│   │   └── useRoleGate.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   ├── organizationStore.ts
│   │   ├── filterStore.ts
│   │   └── offlineStore.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts              # Supabase RN client
│   │   │   ├── queryClient.ts         # React Query setup
│   │   │   └── hooks/                 # Per-module query hooks
│   │   ├── storage/
│   │   │   ├── mmkv.ts               # MMKV setup
│   │   │   └── sqliteCache.ts        # SQLite API cache
│   │   ├── auth/
│   │   │   └── sessionRecovery.ts
│   │   ├── offline/
│   │   │   └── syncQueue.ts
│   │   └── safeHaptics.ts
│   ├── navigation/
│   │   ├── tabSpecs.ts               # Tab definitions + SF Symbols
│   │   ├── nativeHeaderOptions.tsx    # Header button builders
│   │   └── roleGating.ts             # Role-based nav filtering
│   └── types/
│       └── navigation.ts              # Route param types
├── app.config.ts
├── package.json
├── tsconfig.json
└── babel.config.js
```
