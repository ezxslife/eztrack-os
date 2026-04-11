# EZTrack iOS 26 Redesign — Master Plan

> **Goal:** Rebuild the EZTrack mobile app to match the EZXS-OS design system — native iOS 26 tabs, liquid glass headers, proper spatial navigation, and the full component library.
>
> **Date:** 2026-04-10  
> **Reference Codebase:** `ezxs-os/apps/mobile/`

---

## Why This Exists

The current EZTrack mobile app uses a container-card layout pattern: dark cards stacked on dark backgrounds, flat buttons, no native navigation chrome, no glass effects, and dev tooling (demo login, preview mode) visible to users. It looks like a 2022 React Native app, not an iOS 26 native experience.

EZXS-OS has already solved this. It uses native tabs with SF Symbols, a 3-tier glass system (liquid glass → blur → opaque fallback), proper spatial navigation with formSheet/modal presentations, and a comprehensive theme token system. This plan ports those patterns to EZTrack.

---

## Document Index

| File | Phase | What It Covers |
|------|-------|----------------|
| `01-NAVIGATION-AND-TABS.md` | 1 | Expo Router file structure, native tab bar, route groups, presentation types, tab bar visibility, deep linking |
| `02-HEADERS-AND-GLASS.md` | 2 | 3-tier glass system, header types (liquid/blur/seamless/transparent), native header items, SF Symbols, back buttons, scroll edge effects |
| `03-SCREEN-PATTERNS.md` | 3 | Screen scaffolds, safe area handling, scroll patterns, keyboard avoidance, empty/loading/error states, sticky action bars |
| `04-COMPONENT-LIBRARY.md` | 4 | Glass components, buttons, cards, inputs, rows, avatars, badges, modals, sheets — every reusable primitive |
| `05-AUTH-AND-LOGIN.md` | 5 | Welcome surface, bottom sheet auth, OTP flow, auth lifecycle state machine, profile completion |
| `06-THEME-AND-TOKENS.md` | 6 | Brand palette, light/dark colors, glass recipes, spacing scale, typography scale, sizing standards, z-index layers |

---

## Architecture Snapshot (EZXS-OS Reference)

### App Structure

```
app/
├── _layout.tsx              ← Root: providers, global sheets
├── (auth)/                  ← Auth flow (12 screens)
│   ├── _layout.tsx          ← Stack, headerShown: false, slide_from_right
│   ├── welcome.tsx          ← Cinematic backdrop + "Get Started"
│   ├── phone-signin.tsx     ← Full-screen phone entry
│   ├── phone-verify.tsx     ← OTP verification
│   └── ...
├── (tabs)/                  ← Attendee mode (5 root tabs)
│   ├── _layout.tsx          ← Native tabs (iOS) / Tabs fallback (Android)
│   ├── home/
│   ├── discover/
│   ├── tickets/
│   ├── orders/
│   └── more/
├── (organizer)/             ← Organizer mode (5 root tabs + 15 sections)
│   ├── (tabs)/_layout.tsx   ← Organizer tab bar with live event indicator
│   ├── manage-organization/
│   ├── analytics/
│   ├── finance/
│   └── ...
├── (checkout)/              ← Payment flow (fullScreenModal)
├── event/[id]/              ← Shared event detail
├── org/[orgId]/             ← Shared org profile
└── profile/[userId]         ← Shared user profile
```

### Key Numbers

- **~97 screens** across auth, attendee, organizer, checkout
- **~50 layout files** managing route groups
- **18 glass components** in `src/components/ui/glass/`
- **50+ UI components** in `src/components/ui/`
- **5 attendee tabs:** Home, Discover, Tickets, Orders, More
- **5 organizer tabs:** Dashboard, Events, Finance, Search, More

### The Three Pillars

1. **Native navigation** — Expo Router file-based routing with native tab bars (SF Symbols on iOS), proper presentation types (formSheet, fullScreenModal, modal, card)

2. **Glass-first surfaces** — 3-tier rendering: iOS 26+ gets `GlassView` (expo-glass-effect), iOS <26 gets `BlurView` (expo-blur), Android gets opaque fallback with elevation. Applied to headers, sheets, buttons, chips, alerts, segmented controls.

3. **Semantic token system** — Every color, spacing, radius, and font size comes from the theme. Zero hardcoded values. Light/dark mode automatic. WCAG AA contrast guaranteed.

---

## Implementation Order

```
Phase 6 (tokens)     ← Foundation: port the theme system first
Phase 1 (navigation) ← Structural: set up route groups, tabs, layouts
Phase 2 (headers)    ← Chrome: glass headers, native items, scroll effects
Phase 3 (screens)    ← Patterns: scaffold, scroll, keyboard, states
Phase 4 (components) ← Library: glass primitives, cards, rows, inputs
Phase 5 (auth)       ← Login: welcome screen, bottom sheet, OTP flow
```

Start with tokens because everything else depends on them. Navigation second because it defines where screens live. Headers and screen patterns third because they're structural. Components fourth because screens consume them. Auth last because it's a self-contained flow that depends on everything else being in place.

---

## What EZTrack Currently Does Wrong (vs. EZXS-OS)

| Area | EZTrack (Current) | EZXS-OS (Target) |
|------|-------------------|-------------------|
| **Tabs** | No native tabs. Probably custom bottom bar or none | Native `NativeTabs` (iOS) with SF Symbols, 52px height, brand tint, auto-hide on scroll |
| **Headers** | No native headers. Custom dark bars or none | 44px native headers with glass/blur/seamless variants, SF Symbol buttons, scroll edge effects |
| **Screen layout** | Dark card containers on dark backgrounds | `View(flex:1)` + `ScrollView` with `GlassRefreshControl`, proper safe area insets, consistent 16px gutters |
| **Buttons** | Teal (`#0891B2`-ish) on dark surfaces, no variants | `GlassPill` with filled/outline/tinted variants at sm/md/lg sizes, spring animations, haptics |
| **Forms** | Inline on landing screen, always visible | Bottom sheet (`GlassSheet`) with stepped flow, progressive disclosure |
| **Auth** | Email + password card with demo dropdown and preview section | Welcome screen → method picker sheet → full-screen OTP flow → profile completion |
| **Dev tools** | Visible to all users (demo login, preview mode) | Hidden behind 5-tap logo gesture, `__DEV__` gated |
| **Colors** | Dark theme with teal accents, unclear token system | Full semantic token system: 30+ light/dark pairs, WCAG AA verified, brand palette derived |
| **Glass** | None | 18 glass components, 3-tier platform fallback, blur/vibrancy on every interactive surface |
| **Typography** | Mixed sizes, no scale | iOS HIG scale: largeTitle (34px) through caption2 (11px), consistent weights |
| **Spacing** | Arbitrary padding | 4px-based scale: xs(4) sm(8) md(12) lg(16) xl(20) 2xl(24) 3xl(32) 4xl(48) |

---

## Guiding Principles

1. **No card containers.** Screens ARE the surface. Content goes on the page background with horizontal padding. Cards are for grouping related rows (like iOS Settings), not wrapping entire pages.

2. **Native chrome over custom chrome.** Use Expo Router's native headers, native tabs, native presentation types. Don't rebuild what the platform gives you.

3. **Glass at depth 0, solid at depth 1+.** Glass effects on the outermost layer (headers, sheets, top-level buttons). Nested content uses opaque surfaces. Prevents visual noise from stacked blur.

4. **Progressive disclosure.** Don't show everything at once. Landing screens show actions, detail lives in pushed screens or sheets.

5. **Tokens, not values.** Every color, size, and spacing comes from the theme system. If you're typing a hex code in a component, you're doing it wrong.
