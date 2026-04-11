# Phase 4 — Component Library

> Port the EZXS-OS glass component library and UI primitives to EZTrack. 18 glass components + 50 UI components.

---

## 1. Glass Components (Foundation Layer)

All glass components use the 3-tier rendering system. Each checks `usePlatformTier()` and renders glass, blur, or opaque accordingly.

### GlassPill (Primary Button)

The main interactive button in the system. Replaces flat buttons.

```typescript
interface GlassPillProps {
  label: string
  icon?: LucideIcon
  variant: 'filled' | 'outline' | 'tinted'
  size: 'sm' | 'md' | 'lg'
  onPress: () => void
  disabled?: boolean
}
```

**Sizes:**

| Size | Height | Radius | H-Padding | Font Size | Font Weight |
|------|--------|--------|-----------|-----------|-------------|
| `sm` | auto | `16px` | `14px` | `13px` | 600 |
| `md` | auto | `22px` | `20px` | `15px` | 600 |
| `lg` | auto | `26px` | `28px` | `17px` | 700 |

**Variants:**

| Variant | Background (Light) | Background (Dark) | Border | Text |
|---------|-------------------|-------------------|--------|------|
| `filled` | `colors.interactive` (`#0891B2`) | `colors.interactive` (`#22D3EE`) | None | `#FFFFFF` |
| `outline` | Transparent | Transparent | `1px colors.border` | `colors.textPrimary` |
| `tinted` | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.07)` | `1px colors.borderLight` | `colors.textPrimary` |

**Pressed state:** `opacity: 0.7`, `scale: 0.98` (spring animation)
**Disabled state:** `opacity: 0.5`

### GlassButton (Circular Icon Button)

```typescript
interface GlassButtonProps {
  icon: LucideIcon
  onPress: () => void
  size?: number        // default 36
  badge?: boolean      // show indicator dot
  accessibilityLabel: string
}
```

| Property | Value |
|----------|-------|
| Size | `36px` default (circular) |
| Background | Glass/blur/`colors.surfaceTintSubtle` |
| Icon size | `size * 0.5` (18px at default) |
| Icon color | `colors.textPrimary` |
| Badge | 8px red dot, top-right |
| Pressed | `opacity: 0.6`, spring scale |

### GlassChip (Filter/Tag)

```typescript
interface GlassChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  icon?: LucideIcon
  disabled?: boolean
}
```

| Property | Value |
|----------|-------|
| Height | `34px` |
| H-Padding | `14px` |
| Radius | `17px` (pill) |
| Font size | `13px / 600` |
| Selected bg | `colors.surfaceTintStrong` |
| Unselected bg | Transparent |
| Selected border | `colors.interactive` |
| Unselected border | `colors.borderLight` |

### GlassSegmentedControl

```typescript
interface GlassSegmentedControlProps {
  segments: Array<{ label: string; value: string }>
  selectedValue: string
  onChange: (value: string) => void
}
```

| Property | Value |
|----------|-------|
| Height | `36px` |
| Radius | `18px` (container), `16px` (indicator) |
| Background | `colors.surfaceTintSubtle` |
| Indicator bg | Glass/blur/`colors.surface` |
| Animation | Spring: `damping: 15, stiffness: 200` |
| Font size | `14px / 600` |
| Active text | `colors.textPrimary` |
| Inactive text | `colors.textSecondary` |

### GlassSwitch

```typescript
interface GlassSwitchProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  label?: string
}
```

| Property | Value |
|----------|-------|
| Width | `51px` |
| Height | `31px` |
| Radius | `16px` |
| Track on | `colors.interactive` with glass tint |
| Track off | `colors.surfaceTintMedium` |
| Thumb | `24px` circle, `colors.surface` |
| Animation | Spring: `damping: 15, stiffness: 180` |

### GlassStepper

```typescript
interface GlassStepperProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}
```

| Property | Value |
|----------|-------|
| Height | `36px` |
| Radius | `10px` |
| Border | `1px colors.borderLight` |
| Button size | `36×36` |
| Font size | `17px / 600` (value display) |

### GlassActionGroup

Groups multiple icon buttons into a single glass pill:

```typescript
interface GlassActionGroupProps {
  actions: Array<{ icon: LucideIcon; onPress: () => void; badge?: boolean }>
  height?: number
  style?: ViewStyle
}
```

### GlassAlert

Modal alert with glass background:

```typescript
interface GlassAlertProps {
  visible: boolean
  title: string
  message?: string
  actions: Array<{ label: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  onDismiss?: () => void
}
```

**Layout rules:**
- 1 action → full width button
- 2 actions → side-by-side row
- 3+ actions → vertical stack

### GlassSheet / GlassSheetModal

Bottom sheet with glass background:

```typescript
// Config
snapPoints: ['55%', '85%']       // or single snap
enablePanDownToClose: true
keyboardBehavior: 'interactive'
keyboardBlurBehavior: 'restore'

// Spring
damping: 20, stiffness: 150, mass: 0.8

// Backdrop
opacity: 0.25 (glass recipe)
closes on press
```

**Handle indicator:** `36px` wide, `4px` tall, `2px` radius, `colors.textTertiary` at 0.5 opacity (iOS) / 0.4 (Android).

---

## 2. Card & Container Components

### GroupedCard

iOS Settings-style grouped card:

```typescript
interface GroupedCardProps {
  children: ReactNode
  style?: ViewStyle
}
```

| Property | Value |
|----------|-------|
| Background | `colors.surface` (`#FFFFFF` light / `#1C1C1E` dark) |
| Border | `hairlineWidth`, `colors.borderLight` |
| Radius | `12px` |
| Overflow | `hidden` |

### GroupedCardDivider

Hairline separator between rows inside a GroupedCard:

| Property | Value |
|----------|-------|
| Height | `StyleSheet.hairlineWidth` |
| Color | `colors.borderLight` |
| Margin left | `16px` (inset, aligns with row text) |

### IdentityCard

Avatar + title + subtitle + optional trailing content:

```typescript
interface IdentityCardProps {
  avatar: string | null
  title: string
  subtitle?: string
  children?: ReactNode  // trailing content
  onPress?: () => void
}
```

| Property | Value |
|----------|-------|
| Min height | `68px` |
| Padding | `16px` |
| Avatar size | `40px` (circular) |
| Gap | `12px` |
| Wrapped in | `GroupedCard` |

---

## 3. Row Components

### SettingsRow

Simple key-value row:

```typescript
interface SettingsRowProps {
  icon?: LucideIcon
  label: string
  value?: string
  onPress?: () => void
  trailing?: ReactNode  // custom trailing element
}
```

| Property | Value |
|----------|-------|
| Min height | `44px` |
| Padding | `12px horizontal` |
| Icon size | `20px` |
| Label | `17px / 400, colors.textPrimary` |
| Value | `17px / 400, colors.textSecondary` |
| Chevron | `ChevronRight`, `16px`, `colors.textTertiary` (if onPress) |

### SettingsListRow (Advanced)

Extended row with subtitle, badge, semantic tones:

```typescript
interface SettingsListRowProps {
  label: string
  value?: string
  subtitle?: string
  badge?: { label: string; tone: 'success' | 'warning' | 'critical' | 'neutral' | 'info' }
  onPress?: () => void
  trailing?: ReactNode
}
```

| Property | Value |
|----------|-------|
| Min height | `44px` (no subtitle), `58px` (with subtitle) |
| Padding | `14px vertical, 16px horizontal` |
| Label | `17px / 400` |
| Subtitle | `13px / 400, colors.textSecondary` |
| Badge tones | See Phase 6 (semantic tone colors) |

---

## 4. Avatar Component

### UserAvatar

```typescript
interface UserAvatarProps {
  uri?: string | null
  name?: string
  size?: number          // default 40
  seed?: string          // deterministic fallback color
}
```

| Property | Value |
|----------|-------|
| Size | `40px` default (any size) |
| Shape | Circular (`borderRadius: size/2`) |
| Fallback | SVG gradient based on seed hash |
| Border | Optional `1px colors.borderLight` |
| Placeholder | First initial of name, centered |

---

## 5. Badge Components

### FeatureBadge

"NEW" label for feature announcements:

| Property | Value |
|----------|-------|
| Radius | `4px` |
| Padding | `6px horizontal, 2px vertical` |
| Background | `colors.interactive` |
| Text | `10px / 700, #FFFFFF`, uppercase |
| Dismissible | Tappable to hide |

### ModeStateBadge

Status indicator (live, draft, completed, etc.):

| Property | Value |
|----------|-------|
| Radius | `999px` (pill) |
| Padding | `10px horizontal, 6px vertical` |
| Text | `12px / 600` |
| Uses semantic tones | success (green), warning (amber), critical (red), neutral (gray) |

---

## 6. Input Components

EZXS-OS doesn't have a generic `TextInput` wrapper — it uses native `TextInput` directly with consistent styling:

### Standard Input Styling

```typescript
const inputStyle = {
  backgroundColor: colors.surfaceContainerLow,  // #F7F5FA light / #1D1B20 dark
  borderWidth: 1.5,
  borderColor: colors.border,                    // #D1D5DB light / rgba(255,255,255,0.20) dark
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 17,
  fontWeight: '400',
  color: colors.textPrimary,
}

// Focus state
borderColor: colors.focusBorder  // #1F2937 light / #FAFAFA dark

// Error state
borderColor: BRAND.error         // #EF4444
```

### Inside Bottom Sheets

Use `BottomSheetTextInput` from gorhom instead of regular `TextInput`:

```typescript
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
// Same styling, different component for keyboard handling
```

### CountryPhoneInput

Country picker + phone number input (auth-specific):

| Property | Value |
|----------|-------|
| Country button | Flag emoji + code + chevron, `borderRadius: 12, padding: 12×14` |
| Phone input | `flex: 1, fontSize: 17, fontWeight: 500` |
| Country modal | Searchable FlatList, slide animation |
| Max length | `16 characters` |

### OTPInput

6-digit code input with hidden TextInput driving visible cells:

| Property | Current | Target (redesigned) |
|----------|---------|---------------------|
| Cell size | `46×54` | `52×60` |
| Cell radius | `12px` | `16px` |
| Cell border | `2px` | `2px` |
| Cell gap | `10px` | `8px` |
| Digit size | `24px / 600` | `28px / 700` |
| Active border | `BRAND.primary` | Keep |
| Error border | `BRAND.error` | Keep |
| Shake | 5-step timing | Spring: `damping: 4, stiffness: 300` |

---

## 7. Section Headers

```typescript
// Pattern for grouped content sections
<View style={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8 }}>
  <Text style={{
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  }}>
    BASIC INFO
  </Text>
</View>
```

For sections with actions:

```typescript
<SectionHeader
  title="Upcoming Events"
  action={{ label: 'See All', onPress: () => router.push('/events') }}
/>
```

---

## 8. Full Component Inventory

### Must-Have for EZTrack (Port from EZXS-OS)

| Component | Category | Priority |
|-----------|----------|----------|
| `GlassPill` | Button | Critical — replaces all buttons |
| `GlassButton` | Button | Critical — icon buttons |
| `GlassSheet` / `GlassSheetModal` | Sheet | Critical — auth, pickers, confirmations |
| `GlassSegmentedControl` | Control | High — tab/filter switching |
| `GlassChip` | Filter | High — filter bars |
| `GlassSwitch` | Control | High — toggles in settings |
| `GlassAlert` | Modal | High — confirmations, errors |
| `GroupedCard` | Container | Critical — settings/form grouping |
| `GroupedCardDivider` | Divider | Critical — row separation |
| `SettingsListRow` | Row | Critical — settings, menus |
| `IdentityCard` | Card | High — profile/account display |
| `UserAvatar` | Avatar | High — user display |
| `EmptyState` | State | High — empty lists/screens |
| `ErrorState` | State | High — error handling |
| `StickyActionBar` | Action | High — form submission |
| `GlassRefreshControl` | Control | Medium — branded pull-to-refresh |
| `ScreenTitleStrip` | Header | Medium — below-header titles |
| `GlassNavBar` | Header | Medium — custom animated headers |
| `GlassStepper` | Control | Low — quantity inputs |
| `GlassActionGroup` | Button | Low — grouped icon actions |

### Do NOT Port (EZXS-OS Specific)

- `LiveEventPulsingDot` — organizer-specific
- `ManageEventTabBar` — event management specific
- `WizardShell` — event creation specific (adapt pattern, not component)
- EZXS-specific empty state registry entries (create EZTrack entries instead)

---

## 9. EZTrack Adaptation Checklist

- [ ] Port all glass components with 3-tier rendering
- [ ] Port `GroupedCard`, `GroupedCardDivider`, `IdentityCard`
- [ ] Port `SettingsRow`, `SettingsListRow`
- [ ] Port `UserAvatar` with fallback gradient
- [ ] Port `GlassPill` with all variants and sizes
- [ ] Port `EmptyState` system with EZTrack-specific registry entries
- [ ] Port `ErrorState` with all error types
- [ ] Port `StickyActionBar`
- [ ] Create standard input styling constants (not a component, just shared styles)
- [ ] Port `OTPInput` with updated cell sizes
- [ ] Port `CountryPhoneInput` for phone auth
- [ ] Ensure all components use `useThemeColors()` — no hardcoded colors
- [ ] Ensure all interactive components include `Haptics.impactAsync()`
- [ ] Ensure all components respect `useReducedMotion()`
- [ ] Test glass tier, blur tier, and opaque tier for every glass component
