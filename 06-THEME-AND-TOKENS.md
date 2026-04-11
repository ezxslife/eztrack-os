# Phase 6 — Theme & Token System

> Port the complete EZXS-OS semantic token system to EZTrack. This is the foundation — everything else depends on it.

---

## 1. Brand Palette Source

From `@ezxs/brand` package (`packages/brand/brand.manifest.json`):

### Primary (Cyan)

```
50:  #ECFEFF     ← lightest tint
100: #CFFAFE
200: #A5F3FC
300: #67E8F9     ← dark mode hover
400: #22D3EE     ← dark mode interactive
500: #06B6D4     ← brand base
600: #0891B2     ← light mode interactive / BRAND.primary
700: #0E7490     ← light mode hover / BRAND.primaryDark
800: #0E5568
900: #164E63
950: #0A3A4A     ← darkest shade
```

### Accent (Orange)

```
400: #FB923C
500: #F97316     ← accent base
600: #EA580C
```

### Neutral

```
0:   #FFFFFF
50:  #F8FAFC
100: #F1F5F9
200: #E2E8F0
400: #94A3B8
500: #64748B
700: #334155
900: #0F172A
950: #020617
```

---

## 2. BRAND Constants

Derived from brand palette, used for hardcoded references:

```typescript
export const BRAND = {
  primary:     '#0891B2',   // uiPrimary[600]
  primaryDark: '#0E7490',   // uiPrimary[700]
  accent:      '#F97316',   // uiAccent[500]
  success:     '#10B981',
  warning:     '#F59E0B',
  error:       '#EF4444',
  info:        '#06B6D4',   // uiPrimary[500]
  indigo:      '#6366F1',
  neutral:     '#6B7280',   // Gray-500
  danger:      '#DC2626',   // Red-600
}
```

---

## 3. Semantic Color Tokens

### Light Mode

```typescript
const lightColors = {
  // Text
  textPrimary:      '#1F2937',
  textSecondary:    '#6B7280',
  textTertiary:     '#71717A',    // WCAG AA ✓ at 4.8:1 on white
  textInverse:      '#FFFFFF',

  // Backgrounds
  background:          '#F2F2F7',    // iOS systemGroupedBackground
  backgroundSecondary: '#EFEFF4',
  backgroundTertiary:  '#E5E5EA',

  // Surfaces
  surface:          '#FFFFFF',
  surfaceElevated:  '#FFFFFF',
  surfaceOverlay:   'rgba(0, 0, 0, 0.5)',

  // Borders
  border:           '#D1D5DB',
  borderLight:      '#E5E7EB',
  borderEmphasis:   '#C7C7CC',

  // Interactive
  interactive:         '#0891B2',    // uiPrimary[600]
  interactiveHover:    '#0E7490',    // uiPrimary[700]
  interactiveDisabled: '#D1D5DB',
  interactiveSolid:    '#0E7490',    // uiPrimary[700] — same in both modes
  interactiveSolidText:'#FFFFFF',

  // Buttons (monochrome — used for non-brand buttons)
  buttonPrimary:     '#1A1A1A',
  buttonPrimaryText: '#FFFFFF',

  // Selection & Focus
  selectionBg:     '#E5E5EA',
  selectionBorder: '#1F2937',
  selectionText:   '#1F2937',
  focusBorder:     '#1F2937',

  // Icon Chrome
  iconChromeBg: '#E5E5EA',
  iconChromeFg: '#1F2937',

  // Status
  success:         '#047857',    // WCAG AA ✓ at 5.5:1 on white
  warning:         '#F59E0B',
  error:           '#DC2626',    // WCAG AA ✓ at 4.8:1 on white
  info:            '#06B6D4',
  errorBackground: 'rgba(239,68,68,0.08)',

  // Brand
  brand:              '#0891B2',
  brandText:          '#0E7490',
  brandContrastText:  '#FFFFFF',
  accent:             '#F97316',

  // Surface Tints (translucent overlays)
  surfaceTintSubtle:  'rgba(0,0,0,0.03)',
  surfaceTintMedium:  'rgba(0,0,0,0.05)',
  surfaceTintStrong:  'rgba(0,0,0,0.08)',
  surfaceFrosted:     'rgba(242,242,247,0.8)',

  // Material 3 Surface Containers (Android depth hierarchy)
  surfaceContainerLowest:  '#FFFFFF',
  surfaceContainerLow:     '#F7F5FA',
  surfaceContainer:        '#F2EFF7',
  surfaceContainerHigh:    '#ECE9F1',
  surfaceContainerHighest: '#E6E1E9',

  // Third-party
  stripe:     '#635BFF',
  stripeText: '#FFFFFF',
}
```

### Dark Mode

```typescript
const darkColors = {
  // Text
  textPrimary:      '#FAFAFA',
  textSecondary:    '#A1A1AA',
  textTertiary:     '#A1A1AA',
  textInverse:      '#0A0A0B',

  // Backgrounds
  background:          '#000000',    // true OLED black
  backgroundSecondary: '#161618',
  backgroundTertiary:  '#232326',

  // Surfaces
  surface:          '#1C1C1E',
  surfaceElevated:  '#2C2C2E',
  surfaceOverlay:   'rgba(0, 0, 0, 0.7)',

  // Borders
  border:           'rgba(255,255,255,0.20)',
  borderLight:      'rgba(255,255,255,0.10)',
  borderEmphasis:   'rgba(255,255,255,0.18)',

  // Interactive
  interactive:         '#22D3EE',    // uiPrimary[400]
  interactiveHover:    '#67E8F9',    // uiPrimary[300]
  interactiveDisabled: '#52525B',
  interactiveSolid:    '#0E7490',    // uiPrimary[700] — same in both modes
  interactiveSolidText:'#FFFFFF',

  // Buttons (monochrome)
  buttonPrimary:     '#FFFFFF',
  buttonPrimaryText: '#0A0A0B',

  // Selection & Focus
  selectionBg:     '#232326',
  selectionBorder: '#FAFAFA',
  selectionText:   '#FAFAFA',
  focusBorder:     '#FAFAFA',

  // Icon Chrome
  iconChromeBg: '#232326',
  iconChromeFg: '#FAFAFA',

  // Status
  success:         '#10B981',
  warning:         '#F59E0B',
  error:           '#EF4444',
  info:            '#06B6D4',
  errorBackground: 'rgba(239,68,68,0.12)',

  // Brand
  brand:              '#0891B2',
  brandText:          '#67E8F9',    // uiPrimary[300]
  brandContrastText:  '#FFFFFF',
  accent:             '#F97316',

  // Surface Tints
  surfaceTintSubtle:  'rgba(255,255,255,0.07)',
  surfaceTintMedium:  'rgba(255,255,255,0.08)',
  surfaceTintStrong:  'rgba(255,255,255,0.12)',
  surfaceFrosted:     'rgba(10,15,23,0.8)',

  // Material 3 Surface Containers
  surfaceContainerLowest:  '#0F0D13',
  surfaceContainerLow:     '#1D1B20',
  surfaceContainer:        '#211F26',
  surfaceContainerHigh:    '#2B2930',
  surfaceContainerHighest: '#36343B',

  // Third-party
  stripe:     '#635BFF',
  stripeText: '#FFFFFF',
}
```

---

## 4. Theme Hook

```typescript
// src/theme/index.tsx

export function useThemeColors() {
  const isDark = useIsDark()
  return isDark ? darkColors : lightColors
}

export function useIsDark(): boolean {
  // Reads from uiStore (user preference) NOT from useColorScheme() directly
  // See CLAUDE.md: "Never use useColorScheme() from react-native directly"
  const colorScheme = useResolvedColorScheme()
  return colorScheme === 'dark'
}
```

**Critical rule from CLAUDE.md:** Never use `useColorScheme()` from `react-native` directly. It reads raw OS scheme and ignores user preference. Use `useIsDark()` from `@/theme` or `useResolvedColorScheme()` from `@/hooks/useResolvedColorScheme`.

---

## 5. Glass Recipes

```typescript
// src/theme/glass.ts

export const glassRecipes = {
  sheet: {
    blurIntensity: 90,
    tint: 'systemUltraThinMaterial' as const,
    fallbackColor: { light: 'rgba(255, 255, 255, 0.88)', dark: 'rgba(0, 0, 0, 0.88)' },
    backdropOpacity: 0.25,
  },
  header: {
    blurIntensity: 80,
    tint: 'systemChromeMaterial' as const,
    fallbackColor: { light: 'rgba(242, 242, 247, 0.94)', dark: 'rgba(0, 0, 0, 0.92)' },
  },
  cta: {
    blurIntensity: 40,
    tint: 'systemChromeMaterial' as const,
    fallbackColor: { light: 'rgba(242, 242, 247, 0.75)', dark: 'rgba(0, 0, 0, 0.75)' },
  },
}
```

---

## 6. Spacing Scale

4px base unit:

```typescript
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
}
```

### Common Combinations

| Context | Token | Px |
|---------|-------|-----|
| Screen horizontal padding | `xl` | 20 |
| Settings screen h-padding | `lg` | 16 |
| Card internal padding | `lg` | 16 |
| Gap between buttons | `md` | 12 |
| Gap between sections | `2xl` | 24 |
| Gap between section header and content | `sm` | 8 |
| Compact density padding | `sm` | 8 |
| Settings section top margin | `3xl` | 32 (actually 28 in settings) |

---

## 7. Typography Scale (iOS HIG)

```typescript
export const typography = {
  largeTitle:  { fontSize: 34, fontWeight: '300', lineHeight: 41, letterSpacing: 0.37 },
  title1:      { fontSize: 28, fontWeight: '400', lineHeight: 34, letterSpacing: 0.36 },
  title2:      { fontSize: 22, fontWeight: '400', lineHeight: 26, letterSpacing: 0.35 },
  title3:      { fontSize: 20, fontWeight: '400', lineHeight: 24, letterSpacing: 0.38 },
  headline:    { fontSize: 17, fontWeight: '600', lineHeight: 22, letterSpacing: -0.41 },
  body:        { fontSize: 17, fontWeight: '400', lineHeight: 22, letterSpacing: -0.41 },
  callout:     { fontSize: 16, fontWeight: '400', lineHeight: 21, letterSpacing: -0.32 },
  subheadline: { fontSize: 15, fontWeight: '400', lineHeight: 20, letterSpacing: -0.24 },
  footnote:    { fontSize: 13, fontWeight: '400', lineHeight: 18, letterSpacing: -0.08 },
  caption1:    { fontSize: 12, fontWeight: '400', lineHeight: 16, letterSpacing: 0 },
  caption2:    { fontSize: 11, fontWeight: '400', lineHeight: 13, letterSpacing: 0.07 },
}
```

### Font Weights

```typescript
export const fontWeights = {
  light:    '300',
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  heavy:    '900',
}
```

### Usage in Screens

| Element | Typography Token | Weight Override |
|---------|-----------------|----------------|
| Screen title (large) | `largeTitle` | `800` (heavier than spec) |
| Screen title (inline) | `headline` | `600` |
| Section header | `footnote` | `600`, uppercase, `letterSpacing: 0.5` |
| Body text | `body` | `400` |
| Button label | `headline` | `700` for large buttons |
| Input label | `subheadline` | `600` |
| Input text | `body` | `400` |
| Footer/terms | `caption1` | `400` |
| Badge text | `caption1` | `600` |
| Tab label | `caption2` | `500` normal / `600` selected |

---

## 8. Sizing Standards

### Control Heights

| Component | Height |
|-----------|--------|
| GlassPill (sm) | auto (~28px) |
| GlassPill (md) | auto (~36px) |
| GlassPill (lg) | auto (~44px) |
| GlassButton | 36px (default) |
| GlassChip | 34px |
| GlassSegmentedControl | 36px |
| GlassSwitch | 31px |
| GlassStepper | 36px |
| SettingsRow | 44px min |
| SettingsListRow (with subtitle) | 58px min |
| IdentityCard | 68px min |
| Native header | 44px |
| Tab bar | 52px + safe area |
| OTP cell | 52×60px |
| Touch target minimum | 44×44px |

### Border Radii

| Component | Radius |
|-----------|--------|
| GroupedCard | 12px |
| Input fields | 12px |
| GlassPill (sm) | 16px |
| GlassPill (md) | 22px |
| GlassPill (lg) | 26px |
| OTP cell | 16px |
| GlassButton | 50% (circular) |
| GlassChip | 17px (pill) |
| GlassSegmentedControl | 18px container, 16px indicator |
| Glass sheet handle | 2px |
| Avatar | 50% (circular) |
| Badge pill | 999px |

---

## 9. Z-Index Layers

```typescript
export const zIndex = {
  dropdown:       1000,
  sticky:         1100,
  fixed:          1200,
  globalBanner:   1250,
  modalBackdrop:  1300,
  modal:          1400,
  popover:        1500,
  toast:          1600,
  tooltip:        1700,
  overlayTop:     9000,
  devTools:       9999,
}
```

**Rules:**
- Local stacking (within a component): `1`–`10` is fine
- Everything else uses these tokens
- GlassSheet uses `zIndex: 1200` + `elevation: 1200`
- Never hardcode z-index above 50

---

## 10. Semantic Badge Tones

For status badges and icon tiles:

| Tone | Light BG | Light FG | Dark BG | Dark FG |
|------|----------|----------|---------|---------|
| info | `#DBEAFE` | `#1D4ED8` | `#1E3A8A` | `#BFDBFE` |
| accent | `#FCE7F3` | `#BE185D` | `#831843` | `#F9A8D4` |
| success | `#DCFCE7` | `#047857` | `#065F46` | `#A7F3D0` |
| warning | `#FEF3C7` | `#B45309` | `#92400E` | `#FDE68A` |
| critical | `#FEE2E2` | `#B91C1C` | `#991B1B` | `#FECACA` |
| neutral | `#E4E4E7` | `#3F3F46` | `#3F3F46` | `#F4F4F5` |
| indigo | `#E0E7FF` | `#3730A3` | `#312E81` | `#C7D2FE` |

---

## 11. Opacity Standards

| State | Opacity |
|-------|---------|
| Disabled components | `0.50–0.55` |
| Pressed state | `0.60–0.70` |
| Glass outline (light) | `rgba(0,0,0,0.08–0.30)` |
| Glass outline (dark) | `rgba(255,255,255,0.10–0.35)` |
| Tinted fill (light) | `rgba(0,0,0,0.03–0.08)` |
| Tinted fill (dark) | `rgba(255,255,255,0.06–0.12)` |
| Handle indicator (iOS) | `0.5` |
| Handle indicator (Android) | `0.4` |
| Disabled text buttons | `0.45` |

---

## 12. Animation Constants

### Spring Configs

```typescript
// Snappy (buttons, chips, toggles)
const SPRING_SNAPPY = { damping: 14, stiffness: 120, mass: 0.7 }

// Gentle (entrance animations, large transitions)
const SPRING_GENTLE = { damping: 18, stiffness: 82, mass: 1 }

// Sheet spring
const SPRING_SHEET = { damping: 20, stiffness: 150, mass: 0.8, overshootClamping: false }

// Segmented control indicator
const SPRING_CONTROL = { damping: 15, stiffness: 200 }

// Glass button press
const SPRING_BUTTON = { damping: 15, stiffness: 150, mass: 0.8 }
```

### Reduced Motion

All animations check `useReducedMotion()` and fall back to instant transitions.

---

## 13. Theme Hydration Gate

From CLAUDE.md: "Never render any UI until `uiStore._hasHydrated` is true."

```typescript
// Root layout
const hasHydrated = useUIStore(state => state._hasHydrated)
if (!hasHydrated) return null  // or splash screen
```

And: "`Appearance.setColorScheme()` must be called synchronously during render (not in useEffect) inside ThemeProvider, BEFORE children mount."

---

## 14. EZTrack Adaptation Checklist

- [ ] Create `@ezxs/brand` package dependency or copy brand palette
- [ ] Create `src/theme/colors.ts` with full light/dark color sets
- [ ] Create `src/theme/glass.ts` with 3 glass recipes
- [ ] Create `src/theme/spacing.ts` with 4px-based scale
- [ ] Create `src/theme/typography.ts` with iOS HIG scale
- [ ] Create `src/theme/index.tsx` with `useThemeColors()`, `useIsDark()`, `useThemeSpacing()`
- [ ] Create `src/theme/organizerSemantic.ts` with badge tone colors
- [ ] Create `BRAND` constants object
- [ ] Create `useResolvedColorScheme()` hook (respects user preference, not raw OS)
- [ ] Set up Zustand `uiStore` with `_hasHydrated` flag
- [ ] Implement theme hydration gate in root layout
- [ ] Call `Appearance.setColorScheme()` synchronously in ThemeProvider
- [ ] Verify WCAG AA contrast for all text/background pairs
- [ ] Test light mode on device
- [ ] Test dark mode on device (verify OLED black `#000000`)
- [ ] Search codebase for hardcoded hex values — replace with tokens
