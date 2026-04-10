# Phase 2: Theme & Design System — iOS 26 Liquid Glass

> **Goal:** Build a complete React Native design system that mirrors EZXS-OS's iOS 26 liquid glass architecture, adapted for EZTrack's cyan/amber brand identity and dark-mode-first security operations aesthetic.
> **Duration:** 3–4 days
> **Prerequisites:** Phase 1 complete (Expo scaffold, shared packages wired)
> **Reference:** EZXS-OS `apps/mobile/src/theme/`, `apps/mobile/src/components/ui/glass/`

---

## 2.1 Platform Tier Detection

The foundation of the entire design system. Every visual component branches on this.

### `src/hooks/useSupportsLiquidGlass.ts`

```typescript
import { Platform } from "react-native";

type PlatformTier = "glass" | "blur" | "opaque";

let _cachedTier: PlatformTier | null = null;

function detectPlatformTier(): PlatformTier {
  if (_cachedTier) return _cachedTier;

  if (Platform.OS === "ios") {
    try {
      const glassModule = require("expo-glass-effect");
      if (glassModule?.isGlassEffectAPIAvailable?.()) {
        _cachedTier = "glass";
        return "glass";
      }
    } catch {}
    _cachedTier = "blur";
    return "blur";
  }

  _cachedTier = "opaque";
  return "opaque";
}

export function useSupportsLiquidGlass() {
  const platformTier = detectPlatformTier();
  return {
    platformTier,
    supportsGlass: platformTier === "glass",
    supportsBlur: platformTier === "glass" || platformTier === "blur",
  };
}
```

---

## 2.2 Color System

### Design Decisions

EZTrack is a **security operations** app. EZXS-OS is a consumer events app. Key differences:

| Aspect | EZXS-OS | EZTrack Mobile |
|--------|---------|----------------|
| Default mode | System preference | Dark mode default (ops rooms) |
| Primary | Brand purple/blue | Cyan (#06B6D4) |
| Accent | Brand secondary | Amber (#F59E0B) |
| Background (dark) | #000000 (OLED) | #000000 (OLED) — same |
| Background (light) | #F2F2F7 (iOS gray) | #F2F2F7 (iOS gray) — same |
| Surface pattern | iOS system materials | iOS system materials + elevated tiers |
| Status colors | Semantic (paid/pending) | Operations (open/assigned/cleared) |

### `src/theme/colors.ts`

```typescript
import { STATUS_COLORS, PRIORITY_COLORS } from "@eztrack/shared";
import { BRAND } from "@eztrack/ui";

export const brand = {
  primary: BRAND.primary,           // #06B6D4 (Cyan)
  primaryLight: BRAND.primaryLight, // #A5F3FC
  primaryDark: BRAND.primaryDark,   // #0E5568
  accent: BRAND.accent,             // #F59E0B (Amber)
  accentLight: BRAND.accentLight,   // #FEF3C7
  accentDark: BRAND.accentDark,     // #92400E
} as const;

export interface ColorScheme {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Borders
  border: string;
  borderSubtle: string;

  // Interactive
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;

  // Semantic
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
  info: string;
  infoBg: string;

  // Glass-specific
  glassTint: string;
  glassSpecular: string;
}

export const lightColors: ColorScheme = {
  background: "#F2F2F7",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceSecondary: "#E5E5EA",

  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textTertiary: "#71717A",   // 4.8:1 WCAG AA ✓
  textInverse: "#FFFFFF",

  border: "#D1D5DB",
  borderSubtle: "#E5E7EB",

  primary: brand.primary,
  primaryText: "#FFFFFF",
  accent: brand.accent,
  accentText: "#FFFFFF",

  success: "#10B981",
  successBg: "#D1FAE5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEE2E2",
  info: "#3B82F6",
  infoBg: "#DBEAFE",

  glassTint: "rgba(255, 255, 255, 0.7)",
  glassSpecular: "rgba(255, 255, 255, 0.4)",
};

export const darkColors: ColorScheme = {
  background: "#000000",
  surface: "#1C1C1E",
  surfaceElevated: "#2C2C2E",
  surfaceSecondary: "#3A3A3C",

  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textInverse: "#1F2937",

  border: "#38383A",
  borderSubtle: "#2C2C2E",

  primary: brand.primary,
  primaryText: "#FFFFFF",
  accent: brand.accent,
  accentText: "#1A1A2E",

  success: "#34D399",
  successBg: "rgba(16, 185, 129, 0.15)",
  warning: "#FBBF24",
  warningBg: "rgba(245, 158, 11, 0.15)",
  error: "#F87171",
  errorBg: "rgba(239, 68, 68, 0.15)",
  info: "#60A5FA",
  infoBg: "rgba(59, 130, 246, 0.15)",

  glassTint: "rgba(0, 0, 0, 0.5)",
  glassSpecular: "rgba(255, 255, 255, 0.15)",
};
```

### `src/theme/statusColors.ts`

Bridge the shared web constants into React Native StyleSheet-compatible objects:

```typescript
import { STATUS_COLORS, PRIORITY_COLORS, OFFICER_STATUS_MAP, PATRON_FLAG_MAP } from "@eztrack/shared";
import type { UniversalStatus } from "@eztrack/shared";

export function getStatusStyle(status: UniversalStatus) {
  const colors = STATUS_COLORS[status];
  if (!colors) return STATUS_COLORS.open;
  return colors;
}

export function getPriorityStyle(priority: string) {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.none;
}

export function getOfficerStatusStyle(officerStatus: string) {
  const mapped = OFFICER_STATUS_MAP[officerStatus] ?? "archived";
  return getStatusStyle(mapped);
}

export function getPatronFlagStyle(flag: string) {
  const mapped = PATRON_FLAG_MAP[flag] ?? "archived";
  return getStatusStyle(mapped);
}
```

---

## 2.3 Typography

### `src/theme/typography.ts`

Following iOS Human Interface Guidelines type scale (same as EZXS-OS):

```typescript
export const typography = {
  // iOS Dynamic Type scale
  largeTitle:  { fontSize: 34, fontWeight: "700" as const, lineHeight: 41, letterSpacing: 0.37 },
  title1:      { fontSize: 28, fontWeight: "700" as const, lineHeight: 34, letterSpacing: 0.36 },
  title2:      { fontSize: 22, fontWeight: "700" as const, lineHeight: 28, letterSpacing: 0.35 },
  title3:      { fontSize: 20, fontWeight: "600" as const, lineHeight: 25, letterSpacing: 0.38 },
  headline:    { fontSize: 17, fontWeight: "600" as const, lineHeight: 22, letterSpacing: -0.41 },
  body:        { fontSize: 17, fontWeight: "400" as const, lineHeight: 22, letterSpacing: -0.41 },
  callout:     { fontSize: 16, fontWeight: "400" as const, lineHeight: 21, letterSpacing: -0.32 },
  subheadline: { fontSize: 15, fontWeight: "400" as const, lineHeight: 20, letterSpacing: -0.24 },
  footnote:    { fontSize: 13, fontWeight: "400" as const, lineHeight: 18, letterSpacing: -0.08 },
  caption1:    { fontSize: 12, fontWeight: "400" as const, lineHeight: 16, letterSpacing: 0 },
  caption2:    { fontSize: 11, fontWeight: "400" as const, lineHeight: 13, letterSpacing: 0.07 },
} as const;

export const fontWeights = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
} as const;
```

---

## 2.4 Spacing

### `src/theme/spacing.ts`

```typescript
export const spacing = {
  0: 0,
  "0.5": 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;

export const controlHeights = {
  xs: 24,
  sm: 28,
  md: 32,
  lg: 36,
  xl: 44,  // iOS minimum touch target
} as const;
```

---

## 2.5 ThemeProvider

### `src/theme/index.tsx`

```typescript
import React, { createContext, useContext, useMemo } from "react";
import { Appearance, Platform, useColorScheme as useRNColorScheme } from "react-native";
import { ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { lightColors, darkColors, brand, type ColorScheme } from "./colors";
import { typography, fontWeights } from "./typography";
import { spacing, radii, controlHeights } from "./spacing";

// Store import for user preference
import { uiStore, resolveColorSchemePreference } from "../stores/uiStore";

export interface Theme {
  colors: ColorScheme;
  brand: typeof brand;
  isDark: boolean;
  typography: typeof typography;
  fontWeights: typeof fontWeights;
  spacing: typeof spacing;
  radii: typeof radii;
  controlHeights: typeof controlHeights;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Resolve color scheme: user pref > system
  const osScheme = useRNColorScheme() ?? Appearance.getColorScheme();
  const userScheme = uiStore((s) => resolveColorSchemePreference(s));
  const resolvedScheme = userScheme === "system"
    ? (osScheme ?? "dark")  // Default dark for ops
    : userScheme;

  const isDark = resolvedScheme === "dark";

  // Sync with native appearance (critical: before children mount)
  if (userScheme === "light" || userScheme === "dark") {
    Appearance.setColorScheme(userScheme);
  }

  const theme = useMemo<Theme>(() => ({
    colors: isDark ? darkColors : lightColors,
    brand,
    isDark,
    typography,
    fontWeights,
    spacing,
    radii,
    controlHeights,
  }), [isDark]);

  // React Navigation theme for native header/tab bar colors
  const navTheme = useMemo(() => ({
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: brand.primary,
      background: isDark ? darkColors.background : lightColors.background,
      card: isDark ? darkColors.surface : lightColors.surface,
      text: isDark ? darkColors.textPrimary : lightColors.textPrimary,
      border: isDark ? darkColors.border : lightColors.border,
    },
  }), [isDark]);

  return (
    <ThemeContext.Provider value={theme}>
      <NavigationThemeProvider value={navTheme}>
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

// ── Hooks ────────────────────────────────────────────────────

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used within ThemeProvider");
  return theme;
}

export function useThemeColors(): ColorScheme {
  return useTheme().colors;
}

export function useIsDark(): boolean {
  return useTheme().isDark;
}

export function useThemeSpacing() {
  return useTheme().spacing;
}
```

---

## 2.6 Glass Recipes & Header Options

### `src/theme/glass.ts`

```typescript
import { Platform } from "react-native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

// ── Glass Recipes (for component rendering) ─────────────────

export const glassRecipes = {
  sheet: { blurIntensity: 90, tint: "systemUltraThinMaterial" as const, opacity: 0.88 },
  header: { blurIntensity: 80, tint: "systemChromeMaterial" as const, opacity: 0.94 },
  cta: { blurIntensity: 40, tint: "systemThinMaterial" as const, opacity: 0.75 },
  pill: { blurIntensity: 60, tint: "systemChromeMaterial" as const, opacity: 0.85 },
} as const;

// ── Header Options (3 tiers, matching EZXS-OS) ─────────────

/**
 * Blur tab header — used for tab root screens.
 * iOS 26+: native scroll-edge glass transitions
 * iOS <26: permanent systemChromeMaterial blur
 * Android: solid header with elevation
 */
export function getBlurTabHeaderOptions(
  backgroundColor: string,
): Partial<NativeStackNavigationOptions> {
  const base: Partial<NativeStackNavigationOptions> = {
    headerLargeTitle: false,
    headerShadowVisible: false,
  };

  if (Platform.OS === "ios") {
    // iOS 26+ gets native scroll-edge glass
    // iOS <26 gets permanent blur material
    return {
      ...base,
      headerTransparent: true,
      headerBlurEffect: "systemChromeMaterial",
      // @ts-expect-error — iOS 26+ prop
      scrollEdgeEffects: { top: "automatic" },
    };
  }

  // Android: solid header
  return {
    ...base,
    headerStyle: { backgroundColor },
  };
}

/**
 * Seamless header — matches page background, used for lists/forms/settings.
 * No visible header background distinction.
 */
export function getSeamlessHeaderOptions(
  backgroundColor: string,
): Partial<NativeStackNavigationOptions> {
  return {
    headerShadowVisible: false,
    headerTransparent: Platform.OS === "ios",
    headerStyle: Platform.OS === "ios"
      ? undefined
      : { backgroundColor },
    headerBlurEffect: Platform.OS === "ios" ? "systemChromeMaterial" : undefined,
  };
}

/**
 * Transparent header — for immersive screens with hero content (maps, photos).
 * Only use for detail screens with visual hero content.
 */
export function getTransparentHeaderOptions(): Partial<NativeStackNavigationOptions> {
  return {
    headerTransparent: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: "transparent" },
  };
}
```

---

## 2.7 Glass Components

Build these core glass components following the EZXS-OS three-tier pattern:

### Component Inventory

| Component | Purpose | iOS 26 | iOS <26 | Android |
|-----------|---------|--------|---------|---------|
| `GlassCard` | Elevated card surface | GlassView | BlurView | Surface + elevation |
| `GlassPill` | Status pill / chip | GlassView | BlurView | Opaque fill |
| `GlassSheet` | Bottom sheet modal | GlassView + spring | BlurView | Opaque sheet |
| `GlassAlert` | Alert banner | GlassView | BlurView | Surface elevated |
| `GlassNavBar` | Custom nav bar | GlassView | BlurView | Solid header |
| `GlassActionGroup` | Multi-action bar | GlassContainer | BlurView | Opaque bar |
| `GlassSegmentedControl` | Tab selector | GlassView | BlurView | Opaque segment |
| `GlassFAB` | Floating action button | GlassView | BlurView | Elevated FAB |

### Template Pattern (all glass components follow this):

```typescript
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useSupportsLiquidGlass } from "@/hooks/useSupportsLiquidGlass";
import { useThemeColors } from "@/theme";
import { useGlassTheme } from "@/hooks/useGlassTheme";

// Safe conditional import
let GlassView: any = null;
try {
  GlassView = require("expo-glass-effect").GlassView;
} catch {}

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
}

export function GlassCard({ children, style }: GlassCardProps) {
  const { platformTier } = useSupportsLiquidGlass();
  const colors = useThemeColors();
  const glassTheme = useGlassTheme();

  // Tier 1: iOS 26+ Liquid Glass
  if (platformTier === "glass" && GlassView) {
    return (
      <GlassView
        glassEffectStyle={glassTheme.glassStyle}
        style={[styles.card, style]}
      >
        {children}
      </GlassView>
    );
  }

  // Tier 2: iOS <26 Blur
  if (platformTier === "blur") {
    return (
      <View style={[styles.card, style]}>
        <BlurView
          intensity={glassTheme.blurIntensity}
          tint={glassTheme.blurTint}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  // Tier 3: Android / Opaque
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    padding: 16,
  },
});
```

### `src/hooks/useGlassTheme.ts`

```typescript
import { useIsDark } from "@/theme";

export interface GlassThemeConfig {
  glassStyle: "regular" | "prominent";
  blurIntensity: number;
  blurTint: "systemChromeMaterial" | "systemUltraThinMaterial";
  specularColor: string;
  isDark: boolean;
}

export function useGlassTheme(): GlassThemeConfig {
  const isDark = useIsDark();

  return {
    glassStyle: isDark ? "prominent" : "regular",
    blurIntensity: isDark ? 60 : 50,
    blurTint: "systemChromeMaterial",
    specularColor: isDark
      ? "rgba(255, 255, 255, 0.15)"
      : "rgba(255, 255, 255, 0.4)",
    isDark,
  };
}
```

---

## 2.8 Core UI Components

### Component Priority (build in this order):

1. **ScreenTitleStrip** — Large title below native header
2. **StatusBadge** — Universal status indicator (uses shared STATUS_COLORS)
3. **PriorityBadge** — Priority indicator (uses shared PRIORITY_COLORS)
4. **Button** — Primary, secondary, outline, ghost, destructive
5. **Input** — Text input with label, error state, icon support
6. **Select** — Dropdown picker (bottom sheet on mobile)
7. **Card** — Content card container
8. **Avatar** — User avatar with initials fallback
9. **EmptyState** — Empty list placeholder
10. **DataCard** — Module data display card (incident card, dispatch card, etc.)

### ScreenTitleStrip (critical pattern from EZXS-OS):

```typescript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

interface ScreenTitleStripProps {
  title: string;
  subtitle?: string;
}

export function ScreenTitleStrip({ title, subtitle }: ScreenTitleStripProps) {
  const { colors, typography: type } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[type.largeTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[type.subheadline, { color: colors.textSecondary, marginTop: 2 }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
});
```

### StatusBadge (bridges shared constants to native):

```typescript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getStatusStyle } from "@/theme/statusColors";
import type { UniversalStatus } from "@eztrack/shared";
import { useTheme } from "@/theme";

interface StatusBadgeProps {
  status: UniversalStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = getStatusStyle(status);
  const { typography: type } = useTheme();
  const displayLabel = label ?? status.replace(/_/g, " ");

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[type.caption1, styles.text, { color: style.text }]}>
        {displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
```

---

## 2.9 Icon System

### SF Symbols (iOS) + Lucide (cross-platform)

```typescript
// Tab bar: SF Symbols via NativeTabTrigger.Icon
// In-app: lucide-react-native for cross-platform consistency

import {
  ShieldAlert,
  Radio,
  ClipboardList,
  Users,
  Package,
  FolderSearch,
  UserCog,
  Wrench,
  UserCheck,
  BarChart3,
  TrendingUp,
  Settings,
  Bell,
  AlertTriangle,
} from "lucide-react-native";

// Map from shared NAV_ITEMS icon names to components
export const iconMap: Record<string, React.ComponentType<any>> = {
  ShieldAlert,
  Radio,
  ClipboardList,
  Users,
  Package,
  FolderSearch,
  UserCog,
  Wrench,
  UserCheck,
  BarChart3,
  TrendingUp,
  Settings,
  Bell,
  AlertTriangle,
};
```

---

## 2.10 Verification Checklist

- [ ] ThemeProvider renders without crash on iOS simulator
- [ ] Dark/light mode toggles correctly
- [ ] Glass components render on iOS 26+ simulator (or degrade gracefully on 18)
- [ ] Status badges show correct colors for all 10 universal statuses
- [ ] Priority badges show correct colors for critical/high/medium/low
- [ ] Typography scale matches iOS HIG (largeTitle through caption2)
- [ ] ScreenTitleStrip renders large title below native header
- [ ] Shared package imports work: `@eztrack/shared` constants render in native components
- [ ] Color contrast passes WCAG AA (4.5:1 for body text, 3:1 for large text)
- [ ] Appearance.setColorScheme called synchronously before children mount

---

**Previous:** [← Phase 1 — Foundation](./01-FOUNDATION.md)
**Next:** [Phase 3 — Auth & Data Layer →](./03-AUTH-DATA-LAYER.md)
