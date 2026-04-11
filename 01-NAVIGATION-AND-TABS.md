# Phase 1 — Navigation & Tabs

> Port EZXS-OS's Expo Router file-based navigation, native iOS tab bar, and route group architecture to EZTrack.

---

## 1. Route Group Structure

EZTrack needs the same route group pattern as EZXS-OS. Each group is a parenthesized folder that defines a navigation context:

```
app/
├── _layout.tsx              ← Root stack with providers
├── (auth)/
│   ├── _layout.tsx          ← Stack { headerShown: false, animation: 'slide_from_right' }
│   ├── welcome.tsx
│   ├── phone-signin.tsx
│   ├── phone-verify.tsx
│   ├── email-signin.tsx
│   ├── email-verify.tsx
│   └── profile-completion.tsx
├── (tabs)/
│   ├── _layout.tsx          ← Native tab bar config
│   ├── home/
│   │   ├── index.tsx
│   │   └── _layout.tsx
│   ├── [other tabs]/
│   └── more/
│       ├── index.tsx
│       ├── account.tsx
│       ├── appearance.tsx
│       └── _layout.tsx
└── [shared routes like event/[id]]
```

### Root Layout (`app/_layout.tsx`)

The root layout wraps everything in providers and defines the top-level stack:

```typescript
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              {/* Shared modals */}
              <Stack.Screen name="event/[id]" />
              <Stack.Screen name="settings/edit-profile" 
                options={{ presentation: 'fullScreenModal' }} />
            </Stack>
          </ToastProvider>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

---

## 2. Native Tab Bar (iOS)

### Tab Spec Definition

EZXS-OS defines tab specs as typed constants:

```typescript
// src/navigation/rootTabSpecs.ts

export type RootTabName = 'home' | 'discover' | 'tickets' | 'orders' | 'more'

export interface RootTabSpec {
  name: RootTabName
  label: string
  sfSymbol: string           // iOS native
  sfSymbolFilled: string     // iOS native (selected)
  fallbackIcon: LucideIcon   // Android / fallback
  nativeRole?: string        // iOS semantic role (e.g. 'search')
}

export const rootTabs: RootTabSpec[] = [
  {
    name: 'home',
    label: 'Home',
    sfSymbol: 'square.stack',
    sfSymbolFilled: 'square.stack.fill',
    fallbackIcon: House,
  },
  // ... etc
]
```

### Tab Layout (`app/(tabs)/_layout.tsx`)

The key pattern: **iOS uses native tabs, Android uses Expo Router `<Tabs>`**.

```typescript
import { NativeTabs, NativeTabTrigger } from 'expo-router/unstable-native-tabs'
import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import { rootTabs } from '@/navigation/rootTabSpecs'

export default function TabLayout() {
  const colors = useThemeColors()
  const isDark = useIsDark()

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        options={{
          tabBarActiveTintColor: BRAND.primary,     // #0891B2
          tabBarInactiveTintColor: colors.textTertiary,
          minimizeBehavior: 'onScrollDown',          // auto-hide tabs on scroll
        }}
      >
        {rootTabs.map(tab => (
          <NativeTabTrigger
            key={tab.name}
            name={tab.name}
            href={`/(tabs)/${tab.name}`}
            options={{
              title: tab.label,
              tabBarIcon: { sfSymbol: tab.sfSymbol },
              ...(tab.nativeRole && { role: tab.nativeRole }),
            }}
          />
        ))}
      </NativeTabs>
    )
  }

  // Android fallback
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
        height: 52 + insets.bottom,
        paddingBottom: insets.bottom,
      },
      tabBarActiveTintColor: BRAND.primary,
      tabBarInactiveTintColor: colors.textTertiary,
    }}>
      {rootTabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color }) => <tab.fallbackIcon size={22} color={color} strokeWidth={1.8} />,
          }}
        />
      ))}
    </Tabs>
  )
}
```

### Tab Bar Styling

| Property | Value | Notes |
|----------|-------|-------|
| Height | `52px` + safe area bottom | Base height before home indicator |
| Icon size | `22px` | Default for both native and fallback |
| Icon stroke | `1.8px` | Lucide icons (Android) |
| Label size | `11px` | Standard iOS tab label |
| Label weight | `500` (normal) / `600` (selected) | Slightly bolder when active |
| Label margin top | `2px` | Gap between icon and label |
| Active tint | `BRAND.primary` (`#0891B2`) | Brand cyan |
| Inactive tint | `colors.textTertiary` (`#71717A` light / `#A1A1AA` dark) | Muted gray |
| Background | `colors.background` (`#F2F2F7` light / `#000000` dark) | Page background color |
| Top border | `0.5px`, `colors.border` | Subtle separator |
| Auto-hide | `minimizeBehavior: 'onScrollDown'` | iOS only — tabs shrink on scroll |

### Tab Bar Visibility

Some screens need the tab bar hidden (e.g., full-screen detail views). EZXS-OS uses pathname detection:

```typescript
// src/lib/navigation/shouldHideTabBar.ts
export function shouldHideTabBar(pathname: string): boolean {
  // Hide for detail screens within tabs
  if (pathname.match(/^\/\(tabs\)\/tickets\/[^/]+/)) return true
  return false
}
```

---

## 3. Presentation Types

EZXS-OS uses these Expo Router presentation types for different contexts:

| Type | Use Case | Example |
|------|----------|---------|
| `'card'` (default) | Standard push navigation | Event detail, settings sub-page |
| `'formSheet'` | iOS half-sheet for focused input | Phone signin, event edit fields, search filters |
| `'fullScreenModal'` | Full takeover flows | Checkout, event creation, become organizer |
| `'modal'` | Small modals | Claim token, new chat message |
| `'overFullScreen'` | Overlay without dismissing current | QR scanner, guest check-in |

### How to Declare

```typescript
// In _layout.tsx
<Stack.Screen name="phone-signin" options={{ presentation: 'formSheet' }} />
<Stack.Screen name="checkout" options={{ presentation: 'fullScreenModal' }} />

// Or inline in the screen file
export const unstable_settings = {
  presentation: 'modal',
}
```

**Rule:** Every screen that collects input in a focused way (login, edit field, search) should be `formSheet`. Every multi-step flow (checkout, event creation) should be `fullScreenModal`. Standard navigation stays as default `card`.

---

## 4. Deep Linking

EZXS-OS configures deep links in `app.config.ts`:

```typescript
// iOS
associatedDomains: ['applinks:ezxs.events', 'applinks:*.ezxs.events']

// Android
intentFilters: [{
  action: 'VIEW',
  autoVerify: true,
  data: [{ scheme: 'https', host: 'ezxs.events', pathPrefix: '/' }],
}]

// Custom scheme
scheme: 'ezxs'
```

**EZTrack equivalent:** Configure `eztrack://` scheme and `eztrack.io` associated domain.

---

## 5. Navigation Utilities

### Safe Go Back

```typescript
// src/lib/navigation/safeGoBack.ts
export function safeGoBack(router: Router, fallbackRoute: string) {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace(fallbackRoute)
  }
}
```

### Route Targets (Constants)

```typescript
// src/lib/navigation/routeTargets.ts
export const ROUTE_TARGETS = {
  HOME: '/(tabs)/home',
  DISCOVER: '/(tabs)/discover',
  TICKETS: '/(tabs)/tickets',
  ACCOUNT: '/(tabs)/more/account',
  // ... etc
} as const
```

### Route Tracking

A `useRouteTracker()` hook logs navigation events for analytics.

---

## 6. EZTrack Adaptation Checklist

- [ ] Create `app/` directory with file-based routing (Expo Router)
- [ ] Define route groups: `(auth)`, `(tabs)`, and any admin/organizer groups
- [ ] Create `rootTabSpecs.ts` with EZTrack's tabs (icon, label, SF Symbol mappings)
- [ ] Implement native tab layout with iOS `NativeTabs` and Android `Tabs` fallback
- [ ] Set tab bar colors: `BRAND.primary` active, `textTertiary` inactive
- [ ] Configure `minimizeBehavior: 'onScrollDown'` for iOS
- [ ] Set `presentation: 'formSheet'` for all input/edit screens
- [ ] Set `presentation: 'fullScreenModal'` for checkout/creation flows
- [ ] Add `shouldHideTabBar()` for detail screens
- [ ] Configure deep linking for `eztrack://` scheme and `eztrack.io` domain
- [ ] Create `safeGoBack()` and `ROUTE_TARGETS` utilities
- [ ] Remove any custom bottom tab bar components — use native
