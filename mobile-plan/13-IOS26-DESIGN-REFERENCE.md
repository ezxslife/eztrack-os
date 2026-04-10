# Phase 13: iOS 26 Design Standards & EZXS-OS Pattern Reference

> **Purpose:** Authoritative design reference for building EZTrack mobile with iOS 26 Liquid Glass, following patterns proven in production on EZXS-OS.
> **Type:** Reference document (not a sequential phase)
> **Source:** EZXS-OS mobile app (`apps/mobile/`) — 26 stores, 30+ glass components, 50k+ lines of production RN code

---

## Table of Contents

1. [iOS 26 Liquid Glass — The Mental Model](#131-ios-26-liquid-glass--the-mental-model)
2. [Three-Tier Rendering Architecture](#132-three-tier-rendering-architecture)
3. [Platform Detection](#133-platform-detection)
4. [Glass Material Recipes](#134-glass-material-recipes)
5. [Header System (4 Patterns)](#135-header-system-4-patterns)
6. [Tab Bar — NativeTabs + SF Symbols](#136-tab-bar--nativetabs--sf-symbols)
7. [ScreenTitleStrip — Title Below Header](#137-screentitlestrip--title-below-header)
8. [Color System — Light & Dark Palettes](#138-color-system--light--dark-palettes)
9. [Typography — iOS HIG Scale](#139-typography--ios-hig-scale)
10. [Spacing & Layout Tokens](#1310-spacing--layout-tokens)
11. [Glass Component Library](#1311-glass-component-library)
12. [ThemeProvider Architecture](#1312-themeprovider-architecture)
13. [Theme Transition Overlay](#1313-theme-transition-overlay)
14. [Color Scheme Resolution Rules](#1314-color-scheme-resolution-rules)
15. [Hydration Gate — No Flash Protocol](#1315-hydration-gate--no-flash-protocol)
16. [Animation Standards](#1316-animation-standards)
17. [Haptic Feedback System](#1317-haptic-feedback-system)
18. [Accessibility Requirements](#1318-accessibility-requirements)
19. [Safe Area Handling](#1319-safe-area-handling)
20. [Dark Mode for Operations (EZTrack-Specific)](#1320-dark-mode-for-operations-eztrack-specific)
21. [Glass Depth Context](#1321-glass-depth-context)
22. [Bottom Sheet Standards](#1322-bottom-sheet-standards)
23. [Pull-to-Refresh Pattern](#1323-pull-to-refresh-pattern)
24. [Skeleton Loading Pattern](#1324-skeleton-loading-pattern)
25. [Navigation Animation Presets](#1325-navigation-animation-presets)
26. [Android Fallback Standards](#1326-android-fallback-standards)
27. [WCAG AA Compliance Matrix](#1327-wcag-aa-compliance-matrix)
28. [Decision Flowcharts](#1328-decision-flowcharts)

---

## 13.1 iOS 26 Liquid Glass — The Mental Model

iOS 26 introduces **Liquid Glass**, a design language where UI surfaces become translucent, refractive materials that respond to content behind them. The system treats the entire screen as a depth-aware canvas:

**Core Principles:**

1. **Materials, not colors.** Surfaces are glass materials that sample and blur the content beneath them. You don't set a background color on a header — you apply a glass material.

2. **Depth through translucency.** Hierarchy is communicated through layers of translucent glass, not drop shadows or opaque elevation. Deeper content shows through shallower surfaces.

3. **Vibrancy.** Text and icons on glass use vibrancy effects that automatically adjust contrast based on what's behind the glass. The system handles this — you set semantic colors and the OS adjusts.

4. **System-driven transitions.** Liquid glass headers transition between transparent (at scroll top) and frosted (when content scrolls under) automatically via `scrollEdgeEffects`. You don't animate this yourself.

5. **Native integration.** Tab bars, navigation bars, and toolbars become glass automatically when you use native components. Custom views get glass via `expo-glass-effect`.

**What This Means for EZTrack:**

EZTrack's security operations interface benefits from glass because:
- Dispatch boards gain visual depth with glass cards over map backgrounds
- Status indicators remain legible over varying content via vibrancy
- The operations room dark mode gets sophisticated glass surfaces instead of flat dark cards
- Headers stay minimal while content scrolls beneath them — maximizing screen real estate

---

## 13.2 Three-Tier Rendering Architecture

Every visual component in the app MUST render correctly on three platform tiers. This is non-negotiable — never assume glass availability.

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: GLASS (iOS 26+)                                │
│  ├── expo-glass-effect → GlassView                      │
│  ├── Native liquid glass refractive materials            │
│  ├── scrollEdgeEffects: { top: 'automatic' }            │
│  └── Best visual fidelity                                │
├─────────────────────────────────────────────────────────┤
│  Tier 2: BLUR (iOS 18–25)                               │
│  ├── expo-blur → BlurView                               │
│  ├── tint: 'systemChromeMaterial' (adapts to scheme)    │
│  ├── headerBlurEffect on native headers                 │
│  └── Good visual quality, no refraction                  │
├─────────────────────────────────────────────────────────┤
│  Tier 3: OPAQUE (Android / older iOS / Reduce Trans.)   │
│  ├── Semi-transparent solid colors with borders          │
│  ├── Platform.select() for Android elevation shadows    │
│  ├── Material 3 tonal surface hierarchy                  │
│  └── Fully functional, no visual effects                 │
└─────────────────────────────────────────────────────────┘
```

### The Template — Every Glass Component Follows This

```typescript
function MyGlassComponent({ children }) {
  const { platformTier } = useSupportsLiquidGlass();
  const { colors } = useTheme();

  // Tier 1: Native glass
  if (platformTier === 'glass') {
    return (
      <GlassView style={styles.container} glassEffect="regular">
        {children}
      </GlassView>
    );
  }

  // Tier 2: Blur fallback
  if (platformTier === 'blur') {
    return (
      <BlurView
        intensity={50}
        tint="systemChromeMaterial"
        style={styles.container}
      >
        {children}
      </BlurView>
    );
  }

  // Tier 3: Opaque fallback
  return (
    <View style={[styles.container, {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...Platform.select({
        android: { elevation: 2 },
        default: {},
      }),
    }]}>
      {children}
    </View>
  );
}
```

**Rules:**
- Always test on all three tiers before shipping
- The opaque tier must be fully functional — it's not a degraded experience, just a different visual treatment
- Never nest glass inside glass (see §13.21 Glass Depth Context)
- Android users get Material-style elevation shadows instead of glass

---

## 13.3 Platform Detection

### The Hook (from EZXS-OS production)

```typescript
// src/hooks/useSupportsLiquidGlass.ts
import { Platform } from 'react-native';

let isGlassAvailable = false;
try {
  const glassModule = require('expo-glass-effect');
  isGlassAvailable = glassModule.isGlassEffectAPIAvailable?.() ?? false;
} catch {
  // expo-glass-effect not available
}

export type PlatformTier = 'glass' | 'blur' | 'opaque';

interface LiquidGlassSupport {
  supportsGlass: boolean;
  supportsBlur: boolean;
  isAndroid: boolean;
  platformTier: PlatformTier;
}

export function useSupportsLiquidGlass(): LiquidGlassSupport {
  const supportsGlass = Platform.OS === 'ios' && isGlassAvailable;
  const supportsBlur = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  const platformTier: PlatformTier = supportsGlass
    ? 'glass'
    : supportsBlur
      ? 'blur'
      : 'opaque';

  return { supportsGlass, supportsBlur, isAndroid, platformTier };
}
```

**Key details:**
- Glass detection runs at module load time (not per-render) — the result is cached
- `require('expo-glass-effect')` is wrapped in try/catch so the app doesn't crash if the module isn't installed
- `isGlassEffectAPIAvailable()` checks iOS version + hardware at runtime
- This hook is safe to call anywhere — no side effects, no state

### Glass Theme Configuration

```typescript
// src/hooks/useGlassTheme.ts
export function useGlassTheme(): GlassThemeConfig {
  const isDark = useIsDark();

  return {
    glassStyle: isDark ? 'prominent' : 'regular',
    blurIntensity: isDark ? 70 : 50,
    blurTint: 'systemChromeMaterial',
    specularColor: isDark
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.4)',
    isDark,
  };
}
```

**Why dark mode differs:**
- Dark backgrounds need higher blur intensity (70 vs 50) so glass surfaces remain visually distinct
- `'prominent'` glass effect has stronger refraction on dark backgrounds
- Specular highlights are dimmer in dark mode (0.15 vs 0.4 opacity) to avoid glare

---

## 13.4 Glass Material Recipes

Three predefined glass configurations for different surface types:

```typescript
// src/theme/glass.ts
export const glassRecipes = {
  // Bottom sheets, modals — heavy frosting for content separation
  sheet: {
    blurIntensity: 90,
    tint: 'systemUltraThinMaterial' as const,
    fallbackColor: {
      light: 'rgba(255, 255, 255, 0.88)',
      dark: 'rgba(0, 0, 0, 0.88)',
    },
    backdropOpacity: 0.25,
  },

  // Navigation headers — medium frosting, chrome material
  header: {
    blurIntensity: 80,
    tint: 'systemChromeMaterial' as const,
    fallbackColor: {
      light: 'rgba(242, 242, 247, 0.94)',
      dark: 'rgba(0, 0, 0, 0.92)',
    },
  },

  // Floating CTAs, chips — light frosting
  cta: {
    blurIntensity: 40,
    tint: 'systemChromeMaterial' as const,
    fallbackColor: {
      light: 'rgba(242, 242, 247, 0.75)',
      dark: 'rgba(0, 0, 0, 0.75)',
    },
  },
} as const;
```

### When to Use Each Recipe

| Recipe | Use Case | EZTrack Example |
|--------|----------|-----------------|
| `sheet` | Bottom sheets, action sheets, modals | Dispatch action sheet, incident form modal |
| `header` | Navigation bars, sticky headers | Tab root headers, detail screen headers |
| `cta` | Floating buttons, filter chips, pills | Filter bar on list screens, FAB on dispatch |

### iOS Tint Materials Reference

| Material | Behavior |
|----------|----------|
| `systemChromeMaterial` | Adapts to light/dark automatically, chrome-like appearance |
| `systemUltraThinMaterial` | Lightest blur, most content shows through |
| `systemThinMaterial` | Light blur |
| `systemMaterial` | Standard blur |
| `systemThickMaterial` | Heavy blur, least content shows through |

**Always use `systemChromeMaterial` for navigation elements** — it matches the native iOS chrome exactly.

---

## 13.5 Header System (4 Patterns)

EZXS-OS defines four header configurations. Each serves a specific purpose. Using the wrong one creates visual inconsistency.

### Pattern 1: Blur Tab Header (Tab root screens)

**When:** Dashboard, Daily Log list, Dispatch board, Incidents list, More screen — any tab root.

```typescript
export function getBlurTabHeaderOptions(backgroundColor: string) {
  if (Platform.OS === 'ios') {
    if (supportsGlass) {
      // iOS 26: System-driven glass transition on scroll
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        scrollEdgeEffects: { top: 'automatic' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor },
      };
    }

    // iOS 18–25: Permanent blur material
    return {
      headerTransparent: true,
      headerStyle: { backgroundColor: 'transparent' },
      headerBlurEffect: 'systemChromeMaterial',
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal',
      contentStyle: { backgroundColor },
    };
  }

  // Android: Solid with elevation
  return {
    headerStyle: { backgroundColor, elevation: 4 },
    headerShadowVisible: true,
    headerBackButtonDisplayMode: 'minimal',
  };
}
```

**Behavior:**
- iOS 26: Header starts transparent, becomes liquid glass when content scrolls underneath (`scrollEdgeEffects: { top: 'automatic' }`)
- iOS 18–25: Header has permanent `systemChromeMaterial` blur
- Android: Solid background with Material elevation shadow
- `contentStyle: { backgroundColor }` ensures the scrollable content area has the correct background

### Pattern 2: Seamless Header (Standard detail/form screens)

**When:** Settings, profile, create forms, standard list screens — anywhere the header should blend with the page.

```typescript
export function getSeamlessHeaderOptions(backgroundColor: string) {
  if (Platform.OS === 'ios' && supportsBlur && !supportsGlass) {
    // iOS 18–25: blur that closely matches the page background
    return {
      headerTransparent: true,
      headerStyle: { backgroundColor: 'transparent' },
      headerBlurEffect: 'systemChromeMaterial',
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal',
      contentStyle: { backgroundColor },
    };
  }

  // iOS 26 glass + Android: solid header matching page
  return {
    headerStyle: { backgroundColor },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
  };
}
```

**Key:** On iOS 26, glass is NOT applied to seamless headers. The header just matches the background color exactly — invisible boundary.

### Pattern 3: Transparent Blur Header (Immersive hero content)

**When:** Detail screens with hero images, map views, camera backgrounds — content that extends behind the header.

```typescript
export function getTransparentBlurHeaderOptions(backgroundColor: string) {
  if (Platform.OS === 'ios') {
    if (supportsGlass) {
      return {
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        scrollEdgeEffects: { top: 'automatic' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor },
      };
    }

    return {
      headerTransparent: true,
      headerStyle: { backgroundColor: 'transparent' },
      headerBlurEffect: 'systemChromeMaterial',
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal',
      contentStyle: { backgroundColor },
    };
  }

  // Android: transparent header over hero with white tint for visibility
  return {
    headerTransparent: true,
    headerStyle: { backgroundColor: 'transparent' },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    headerTintColor: '#FFFFFF',
    contentStyle: { backgroundColor },
  };
}
```

**Android note:** Uses white tint color on transparent header over hero imagery for visibility.

### Pattern 4: Solid Header (No effects)

**When:** Simple screens that don't need any glass or blur. Rare in iOS-first design.

```typescript
export function getGlassHeaderOptions(backgroundColor: string) {
  return {
    headerStyle: { backgroundColor },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
  };
}
```

### Header Decision Matrix for EZTrack

| Screen | Header Pattern | Why |
|--------|---------------|-----|
| Dashboard (tab root) | Blur Tab | Tab root with scrolling content |
| Daily Log list (tab root) | Blur Tab | Tab root with scrolling content |
| Dispatch board (tab root) | Blur Tab | Tab root, live data scrolls under |
| Incidents list (tab root) | Blur Tab | Tab root with scrolling content |
| More screen (tab root) | Blur Tab | Tab root |
| Incident detail | Transparent Blur | If hero banner/image; else Seamless |
| Dispatch detail | Transparent Blur | Map/hero at top |
| Create incident form | Seamless | Standard form, no hero |
| Create daily log | Seamless | Standard form |
| Settings | Seamless | Standard grouped list |
| Profile | Seamless | Standard form |
| Analytics | Seamless | Chart dashboard, no hero |

### Critical Rules

1. **Never build full custom title bars.** Use native `headerLeft` / `headerRight` items. Keep `headerTitle` empty or a minimal spacer.
2. **Never use title-view width hacks.** Don't try to force left alignment by stuffing content into `headerTitle`.
3. **Never use negative margins** that clip avatar/logo controls in header areas.
4. **44pt touch targets** for all `headerLeft` and `headerRight` controls.
5. **`headerBackButtonDisplayMode: 'minimal'`** always — shows just the chevron, no back title.

---

## 13.6 Tab Bar — NativeTabs + SF Symbols

### iOS: Native Tab Bar

```typescript
import { NativeTabs, NativeTabTrigger } from 'expo-router/native';

<NativeTabs
  scrollEdgeEffects={{ bottom: 'automatic' }}
  minimizeBehavior="onScrollDown"
>
  <NativeTabTrigger name="dashboard">
    <NativeTabTrigger.Icon sf="house.fill" />
  </NativeTabTrigger>

  <NativeTabTrigger name="daily-log">
    <NativeTabTrigger.Icon sf="doc.text.fill" />
  </NativeTabTrigger>

  <NativeTabTrigger name="dispatch">
    <NativeTabTrigger.Icon sf="antenna.radiowaves.left.and.right" />
  </NativeTabTrigger>

  <NativeTabTrigger name="incidents">
    <NativeTabTrigger.Icon sf="exclamationmark.shield.fill" />
  </NativeTabTrigger>

  <NativeTabTrigger name="more">
    <NativeTabTrigger.Icon sf="ellipsis" />
  </NativeTabTrigger>
</NativeTabs>
```

**Key properties:**
- `scrollEdgeEffects: { bottom: 'automatic' }` — tab bar becomes glass when content scrolls near it
- `minimizeBehavior: "onScrollDown"` — tab bar shrinks when user scrolls down, reappears on scroll up
- SF Symbols are referenced by name (no image import needed)
- The native tab bar automatically picks up the React Navigation theme colors

### Android: Custom Tab Fallback

```typescript
import { Tabs } from 'expo-router';
import { Home, FileText, Radio, AlertTriangle, MoreHorizontal } from 'lucide-react-native';

<Tabs screenOptions={{
  tabBarActiveTintColor: colors.brand,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
}}>
  <Tabs.Screen name="dashboard" options={{
    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
    title: 'Dashboard',
  }} />
  {/* ... */}
</Tabs>
```

### EZTrack Tab Bar — SF Symbol Mapping

| Tab | SF Symbol | Filled Variant | Description |
|-----|-----------|----------------|-------------|
| Dashboard | `house.fill` | Yes | Home/overview |
| Daily Log | `doc.text.fill` | Yes | Document-based logging |
| Dispatch | `antenna.radiowaves.left.and.right` | No | Radio/comms metaphor |
| Incidents | `exclamationmark.shield.fill` | Yes | Security alert |
| More | `ellipsis` | No | Overflow menu |

**SF Symbol Selection Rules:**
- Use `.fill` variants for active tab state (solid, heavier visual weight)
- Choose metaphors that match the function, not the data shape
- Prefer symbols from SF Symbols 5+ for iOS 26 compatibility
- Test at all Dynamic Type sizes — symbols scale with text

---

## 13.7 ScreenTitleStrip — Title Below Header

### The Pattern

Screen titles go IN the page content, NOT in the native header. This is critical for iOS 26 because the native header must stay minimal (back button + action buttons) to allow the glass material to work correctly.

```typescript
// src/components/ui/glass/ScreenTitleStrip.tsx
function ScreenTitleStrip({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
    marginTop: 2,
  },
});
```

### Why This Pattern Exists

1. **Glass header stays transparent.** If you put the title in `headerTitle`, the native glass header must expand to accommodate it — breaking the minimal glass appearance.
2. **Scroll behavior works.** The title scrolls with content, and the glass header transitions on top of it as the user scrolls.
3. **Consistency with iOS 26 HIG.** Apple's own apps in iOS 26 use this pattern — large title in content, minimal glass header above.
4. **Animation freedom.** You can animate the in-content title strip on scroll (fade, scale, collapse) independently of the native header.

### Usage in Every Screen

```typescript
// In any screen:
export default function DailyLogScreen() {
  const { colors } = useTheme();

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <ScreenTitleStrip
        title="Daily Log"
        subtitle="Today's Activity"
      />
      {/* ... rest of screen content */}
    </ScreenContainer>
  );
}
```

---

## 13.8 Color System — Light & Dark Palettes

### EZTrack Color Adaptation

EZTrack uses **cyan (#06B6D4)** as primary and **amber (#F59E0B)** as accent. The EZXS-OS color architecture translates directly — swap the brand values, keep the semantic structure.

### Complete Light Palette

```typescript
export const lightColors = {
  // Text hierarchy
  textPrimary: '#1F2937',           // Gray-800
  textSecondary: '#6B7280',         // Gray-500
  textTertiary: '#71717A',          // 4.8:1 on white — WCAG AA pass
  textInverse: '#FFFFFF',

  // Backgrounds (iOS Grouped Pattern)
  background: '#F2F2F7',            // iOS systemGroupedBackground
  backgroundSecondary: '#EFEFF4',   // Deeper nesting
  backgroundTertiary: '#E5E5EA',    // Deepest nesting

  // Surfaces
  surface: '#FFFFFF',               // Cards on grouped gray
  surfaceElevated: '#FFFFFF',       // Same in iOS grouped pattern
  surfaceOverlay: 'rgba(0, 0, 0, 0.5)',

  // Borders
  border: '#D1D5DB',
  borderLight: '#E5E7EB',

  // Interactive (brand-tinted)
  interactive: 'eztrack-cyan-600',
  interactiveHover: 'eztrack-cyan-700',
  interactiveDisabled: '#D1D5DB',

  // Semantic status
  success: '#047857',               // 5.5:1 on white — AA pass
  warning: '#F59E0B',
  error: '#DC2626',                 // 4.8:1 on white — AA pass
  info: 'eztrack-cyan-500',

  // Translucent tints (for glass fallbacks)
  surfaceTintSubtle: 'rgba(0,0,0,0.03)',
  surfaceTintMedium: 'rgba(0,0,0,0.05)',
  surfaceTintStrong: 'rgba(0,0,0,0.08)',
  surfaceFrosted: 'rgba(242,242,247,0.8)',

  // Material 3 tonal surfaces (Android)
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7F5FA',
  surfaceContainer: '#F2EFF7',
  surfaceContainerHigh: '#ECE9F1',
  surfaceContainerHighest: '#E6E1E9',
};
```

### Complete Dark Palette

```typescript
export const darkColors = {
  // Text hierarchy
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#A1A1AA',
  textInverse: '#0A0A0B',

  // Backgrounds (true OLED black)
  background: '#000000',            // True black for OLED
  backgroundSecondary: '#161618',
  backgroundTertiary: '#232326',

  // Surfaces (iOS dark elevation)
  surface: '#1C1C1E',               // iOS systemGray6
  surfaceElevated: '#2C2C2E',       // iOS systemGray5
  surfaceOverlay: 'rgba(0, 0, 0, 0.7)',

  // Borders (translucent white)
  border: 'rgba(255,255,255,0.20)',
  borderLight: 'rgba(255,255,255,0.10)',

  // Interactive (lighter cyan in dark mode for contrast)
  interactive: 'eztrack-cyan-400',
  interactiveHover: 'eztrack-cyan-300',
  interactiveDisabled: '#52525B',

  // Semantic status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: 'eztrack-cyan-500',

  // Translucent tints
  surfaceTintSubtle: 'rgba(255,255,255,0.07)',
  surfaceTintMedium: 'rgba(255,255,255,0.08)',
  surfaceTintStrong: 'rgba(255,255,255,0.12)',
  surfaceFrosted: 'rgba(10,15,23,0.8)',

  // Material 3 tonal surfaces (Android)
  surfaceContainerLowest: '#0F0D13',
  surfaceContainerLow: '#1D1B20',
  surfaceContainer: '#211F26',
  surfaceContainerHigh: '#2B2930',
  surfaceContainerHighest: '#36343B',
};
```

### Color Design Decisions

| Decision | Light | Dark | Reason |
|----------|-------|------|--------|
| Background | `#F2F2F7` (iOS grouped) | `#000000` (OLED black) | iOS standard grouped background; true black saves battery on OLED |
| Surfaces | `#FFFFFF` | `#1C1C1E` | White cards on gray page (light); elevated dark surface (dark) |
| Text tertiary | `#71717A` not `#9CA3AF` | `#A1A1AA` | `#9CA3AF` only achieves 2.5:1 — fails WCAG AA. `#71717A` = 4.8:1 |
| Success | `#047857` not `#10B981` | `#10B981` | `#10B981` on white = 2.5:1 FAIL. Use darker green in light mode |
| Error | `#DC2626` not `#EF4444` | `#EF4444` | `#EF4444` on white = 3.8:1 (large text only). Use darker red |
| Interactive | `cyan-600` | `cyan-400` | Darker tint in light mode for contrast; lighter in dark for visibility |
| Borders | Solid grays | `rgba(255,255,255,0.xx)` | Translucent borders in dark mode blend with glass surfaces |

---

## 13.9 Typography — iOS HIG Scale

The complete iOS Human Interface Guidelines type scale. Every text element in EZTrack must use one of these styles.

```typescript
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '300', lineHeight: 41, letterSpacing: 0.37 },
  title1:     { fontSize: 28, fontWeight: '400', lineHeight: 34, letterSpacing: 0.36 },
  title2:     { fontSize: 22, fontWeight: '400', lineHeight: 26, letterSpacing: 0.35 },
  title3:     { fontSize: 20, fontWeight: '400', lineHeight: 24, letterSpacing: 0.38 },
  headline:   { fontSize: 17, fontWeight: '600', lineHeight: 22, letterSpacing: -0.41 },
  body:       { fontSize: 17, fontWeight: '400', lineHeight: 22, letterSpacing: -0.41 },
  callout:    { fontSize: 16, fontWeight: '400', lineHeight: 21, letterSpacing: -0.32 },
  subheadline:{ fontSize: 15, fontWeight: '400', lineHeight: 20, letterSpacing: -0.24 },
  footnote:   { fontSize: 13, fontWeight: '400', lineHeight: 18, letterSpacing: -0.08 },
  caption1:   { fontSize: 12, fontWeight: '400', lineHeight: 16, letterSpacing: 0    },
  caption2:   { fontSize: 11, fontWeight: '400', lineHeight: 13, letterSpacing: 0.07 },
};

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '900',
};
```

### Where Each Style Goes in EZTrack

| Style | Usage |
|-------|-------|
| `largeTitle` | ScreenTitleStrip main title (if extra emphasis needed) |
| `title1` | Standard ScreenTitleStrip title (28px, primary) |
| `title2` | Section headers, modal titles |
| `title3` | Card headers, subsection titles |
| `headline` | Emphasized body text, stat labels, bold captions |
| `body` | Primary body text, form labels, list item titles |
| `callout` | Secondary body, form field text |
| `subheadline` | Timestamps, metadata lines, subtitle text |
| `footnote` | Tertiary labels, status text, helper text |
| `caption1` | Badge text, small labels |
| `caption2` | Micro labels (rarely used) |

### Dynamic Type Compliance

- Keep `allowFontScaling: true` (React Native default) — this enables iOS Dynamic Type
- Test layouts at 200% text size via Settings → Accessibility → Larger Text
- Use `numberOfLines` and flexible layouts that accommodate text growth
- Never use fixed-height containers for text — use `minHeight` instead

---

## 13.10 Spacing & Layout Tokens

### 4px Base Unit Scale

```typescript
export const spacing = {
  xs:   4,    // Tight internal padding, icon margins
  sm:   8,    // Compact spacing, between related elements
  md:   12,   // Standard gap between elements
  lg:   16,   // Section padding, card padding
  xl:   20,   // Between cards in a list
  '2xl': 24,  // Section breaks
  '3xl': 32,  // Major section separation
  '4xl': 48,  // Screen-level separation (rare)
};
```

### Common Spacing Patterns

```typescript
export const spacingHelpers = {
  paddingBase: spacing.md,    // 12 — default screen padding
  paddingCompact: spacing.sm, //  8 — tight layouts
  paddingLarge: spacing.lg,   // 16 — generous layouts

  gapBase: spacing.md,        // 12 — between list items
  gapCompact: spacing.sm,     //  8 — between badge items
  gapSmall: spacing.xs,       //  4 — micro gaps
};
```

### Control Heights

| Control | Height | Usage |
|---------|--------|-------|
| Small button | 28px | Inline actions, chips |
| Medium button | 32px | Standard buttons |
| Large button | 36px | Prominent actions |
| XL button | 44px | Primary CTAs, bottom sheet actions |

**44px minimum touch target** for all interactive elements (iOS HIG standard).

### Card Layout Pattern

```
┌─────────────────────────────────┐
│  16px padding                   │
│  ┌───────────────────────────┐  │
│  │ Title (headline)          │  │
│  │ 4px gap                   │  │
│  │ Subtitle (subheadline)    │  │
│  └───────────────────────────┘  │
│  12px gap                       │
│  ┌───────────────────────────┐  │
│  │ Content area              │  │
│  └───────────────────────────┘  │
│  16px padding                   │
└─────────────────────────────────┘
```

### Border Radii

| Size | Value | Usage |
|------|-------|-------|
| `xs` | 4px | Tiny badges |
| `sm` | 8px | Buttons, input fields |
| `md` | 12px | Cards, containers |
| `lg` | 16px | Modals, sheets |
| `xl` | 20px | Large cards |
| `full` | 9999px | Pills, circular buttons |

---

## 13.11 Glass Component Library

### Complete Inventory for EZTrack

All components follow the three-tier template from §13.2.

#### GlassCard

Primary data display surface.

```typescript
// Three tiers:
// Glass: GlassView with 'regular' effect
// Blur: BlurView intensity 50, systemChromeMaterial tint
// Opaque: surface color + hairline border + elevation shadow (Android)

<GlassCard>
  <IncidentRow incident={item} />
</GlassCard>
```

#### GlassPill

Versatile pill-shaped button with three variants.

```typescript
// Variants:
// - filled: opaque primary background, white text
// - outline: glass/blur border, transparent fill
// - tinted: glass/blur fill with brand tint

// Sizes: sm (borderRadius 16), md (22), lg (26)
// Press animation: spring scale 0.96
// Always includes haptic feedback (selection)

<GlassPill variant="tinted" size="md" onPress={handleFilter}>
  <FilterIcon size={16} /> Active Incidents
</GlassPill>
```

#### GlassActionGroup

Multi-button glass pill for action bars.

```typescript
// Renders as single continuous glass surface with separator lines
// Glass tier: GlassContainer + GlassView with hairline separators
// Blur tier: BlurView with hairline separators
// Opaque tier: surface color with border

<GlassActionGroup
  actions={[
    { icon: PhoneIcon, label: 'Call', onPress: handleCall },
    { icon: MessageIcon, label: 'Message', onPress: handleMessage },
    { icon: ShareIcon, label: 'Share', onPress: handleShare },
  ]}
/>
```

#### GlassSegmentedControl

Animated tab selector with sliding glass indicator.

```typescript
// Spring config: damping 20, stiffness 200
// Sliding glass indicator tracks active segment
// Uses SharedValue for containerWidth measurement
// Animated translateX for smooth segment switching

<GlassSegmentedControl
  segments={['Overview', 'Details', 'Timeline']}
  selectedIndex={activeTab}
  onSelect={setActiveTab}
/>
```

#### GlassSwitch

Toggle switch with glass track.

```typescript
// ON state: brand-tinted glass fill (rgba(6, 182, 212, 0.25))
// OFF state: glass outline only
// Spring animation: damping 15, stiffness 200
// Thumb has shadow for depth perception

<GlassSwitch value={isEnabled} onToggle={setIsEnabled} />
```

#### GlassSheet

Bottom sheet wrapper with glass background.

```typescript
// Uses @gorhom/bottom-sheet with custom glass background
// Spring config: damping 20, stiffness 150, mass 0.8
// Handle indicator: 36×4 rounded, 50% opacity
// Backdrop: 25% opacity overlay

<GlassSheet snapPoints={['50%', '90%']}>
  <DispatchActions dispatch={selected} />
</GlassSheet>
```

#### GlassChip

Filter/tag chip with selection state.

```typescript
// Selected: tinted glass fill
// Unselected: glass outline
// Press animation: spring scale 0.95
// Respects glass depth context (no glass if nested)

<GlassChip selected={isActive} onPress={toggle}>
  Priority: Critical
</GlassChip>
```

#### GlassButton

Circular action button (for headers, floating actions).

```typescript
// Uses GlassContainer + GlassView for native glass merge
// Spring press animation
// Badge overlay for notification count
// 44px minimum touch target

<GlassButton
  icon={BellIcon}
  badge={unreadCount}
  onPress={openNotifications}
/>
```

#### GlassAlert / GlassNavBar / GlassFAB

Additional glass surfaces:
- **GlassAlert:** Toast-style notification with glass background
- **GlassNavBar:** Custom navigation bar (for screens that need it)
- **GlassFAB:** Floating action button with glass material

---

## 13.12 ThemeProvider Architecture

### Complete Implementation (from EZXS-OS)

```typescript
export function ThemeProvider({ children }: { children: ReactNode }) {
  // 1. Resolve color scheme
  const osScheme = useColorScheme() ?? Appearance.getColorScheme();
  const reduceMotion = useReducedMotion();
  const userScheme = uiStore((s) => resolveColorSchemePreference(s));
  const resolved = userScheme === 'system' ? osScheme : userScheme;

  // 2. Create theme object
  const theme = createTheme(resolved);
  const schemeKey = resolveSchemeKey(resolved);

  // 3. Synchronously lock native appearance BEFORE children mount
  //    (See §13.14 for full rules)
  if (userScheme === 'light' || userScheme === 'dark') {
    Appearance.setColorScheme(userScheme);
  }

  // 4. Theme transition overlay (See §13.13)
  // ... overlay animation logic ...

  // 5. Provide to both ThemeContext and React Navigation
  const rnTheme = isDarkResolved
    ? { ...DarkTheme, dark: true, colors: { ...DarkTheme.colors, background: darkColors.background, card: darkColors.background } }
    : { ...DefaultTheme, dark: false, colors: { ...DefaultTheme.colors, background: lightColors.background, card: lightColors.background } };

  return (
    <ThemeContext.Provider value={theme}>
      <RNThemeProvider value={rnTheme}>
        {children}
        {/* transition overlay */}
      </RNThemeProvider>
    </ThemeContext.Provider>
  );
}
```

### Theme Hooks

```typescript
// Primary hooks — use these in all components
export function useThemeColors(): ColorScheme    // Most common — just colors
export function useIsDark(): boolean             // For conditional rendering
export function useThemeSpacing(): typeof spacing // Spacing tokens
export function useThemeTypography(): typeof typography // Type scale
export function useTheme(): Theme                // Full theme object (rare)
```

### Critical Rule: Never Use `useColorScheme()` Directly

From CLAUDE.md:

> **Never use `useColorScheme()` from `react-native` directly in components** — it reads raw OS scheme and ignores user preference. Use `useIsDark()` or `useThemeColors()` from `@/theme` (inside ThemeProvider), or `useResolvedColorScheme()` from `@/hooks/useResolvedColorScheme` (outside ThemeProvider).

Only 4 files may import `useColorScheme`:
1. `theme/index.tsx` — the ThemeProvider itself
2. `_layout.tsx` — root layout (before ThemeProvider wraps)
3. `useResolvedColorScheme.ts` — pre-provider hook
4. `appearance.tsx` — appearance settings screen

---

## 13.13 Theme Transition Overlay

When the user toggles between light and dark mode, a smooth transition prevents jarring visual snaps.

### How It Works

1. Detect scheme change: `previousSchemeRef.current !== schemeKey`
2. Set overlay color to the PREVIOUS scheme's background (covers the old content)
3. Start at 0.32 opacity
4. Fade to 0 over 180ms
5. Remove overlay when animation completes

```typescript
// Transition overlay logic (inside ThemeProvider):
useEffect(() => {
  // Skip if reduce motion is enabled
  if (reduceMotion) {
    previousSchemeRef.current = schemeKey;
    overlayOpacity.setValue(0);
    return;
  }

  if (previousSchemeRef.current === schemeKey) return;

  previousSchemeRef.current = schemeKey;
  setOverlayColor(
    previousScheme === 'dark' ? darkColors.background : lightColors.background
  );
  overlayOpacity.setValue(0.32);
  Animated.timing(overlayOpacity, {
    toValue: 0,
    duration: 180,
    useNativeDriver: true,
  }).start(() => setOverlayColor(null));
}, [schemeKey]);

// Overlay view (absolute positioned, pointer-events none):
{overlayColor && (
  <Animated.View
    pointerEvents="none"
    style={[
      StyleSheet.absoluteFillObject,
      { backgroundColor: overlayColor, opacity: overlayOpacity, zIndex: 1 },
    ]}
  />
)}
```

**Key:** The overlay is the PREVIOUS background color fading out — this creates the illusion of the new theme sliding in underneath.

---

## 13.14 Color Scheme Resolution Rules

### Resolution Priority

```
User preference (MMKV) → OS setting → Fallback to light

1. If user chose 'light' or 'dark': use that, lock Appearance
2. If user chose 'system': use OS scheme, don't lock Appearance
3. If OS returns null/undefined: default to 'light'
```

### Synchronous Appearance Lock

**This must happen during render, NOT in a useEffect:**

```typescript
// CORRECT: synchronous, during render
if (userScheme === 'light' || userScheme === 'dark') {
  Appearance.setColorScheme(userScheme);
}

// WRONG: async, in useEffect — causes flash
useEffect(() => {
  Appearance.setColorScheme(userScheme); // TOO LATE
}, [userScheme]);
```

**Why synchronous?** iOS 26 native glass tabs and headers read the color scheme on frame 0. If you set it in a useEffect, the first frame renders with the wrong scheme, causing a white/black flash before correcting.

### When Switching Back to System

```typescript
// User switches from explicit → system:
if (wasExplicit && userScheme === 'system') {
  Appearance.setColorScheme(undefined); // Reset native lock
}

// First render with 'system': don't call setColorScheme at all
// (Let the OS control natively)
```

### Per-Scheme Splash Screen

`app.config.ts` must define separate splash assets:

```typescript
{
  ios: {
    splash: {
      light: { image: './assets/splash-light.png', backgroundColor: '#F2F2F7' },
      dark: { image: './assets/splash-dark.png', backgroundColor: '#000000' },
    },
  },
  android: {
    splash: {
      light: { image: './assets/splash-light.png', backgroundColor: '#F2F2F7' },
      dark: { image: './assets/splash-dark.png', backgroundColor: '#000000' },
    },
  },
}
```

---

## 13.15 Hydration Gate — No Flash Protocol

### The Problem

When the app cold-starts, MMKV needs to hydrate stored preferences (theme, auth, org) before the UI renders. Without a gate, the first frame renders with default values — causing a flash of wrong colors, wrong auth state, or missing data.

### The Solution

```typescript
// In root _layout.tsx:
const authHydrated = authStore((s) => s._hasHydrated);
const uiHydrated = uiStore((s) => s._hasHydrated);
const orgHydrated = organizationStore((s) => s._hasHydrated);

if (!authHydrated || !uiHydrated || !orgHydrated) {
  return null; // Native splash screen stays visible
}

// Only NOW render the app
return (
  <ThemeProvider>
    {/* ... full provider chain ... */}
  </ThemeProvider>
);
```

### How Hydration Reports

```typescript
// In each persisted store's persist config:
onRehydrateStorage: () => (_state, error) => {
  if (error) {
    console.warn("[Store] Hydration error, using defaults");
  }
  queueMicrotask(() => {
    storeRef.setState({ _hasHydrated: true });
  });
},
```

**`queueMicrotask`** ensures `_hasHydrated` is set after the full rehydration completes — not during.

### Splash Screen Dismissal

```typescript
// After hydration gate passes AND fonts load:
useEffect(() => {
  if (fontsLoaded && hasHydrated && uiHasHydrated) {
    requestAnimationFrame(() => {
      SplashScreen.hideAsync();
    });
  }
}, [fontsLoaded, hasHydrated, uiHasHydrated]);
```

**`requestAnimationFrame`** ensures the first frame is painted before the splash screen hides — no flicker.

---

## 13.16 Animation Standards

### Spring Physics (Consistent Across Components)

```typescript
// Primary spring — most UI animations
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 180,
  mass: 0.8,
};

// Gentle spring — sheets, large movements
const SHEET_SPRING = {
  damping: 20,
  stiffness: 150,
  mass: 0.8,
  overshootClamping: false,
};

// Snappy spring — segmented controls, switches
const SNAPPY_SPRING = {
  damping: 20,
  stiffness: 200,
};

// Tab bar indicator
const TAB_SPRING = {
  damping: 15,
  stiffness: 180,
  mass: 0.8,
};
```

### Press Animation Pattern

Every interactive element gets a subtle scale-down on press:

```typescript
// Standard press feedback
const pressed = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.96]) }],
}));

const handlePressIn = () => {
  pressed.value = withSpring(1, SNAPPY_SPRING);
  haptics.press();
};

const handlePressOut = () => {
  pressed.value = withSpring(0, SNAPPY_SPRING);
};
```

**Scale values:**
- Buttons/pills: 0.96
- Chips: 0.95
- Cards: 0.98 (subtle)
- Tab icons: 1.15 (bounce up on select)

### Navigation Transitions

```typescript
// src/lib/animations/transitions.ts
export const transitions = {
  fadeSlideUp: {
    animation: 'fade_from_bottom',
    duration: 300,
  },
  slideHorizontal: {
    animation: 'slide_from_right',
    duration: 250,
  },
  fadeIn: {
    animation: 'fade',
    duration: 200,
  },
  noAnimation: {
    animation: 'none',
  },
};
```

### Reduce Motion Compliance

```typescript
import { useReducedMotion } from '@/hooks/useReducedMotion';

// In any animated component:
const reduceMotion = useReducedMotion();

const animatedStyle = useAnimatedStyle(() => ({
  transform: reduceMotion
    ? [] // No animation
    : [{ scale: withSpring(pressed.value, SPRING_CONFIG) }],
}));
```

**The `useReducedMotion` hook:**

```typescript
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged', setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
```

**Rules:**
- All spring animations: skip when `reduceMotion` is true
- Haptic feedback: still works (separate from visual motion)
- Theme transitions: skip overlay fade (instant swap)
- Navigation: use `'fade'` instead of `'slide_from_right'`

---

## 13.17 Haptic Feedback System

### Safe Haptics Wrapper (from EZXS-OS)

```typescript
// src/lib/safeHaptics.ts
export const haptics = {
  // Selection — lightest, for taps and toggles
  selection:      () => select(),
  press:          () => select(),
  toggle:         () => select(),
  refresh:        () => select(),
  contextMenu:    () => select(),
  dismiss:        () => select(),

  // Impact — medium weight for confirmations
  light:          () => impact('Light'),
  medium:         () => impact('Medium'),
  heavy:          () => impact('Heavy'),
  confirm:        () => impact('Medium'),

  // Notification — for status changes
  success:        () => notify('Success'),
  warning:        () => notify('Warning'),
  error:          () => notify('Error'),
  scannerSuccess: () => notify('Success'),
  scannerWarning: () => notify('Warning'),
  scannerError:   () => notify('Error'),

  // Silent (no-ops for sheet open/close)
  sheetOpen:      async () => {},
  sheetClose:     async () => {},
};
```

### Gating

All haptics are gated by `uiStore.sensoryEnabled`:

```typescript
function isSensoryEnabled() {
  return uiStore.getState().sensoryEnabled ?? true;
}

function runWithGate(work: () => Promise<void>) {
  if (!isSensoryEnabled()) return Promise.resolve();
  return Promise.resolve(work()).catch(() => undefined);
}
```

### EZTrack Haptic Mapping

| Action | Haptic | Type |
|--------|--------|------|
| Tap any button | `haptics.press()` | Selection |
| Toggle filter | `haptics.toggle()` | Selection |
| Submit form | `haptics.confirm()` | Impact Medium |
| Status change (dispatch) | `haptics.success()` | Notification Success |
| Priority escalation | `haptics.warning()` | Notification Warning |
| Delete/cancel | `haptics.error()` | Notification Error |
| Pull to refresh | `haptics.refresh()` | Selection |
| Long press (context menu) | `haptics.contextMenu()` | Selection |
| Swipe action complete | `haptics.medium()` | Impact Medium |
| QR scan success | `haptics.scannerSuccess()` | Notification Success |
| QR scan invalid | `haptics.scannerError()` | Notification Error |

---

## 13.18 Accessibility Requirements

### Touch Targets

**44pt minimum** on all interactive elements. This is enforced by using `controlHeights.xl = 44` for primary actions.

```typescript
// CORRECT
<Pressable style={{ minHeight: 44, minWidth: 44 }}>

// WRONG — too small
<Pressable style={{ height: 24, width: 24 }}>
```

### Screen Reader Labels

```typescript
// Status badge — prefix with context
<View
  accessible
  accessibilityRole="text"
  accessibilityLabel={`Status: ${displayLabel}`}
>

// Priority badge — include severity
<View
  accessible
  accessibilityRole="text"
  accessibilityLabel={`Priority: ${priority}`}
>

// Dispatch card — full context announcement
<Pressable
  accessible
  accessibilityRole="button"
  accessibilityLabel={`Dispatch ${recordNumber}. ${dispatchCode}. Priority: ${priority}. Status: ${status}. Location: ${location}. ${assignedTo ? `Assigned to ${assignedTo}` : 'Unassigned'}`}
  accessibilityHint="Double tap to view dispatch details"
>

// Numeric values — spoken naturally
function priceLabel(amount: string): string {
  // "$29.99" → "29 dollars and 99 cents"
  const [dollars, cents] = amount.replace('$', '').split('.');
  return `${dollars} dollars${cents ? ` and ${cents} cents` : ''}`;
}
```

### Live Regions

```typescript
// For real-time updates (dispatch board, alerts)
<View accessibilityLiveRegion="polite">
  {/* Content that updates in real-time */}
</View>

// For critical alerts
<View accessibilityLiveRegion="assertive">
  {/* High-priority notifications */}
</View>
```

### Heading Levels

```typescript
function headingProps(level: 1 | 2 | 3) {
  return {
    accessibilityRole: 'header' as const,
    accessibilityLabel: undefined, // Use text content
  };
}

// Usage:
<Text {...headingProps(1)} style={typography.title1}>Daily Log</Text>
<Text {...headingProps(2)} style={typography.title2}>Filters</Text>
```

### Dynamic Type Support

- All typography uses the iOS HIG scale with `allowFontScaling: true`
- Test at Accessibility → Larger Text → maximum size
- Use flexible layouts (no fixed heights for text containers)
- Cards should grow vertically with text size increase

---

## 13.19 Safe Area Handling

### Provider Setup

```typescript
// Root layout wraps everything in SafeAreaProvider
import { SafeAreaProvider } from 'react-native-safe-area-context';

<SafeAreaProvider>
  <ThemeProvider>
    {/* ... app ... */}
  </ThemeProvider>
</SafeAreaProvider>
```

### Screen Container Pattern

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ScreenContainer({ children, backgroundColor }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {
      backgroundColor,
      // When header is transparent, add top inset
      // When header is opaque, top is handled by navigation
    }]}>
      {children}
    </View>
  );
}
```

### Key Inset Areas

| Area | When to Handle | How |
|------|---------------|-----|
| **Top** (Dynamic Island / notch) | Transparent headers only | `useSafeAreaInsets().top` |
| **Bottom** (Home indicator) | Screens without tab bar | `useSafeAreaInsets().bottom` |
| **Bottom** (with tab bar) | Tab root screens | Tab bar handles automatically |
| **Left/Right** (landscape) | Not applicable | EZTrack locks to portrait |

### Bottom Safe Area for Action Buttons

```typescript
// Floating buttons at bottom of screen:
const insets = useSafeAreaInsets();

<View style={{
  position: 'absolute',
  bottom: 0,
  left: 0, right: 0,
  paddingBottom: Math.max(insets.bottom, 16),
  paddingHorizontal: 16,
}}>
  <Button title="Submit Report" />
</View>
```

---

## 13.20 Dark Mode for Operations (EZTrack-Specific)

EZTrack should **default to dark mode** for new users. Security operations centers often work in low-light environments (night shifts, operations rooms with monitors, outdoor events at night). Dark mode reduces eye strain and screen glare.

### Design Decisions for Dark Mode Operations

| Decision | Value | Reason |
|----------|-------|--------|
| Default scheme | Dark | Security ops often in low light |
| Background | `#000000` (true black) | OLED battery savings, reduced glare |
| Card surfaces | `#1C1C1E` | Elevated from background, matches iOS dark |
| Status colors | Brighter variants | Need to pop against dark backgrounds |
| Critical alerts | Red with glow/border | Must be immediately noticeable |
| Glass blur intensity | 70 (higher than light) | Maintain visual hierarchy on dark |
| Glass effect style | `'prominent'` | Stronger refraction for dark backgrounds |

### Alert Color Visibility

In dark mode, semantic colors must have MORE saturation, not less:

```typescript
// Dark mode status badges — higher contrast
success: '#10B981', // Emerald-500 (brighter than light mode's #047857)
warning: '#F59E0B', // Amber-500 (same)
error: '#EF4444',   // Red-500 (brighter than light mode's #DC2626)
critical: '#FF3B30', // iOS system red — maximum visibility
```

### Night Operations Banner

Consider a subtle indicator when in "night mode" (dark + late hours):

```
┌─────────────────────────────────────────┐
│  🌙 Night Shift · Auto-dark mode active  │
└─────────────────────────────────────────┘
```

---

## 13.21 Glass Depth Context

### The Problem

Glass inside glass doesn't work well visually — it creates visual noise and performance issues. If a GlassCard is inside a GlassSheet, the inner card should NOT use glass.

### The Solution — GlassEffectContainer

```typescript
// src/components/ui/glass/GlassEffectContainer.tsx
const GlassDepthContext = createContext(0);

export function GlassEffectContainer({ children }) {
  const parentDepth = useContext(GlassDepthContext);
  return (
    <GlassDepthContext.Provider value={parentDepth + 1}>
      {children}
    </GlassDepthContext.Provider>
  );
}

export function useGlassDepth(): number {
  return useContext(GlassDepthContext);
}

// In any glass component:
function GlassChip({ children }) {
  const depth = useGlassDepth();
  const { platformTier } = useSupportsLiquidGlass();

  // If nested inside another glass surface, fall to opaque
  if (depth > 0 || platformTier === 'opaque') {
    return <OpaqueChip>{children}</OpaqueChip>;
  }

  if (platformTier === 'glass') {
    return <GlassView ...>{children}</GlassView>;
  }

  return <BlurChip>{children}</BlurChip>;
}
```

**Rule:** Glass at depth 0 only. Anything nested inside a glass container uses opaque fallback.

---

## 13.22 Bottom Sheet Standards

### Configuration

```typescript
import BottomSheet from '@gorhom/bottom-sheet';

// Standard snap points
const SNAP_POINTS = {
  small: ['25%'],
  medium: ['50%'],
  large: ['50%', '90%'],
  fullScreen: ['90%'],
};

// Spring config (matches EZXS-OS)
const SHEET_ANIMATION = {
  damping: 20,
  stiffness: 150,
  mass: 0.8,
  overshootClamping: false,
};
```

### Glass Background

```typescript
// Custom glass background for bottom sheets
function GlassSheetBackground({ style }) {
  const { platformTier } = useSupportsLiquidGlass();
  const { colors } = useTheme();

  if (platformTier === 'glass') {
    return <GlassView style={style} glassEffect="regular" />;
  }
  if (platformTier === 'blur') {
    return <BlurView intensity={90} tint="systemUltraThinMaterial" style={style} />;
  }
  return <View style={[style, { backgroundColor: colors.surface }]} />;
}
```

### Handle Indicator

```
┌──────────────────────────────┐
│         ━━━━━━━━━━           │  ← 36×4 rounded, 50% opacity
│                              │
│  Sheet content here          │
│                              │
└──────────────────────────────┘
```

```typescript
const handleIndicatorStyle = {
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: Platform.OS === 'ios'
    ? 'rgba(128, 128, 128, 0.5)'
    : colors.textSecondary,
};
```

---

## 13.23 Pull-to-Refresh Pattern

### Glass-Aware Refresh Control

```typescript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={colors.textSecondary} // Spinner color
      // iOS only:
      progressViewOffset={headerHeight} // Offset for transparent headers
    />
  }
/>
```

### Haptic on Pull

```typescript
const handleRefresh = async () => {
  haptics.refresh(); // Selection haptic on pull
  setRefreshing(true);
  await queryClient.invalidateQueries({ queryKey: [module] });
  setRefreshing(false);
};
```

---

## 13.24 Skeleton Loading Pattern

### Per-Module Skeletons

Each module has a custom skeleton that matches its card layout:

```typescript
function IncidentCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Title line */}
      <SkeletonLine width="60%" height={17} />
      <View style={{ height: 4 }} />
      {/* Subtitle line */}
      <SkeletonLine width="40%" height={13} />
      <View style={{ height: 12 }} />
      {/* Content lines */}
      <SkeletonLine width="90%" height={15} />
      <View style={{ height: 4 }} />
      <SkeletonLine width="75%" height={15} />
    </View>
  );
}

function SkeletonLine({ width, height }) {
  const { colors } = useTheme();
  return (
    <Animated.View
      style={{
        width, height,
        borderRadius: 4,
        backgroundColor: colors.surfaceTintMedium,
      }}
    />
  );
}
```

### Recovery Hook

```typescript
// Show skeleton for first load, error state on failure
function useDataWithSkeletonRecovery(queryKey, fetchFn) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchFn,
  });

  return {
    data,
    showSkeleton: isLoading && !data,
    showError: !!error && !data,
    showEmpty: !isLoading && !error && (!data || data.length === 0),
    refetch,
  };
}
```

---

## 13.25 Navigation Animation Presets

| Transition | Duration | Use Case |
|-----------|----------|----------|
| `fade_from_bottom` | 300ms | Modal presentation (create screens) |
| `slide_from_right` | 250ms | Standard push navigation (detail screens) |
| `fade` | 200ms | Tab switches, subtle transitions |
| `none` | 0ms | Instant (auth flow redirects) |

```typescript
// Apply to screen options:
<Stack.Screen
  name="incident-detail"
  options={{ animation: 'slide_from_right' }}
/>

<Stack.Screen
  name="create-incident"
  options={{ animation: 'fade_from_bottom', presentation: 'modal' }}
/>
```

---

## 13.26 Android Fallback Standards

When glass and blur aren't available, Android gets a quality experience through Material Design patterns:

### Surface Hierarchy

```typescript
// Use Material 3 tonal surfaces instead of glass
surfaceContainerLowest:  '#FFFFFF', // Base level
surfaceContainerLow:     '#F7F5FA', // Slight elevation
surfaceContainer:        '#F2EFF7', // Cards
surfaceContainerHigh:    '#ECE9F1', // Elevated cards
surfaceContainerHighest: '#E6E1E9', // Highest elevation
```

### Elevation Shadows

```typescript
Platform.select({
  android: {
    elevation: 2,           // Cards
    // elevation: 4,        // Headers
    // elevation: 8,        // Modals
    // elevation: 16,       // Dialogs
  },
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});
```

### Android Tab Bar

Uses `Tabs` from `expo-router` with lucide-react-native icons instead of NativeTabs + SF Symbols:

```typescript
<Tabs.Screen
  name="dashboard"
  options={{
    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
  }}
/>
```

---

## 13.27 WCAG AA Compliance Matrix

### Text Contrast Requirements

| Element | Light Mode | Dark Mode | Minimum Ratio |
|---------|-----------|-----------|---------------|
| Body text | `#1F2937` on `#FFFFFF` | `#FAFAFA` on `#1C1C1E` | 4.5:1 |
| Secondary text | `#6B7280` on `#FFFFFF` | `#A1A1AA` on `#1C1C1E` | 4.5:1 |
| Tertiary text | `#71717A` on `#FFFFFF` (4.8:1) | `#A1A1AA` on `#1C1C1E` | 4.5:1 |
| Large title | `#1F2937` on `#F2F2F7` | `#FAFAFA` on `#000000` | 3:1 |
| Success | `#047857` on `#FFFFFF` (5.5:1) | `#10B981` on `#1C1C1E` | 4.5:1 |
| Error | `#DC2626` on `#FFFFFF` (4.8:1) | `#EF4444` on `#1C1C1E` | 4.5:1 |
| Interactive | `cyan-600` on `#FFFFFF` | `cyan-400` on `#1C1C1E` | 3:1 min |

### Touch Target Sizes

| Element | Minimum Size | EZTrack Standard |
|---------|-------------|------------------|
| Buttons | 44×44pt | 44×44pt (XL control height) |
| List rows | 44pt height | 56pt+ (with padding) |
| Tab bar items | 44×44pt | Native (handled by system) |
| Header buttons | 44×44pt | 44×44pt |
| Badge/chip taps | 44×44pt | 44pt (with padding hit area) |

---

## 13.28 Decision Flowcharts

### "Which Header Pattern?" Flowchart

```
Is this a tab root screen?
  ├── YES → Blur Tab Header (getBlurTabHeaderOptions)
  └── NO → Does it have hero imagery at the top?
              ├── YES → Transparent Blur (getTransparentBlurHeaderOptions)
              └── NO → Is it a standard form/list/settings?
                          ├── YES → Seamless (getSeamlessHeaderOptions)
                          └── NO → Solid (getGlassHeaderOptions)
```

### "Glass or No Glass?" Flowchart

```
Is this component inside another glass surface?
  ├── YES → Opaque (depth > 0 means no glass)
  └── NO → Is the platform tier 'glass'?
              ├── YES → Use GlassView from expo-glass-effect
              └── NO → Is the platform tier 'blur'?
                          ├── YES → Use BlurView with systemChromeMaterial
                          └── NO → Use opaque with elevation (Android)
```

### "Which Spring Config?" Flowchart

```
What are you animating?
  ├── Press feedback → SNAPPY_SPRING (damping 20, stiffness 200)
  ├── Sheet/modal → SHEET_SPRING (damping 20, stiffness 150, mass 0.8)
  ├── Tab indicator → TAB_SPRING (damping 15, stiffness 180, mass 0.8)
  ├── Segmented control → SNAPPY_SPRING
  └── General UI → PRIMARY_SPRING (damping 15, stiffness 180, mass 0.8)
```

### "Which Haptic?" Flowchart

```
What happened?
  ├── User tapped something → haptics.press() (selection)
  ├── Toggled a switch/filter → haptics.toggle() (selection)
  ├── Confirmed an action → haptics.confirm() (impact medium)
  ├── Something succeeded → haptics.success() (notification)
  ├── Something warned → haptics.warning() (notification)
  ├── Something failed → haptics.error() (notification)
  ├── Pulled to refresh → haptics.refresh() (selection)
  └── Long pressed → haptics.contextMenu() (selection)
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  EZTrack Mobile — iOS 26 Design Quick Reference          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  THREE TIERS: Glass → Blur → Opaque (always all three)   │
│                                                          │
│  HEADERS: Tab roots = BlurTab, Forms = Seamless,          │
│           Hero detail = TransparentBlur                   │
│                                                          │
│  TITLES: In ScreenTitleStrip (content), NOT headerTitle   │
│                                                          │
│  THEME: Synchronous Appearance.setColorScheme() in        │
│         ThemeProvider render, NOT in useEffect             │
│                                                          │
│  HYDRATION: Wait for _hasHydrated on all stores before    │
│             rendering any UI. Splash stays until ready.    │
│                                                          │
│  COLORS: #F2F2F7 light bg, #000000 dark bg (OLED)        │
│          WCAG AA — tertiary text ≥ 4.5:1 ratio            │
│                                                          │
│  SPRING: damping 15–20, stiffness 150–200, mass 0.8      │
│          Scale 0.96 on press, 0.95 on chip press          │
│                                                          │
│  HAPTICS: Gate via sensoryEnabled. selection for taps,    │
│           impact for confirms, notification for status     │
│                                                          │
│  TOUCH: 44pt minimum on everything interactive            │
│                                                          │
│  GLASS: Depth 0 only. No glass inside glass.              │
│                                                          │
│  REDUCE MOTION: Skip all springs, skip theme overlay      │
│                                                          │
│  DEFAULT: Dark mode for security operations               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Back to Index:** [00-INDEX.md](./00-INDEX.md)
