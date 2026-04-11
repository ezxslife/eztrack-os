# Phase 2 — Headers & Glass System

> Port the 3-tier glass rendering system and native header configuration from EZXS-OS to EZTrack.

---

## 1. The Three-Tier Glass System

EZXS-OS renders glass effects differently depending on platform capability:

| Tier | Platform | Library | What It Looks Like |
|------|----------|---------|-------------------|
| **Glass** | iOS 26+ | `expo-glass-effect` → `GlassView` | Native liquid glass with vibrancy, blur, and tint |
| **Blur** | iOS 18-25 | `expo-blur` → `BlurView` | System chrome material blur (intensity 80) |
| **Opaque** | Android / older iOS | None | Solid background color with `elevation: 4` shadow |

### Platform Detection

```typescript
// src/hooks/useSupportsLiquidGlass.ts
import { Platform } from 'react-native'

export function useSupportsLiquidGlass(): boolean {
  // iOS 26+ has native glass support
  return Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 26
}

// Broader tier detection
export type PlatformTier = 'glass' | 'blur' | 'opaque'

export function usePlatformTier(): PlatformTier {
  if (Platform.OS === 'ios') {
    return parseInt(Platform.Version, 10) >= 26 ? 'glass' : 'blur'
  }
  return 'opaque'
}
```

### Glass Recipes

Three predefined recipes for different surface types:

```typescript
// src/theme/glass.ts

export const glassRecipes = {
  sheet: {
    blurIntensity: 90,
    tint: 'systemUltraThinMaterial',
    fallbackColor: {
      light: 'rgba(255, 255, 255, 0.88)',
      dark: 'rgba(0, 0, 0, 0.88)',
    },
    backdropOpacity: 0.25,
  },
  header: {
    blurIntensity: 80,
    tint: 'systemChromeMaterial',
    fallbackColor: {
      light: 'rgba(242, 242, 247, 0.94)',
      dark: 'rgba(0, 0, 0, 0.92)',
    },
  },
  cta: {
    blurIntensity: 40,
    tint: 'systemChromeMaterial',
    fallbackColor: {
      light: 'rgba(242, 242, 247, 0.75)',
      dark: 'rgba(0, 0, 0, 0.75)',
    },
  },
}
```

### Glass Depth System

EZXS-OS prevents glass stacking with a context-based depth tracker:

```typescript
// Only render glass at depth 0 (outermost layer)
// Nested components at depth 1+ use opaque fallback
const GlassDepthContext = createContext(0)

function GlassEffectContainer({ children }: { children: ReactNode }) {
  const depth = useContext(GlassDepthContext)
  return (
    <GlassDepthContext.Provider value={depth + 1}>
      {/* If depth > 0, skip glass rendering */}
      {children}
    </GlassDepthContext.Provider>
  )
}
```

**Rule:** Glass on headers and sheets (depth 0). Opaque surfaces for content inside them (depth 1+).

---

## 2. Header Types

EZXS-OS defines four header configuration functions. Each returns an object for Stack.Screen `options`:

### 2a. Solid Glass Header

For standard form/settings screens:

```typescript
function getGlassHeaderOptions(backgroundColor: string) {
  return {
    headerStyle: { backgroundColor },
    headerShadowVisible: false,
    headerTintColor: colors.textPrimary,
  }
}
```

**Use:** Settings pages, edit forms, static content screens.

### 2b. Seamless Header

Transparent with blur on iOS, solid on Android:

```typescript
function getSeamlessHeaderOptions(backgroundColor: string) {
  return Platform.select({
    ios: parseInt(Platform.Version, 10) >= 26
      ? { headerStyle: { backgroundColor } }  // iOS 26: glass auto-applies
      : {
          headerTransparent: true,
          headerBlurEffect: 'systemChromeMaterial',
        },
    android: {
      headerStyle: { backgroundColor, elevation: 4 },
    },
  })
}
```

**Use:** Tab root screens (Home, Discover, etc.) where content scrolls under header.

### 2c. Blur Tab Header

Transparent with automatic glass transition on scroll:

```typescript
function getBlurTabHeaderOptions(backgroundColor: string) {
  const supportsGlass = parseInt(Platform.Version ?? '0', 10) >= 26

  return Platform.select({
    ios: supportsGlass
      ? {
          headerTransparent: true,
          scrollEdgeEffects: { top: 'automatic' as const },
        }
      : {
          headerTransparent: true,
          headerBlurEffect: 'systemChromeMaterial',
        },
    android: {
      headerStyle: { backgroundColor, elevation: 4 },
    },
  })
}
```

**Use:** Scrollable tab screens. Header starts transparent, gains glass/blur material as user scrolls.

### 2d. Transparent Blur Header (Immersive)

For detail pages with hero images/banners:

```typescript
function getTransparentBlurHeaderOptions(backgroundColor: string) {
  // Same as blur tab headers — starts transparent, gains material on scroll
  return getBlurTabHeaderOptions(backgroundColor)
}
```

**Use ONLY for:** Event detail pages with hero media, venue maps, camera/scanner views. Per CLAUDE.md: "Use transparent-at-rest blur headers only for immersive/detail surfaces with hero media, banners, maps, or camera backgrounds."

**Do NOT use for:** Tab roots, forms, settings, lists. Those get seamless or solid headers.

---

## 3. Header Dimensions & Layout

### Size

| Property | Value |
|----------|-------|
| Height | `44px` (constant, matches iOS native) |
| Total with safe area | `safeArea.top + 44` |
| Left/right slot | `44×44px` touch target |
| Shadow | Never — `headerShadowVisible: false` always |

### Content Inset Hook

For transparent headers, content needs padding to avoid hiding behind the header:

```typescript
// src/hooks/useBlurHeaderInset.ts
const HEADER_HEIGHT = 44

export function useBlurHeaderInset(): number {
  const insets = useSafeAreaInsets()
  if (Platform.OS === 'android') return 0  // Android headers are opaque, no overlap
  return insets.top + HEADER_HEIGHT
}
```

Usage in screens:

```typescript
const topInset = useBlurHeaderInset()

<ScrollView contentContainerStyle={{ paddingTop: topInset + 8 }}>
  {/* content */}
</ScrollView>
```

---

## 4. Native Header Items (iOS)

### Platform-Aware Builder

EZXS-OS uses a builder pattern that produces native SF Symbol items on iOS and React components on Android:

```typescript
// src/navigation/nativeHeaderOptions.tsx

type HeaderItemSet = {
  // iOS native (preferred)
  unstable_headerLeftItems?: NativeHeaderItem[]
  unstable_headerRightItems?: NativeHeaderItem[]
  // React fallback (Android)
  headerLeft?: () => ReactNode
  headerRight?: () => ReactNode
}

function platformHeaderItems(options: {
  leftNative?: NativeHeaderItem[]
  leftReact?: () => ReactNode
  rightNative?: NativeHeaderItem[]
  rightReact?: () => ReactNode
}): HeaderItemSet {
  if (Platform.OS === 'ios') {
    return {
      unstable_headerLeftItems: options.leftNative,
      unstable_headerRightItems: options.rightNative,
    }
  }
  return {
    headerLeft: options.leftReact,
    headerRight: options.rightReact,
  }
}
```

### Native Item Types

**SF Symbol Button:**
```typescript
function makeNativeSfButtonItem(config: {
  sfSymbol: string
  onPress: () => void
  identifier: string
}): NativeHeaderItem {
  return {
    type: 'systemItem',
    systemItem: config.sfSymbol,
    onPress: config.onPress,
    identifier: config.identifier,
  }
}
```

**Text Button (Done, Save, Cancel):**
```typescript
function makeNativeTextButtonItem(config: {
  title: string
  onPress: () => void
  style?: 'plain' | 'done' | 'prominent'
  disabled?: boolean
}): NativeHeaderItem {
  return {
    type: 'button',
    title: config.title,
    onPress: config.onPress,
    style: config.style ?? 'plain',
    enabled: !config.disabled,
  }
}
```

**Back Button:**
```typescript
function makeNativeBackButtonItem(onPress: () => void): NativeHeaderItem {
  return {
    type: 'systemItem',
    systemItem: 'chevron.backward',
    onPress,
    identifier: 'native-back-button',
    width: 44,
  }
}
```

### Header Action Button Styling

| Variant | Font Weight | Appearance |
|---------|------------|------------|
| `plain` | 600 | Standard |
| `done` | 700 | Bold (green on iOS) |
| `prominent` | 700 | Bold highlighted |
| Disabled | — | 0.45 opacity |

---

## 5. GlassNavBar Component

For screens that need custom header behavior (animated opacity, large titles), EZXS-OS has a `GlassNavBar` component:

```typescript
// src/components/ui/glass/GlassNavBar.tsx

interface GlassNavBarProps {
  title: string
  largeTitleOpacity?: SharedValue<number>
  inlineTitleOpacity?: SharedValue<number>
  headerBackgroundOpacity?: SharedValue<number>
  onBack?: () => void
  rightActions?: NativeHeaderItem[]
}
```

### Material Selection (Inside GlassNavBar)

```typescript
const tier = usePlatformTier()

// Render background based on tier
if (tier === 'glass') {
  return <GlassView style={styles.header} glassEffectStyle="regular" />
}
if (tier === 'blur') {
  return <BlurView style={styles.header} intensity={80} tint="systemChromeMaterial" />
}
return <View style={[styles.header, { backgroundColor: colors.background, elevation: 4 }]} />
```

### Animated Background Opacity

The header background opacity animates based on scroll position — transparent at top, glass/blur when scrolled:

```typescript
const headerBgStyle = useAnimatedStyle(() => ({
  opacity: headerBackgroundOpacity?.value ?? 1,
}))
```

### Large Title Strip

Below the 44px header, a large title can appear:

```typescript
// Large title: 34px, weight 700, 52px container
<GlassNavBarLargeTitle title={title} opacity={largeTitleOpacity} />
```

| Property | Value |
|----------|-------|
| Container height | `52px` |
| Padding | `8px top, 12px bottom, 16px horizontal` |
| Font size | `34px` |
| Font weight | `700` |
| Inline title size | `17px / 600` |

---

## 6. Scroll Edge Effects (iOS 26+)

The most "iOS 26" feature: automatic header material transition based on scroll position.

```typescript
// In Stack.Screen options
scrollEdgeEffects: { top: 'automatic' as const }
```

This tells iOS to:
- Start with a **fully transparent** header when content is at the top
- Automatically apply **liquid glass material** as the user scrolls down
- No manual animation code needed — it's a native API

**Fallback (iOS < 26):** Use `headerBlurEffect: 'systemChromeMaterial'` with `headerTransparent: true`. The blur is always visible (no auto-transition), but it still looks good.

**Fallback (Android):** Solid background with elevation shadow. No transparency.

---

## 7. Liquid Glass Header Builder

The master function that combines all the above:

```typescript
function makeLiquidGlassHeaderOptions(config: {
  backgroundColor?: string
  headerItems?: HeaderItemSet
}) {
  const supportsGlass = useSupportsLiquidGlass()

  return {
    headerShown: true,
    headerTransparent: Platform.OS === 'ios',
    headerBackButtonDisplayMode: 'minimal',
    headerShadowVisible: false,
    ...(supportsGlass && {
      scrollEdgeEffects: { top: 'automatic' as const },
    }),
    ...(config.backgroundColor && Platform.OS === 'ios' && {
      contentStyle: { backgroundColor: config.backgroundColor },
    }),
    ...config.headerItems,
  }
}
```

**Critical note from CLAUDE.md:** On iOS with native header items, do NOT also set `headerLeft`/`headerRight` React components. This causes the "gray blob bug" where React components float above the native UINavigationBar.

---

## 8. Header Left Slot Patterns

EZXS-OS uses the left header slot for three things:

### Guest Mode: Brand Logo
```
[ 🦋 ezxs ]
```
- Butterfly icon + brand text
- Tappable → scrolls to top

### Attendee Mode: User Avatar
```
[ 👤 Username ]
```
- `UserAvatar` (40px, circular) + username text
- Tappable → opens profile

### Organizer Mode: Org Switcher
```
[ 🏢 Org Name ▼ ]
```
- Org logo/initial + org name + chevron
- Tappable → opens org switcher sheet

---

## 9. EZTrack Adaptation Checklist

- [ ] Create `useSupportsLiquidGlass()` and `usePlatformTier()` hooks
- [ ] Port `glassRecipes` (sheet, header, cta) from `theme/glass.ts`
- [ ] Port `GlassNavBar` component with 3-tier rendering
- [ ] Port `ScreenTitleStrip` for below-header titles
- [ ] Create `useBlurHeaderInset()` hook for content padding
- [ ] Configure all tab root screens with `getBlurTabHeaderOptions()` + `scrollEdgeEffects`
- [ ] Configure all form/settings screens with `getGlassHeaderOptions()` (solid)
- [ ] Configure detail screens with `getTransparentBlurHeaderOptions()` (immersive only for hero content)
- [ ] Port `platformHeaderItems()` builder for native SF Symbol items
- [ ] Port `makeNativeBackButtonItem()`, `makeNativeSfButtonItem()`, `makeNativeTextButtonItem()`
- [ ] Set `headerShadowVisible: false` globally
- [ ] Set header height to 44px everywhere
- [ ] Remove all custom header bar components — use native headers
- [ ] Test glass tier on iOS 26+ simulator
- [ ] Test blur tier on iOS 18-25 simulator
- [ ] Test opaque tier on Android emulator
