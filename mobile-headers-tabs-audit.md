# Mobile Headers & Tabs Audit — iOS 26 Native Patterns

> **Date:** 2026-04-11
> **Scope:** Native headers, tab bars, toolbars, status bars — iOS 26 Liquid Glass compliance
> **Reference:** `mobile-plan/13-IOS26-DESIGN-REFERENCE.md` §13.5–13.7, EZXS-OS `src/navigation/`

---

## Current State

EZTrack has a solid navigation infrastructure with 8 files in `src/navigation/`. The iOS-specific tab layout exists (`_layout.ios.tsx`). Glass header options and native header items are built. The gap is primarily in **applying these patterns consistently across all screens** and adding **missing header behaviors**.

### Built Infrastructure

| File | What It Does | Status |
|------|-------------|--------|
| `tab-specs.ts` | Tab definitions with SF Symbols + icons | ✅ Good |
| `native-header-items.tsx` | Header button builders (back, close, action) | ✅ Good |
| `stack-screen-options.ts` | Preset screen options for different header types | ✅ Good |
| `route-metadata.ts` | Route metadata for titles, icons, breadcrumbs | ✅ Good |
| `NativeHeaderContext.tsx` | Context for sharing header state | ✅ Good |
| `TabRootStackLayout.tsx` | Reusable stack layout for tab roots | ✅ Good |
| `SearchableIndexStackLayout.tsx` | Stack layout with native search | ✅ Good |
| `useIOSNativeSearchHeader.ts` | iOS native search bar integration | ✅ Good |

### Theme Header Support

| File | What It Does | Status |
|------|-------------|--------|
| `src/theme/headers.ts` | Header style presets (glass, blur, solid, transparent) | ✅ Good |
| `src/theme/glass.ts` | Glass material recipes for headers | ✅ Good |
| `src/theme/controlTokens.ts` | Control sizing tokens | ✅ Good |

---

## THE 4 HEADER PATTERNS (from iOS 26 Reference)

Every screen in the app must use exactly one of these 4 header patterns. The decision flowchart:

```
Does screen have hero media/map/camera?
  YES → Pattern 4: Transparent (immersive)
  NO → Is it a tab root?
    YES → Pattern 1: Blur Root
    NO → Is it a form/create/edit screen?
      YES → Pattern 3: Solid/Seamless
      NO → Pattern 2: Standard Push
```

### Pattern 1: Blur Root Header (Tab roots)
**Use for:** Dashboard, Daily Log, Incidents, Dispatch, Personnel, Analytics, Reports, More

```typescript
// From headers.ts — should produce:
{
  headerLargeTitle: false,
  headerTransparent: true,
  headerBlurEffect: platformTier === 'glass' ? 'systemChromeMaterial' : 'regular',
  headerStyle: { backgroundColor: 'transparent' },
  scrollEdgeEffects: platformTier === 'glass' ? { top: 'automatic' } : undefined,
  headerTitle: () => null,  // Title goes in ScreenTitleStrip
  headerLeft: () => <UserAvatarButton />,   // or org logo
  headerRight: () => <NotificationBellButton />,
}
```

**Screen assignment audit:**

| Screen | Header Pattern | Left Item | Right Items | Status |
|--------|---------------|-----------|-------------|--------|
| Dashboard | Blur Root | Org logo | Notifications, Profile | 🟡 Needs items |
| Daily Log | Blur Root | None (back if pushed) | Add entry, Filter | 🟡 Needs items |
| Incidents | Blur Root | None | Add, Filter, Map toggle | 🟡 Needs items |
| Dispatch | Blur Root | None | Add, Filter, Map toggle | 🟡 Needs items |
| Personnel | Blur Root | None | Search, Filter | 🟡 Needs items |
| Analytics | Blur Root | None | Date range, Export | 🟡 Needs items |
| Reports | Blur Root | None | Generate, Filter | 🟡 Needs items |
| More | Blur Root | None | Settings gear | 🟡 Needs items |

---

### Pattern 2: Standard Push Header (Detail/list screens)
**Use for:** Record details, standalone lists, settings sub-pages

```typescript
{
  headerLargeTitle: false,
  headerTransparent: true,
  headerBlurEffect: 'regular',
  headerTitle: () => null,  // Title in ScreenTitleStrip
  headerBackVisible: true,
  headerRight: () => <ContextActions />,
}
```

**Screen assignment audit:**

| Screen | Right Items | Status |
|--------|-------------|--------|
| Incident detail | Edit, Share, More (…) | 🟡 Needs items |
| Dispatch detail | Edit, Status update, More | 🟡 Needs items |
| Daily log detail | Edit, Delete | 🟡 Needs items |
| Case detail | Edit, Add task, More | 🟡 Needs items |
| Personnel detail | Call, Message | 🟡 Needs items |
| Lost & found detail | Edit, Print label | 🟡 Needs items |
| Work order detail | Edit, Update status | 🟡 Needs items |
| Visitor detail | Check out, Edit | 🟡 Needs items |
| Vehicle detail | Edit | 🟡 Needs items |
| Contact detail | Call, Edit | 🟡 Needs items |
| Briefing detail | Acknowledge, Share | 🟡 Needs items |
| All standalone lists | Filter, Sort | 🟡 Needs items |

---

### Pattern 3: Solid/Seamless Header (Forms)
**Use for:** All create/edit screens

```typescript
{
  headerLargeTitle: false,
  headerTransparent: false,
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,  // Seamless blend with form
  headerLeft: () => <CancelButton onPress={handleCancel} />,
  headerRight: () => <SaveButton onPress={handleSave} isLoading={isSaving} />,
  headerTitle: 'New Incident',  // OK to use title here for forms
}
```

**Screen assignment audit:**

| Screen | Title | Left | Right | Status |
|--------|-------|------|-------|--------|
| New incident | "New Incident" | Cancel | Save | 🟡 Needs items |
| Edit incident | "Edit Incident" | Cancel | Save | 🟡 Needs items |
| New dispatch | "New Dispatch" | Cancel | Save | 🟡 Needs items |
| Edit dispatch | "Edit Dispatch" | Cancel | Save | 🟡 Needs items |
| New log entry | "New Entry" | Cancel | Save | 🟡 Needs items |
| Edit log entry | "Edit Entry" | Cancel | Save | 🟡 Needs items |
| New case | "New Case" | Cancel | Save | 🟡 Needs items |
| *All other create/edit* | Module name | Cancel | Save | 🟡 Needs items |

**Missing behavior for all form headers:**
- 🔴 Unsaved changes detection (warn on Cancel)
- 🔴 Save button loading state
- 🔴 Keyboard-aware adjustment (header doesn't move when keyboard shows)
- 🔴 Haptic on successful save

---

### Pattern 4: Transparent (Immersive) Header
**Use for:** Screens with hero media at the top — maps, photos, camera views

```typescript
{
  headerTransparent: true,
  headerStyle: { backgroundColor: 'transparent' },
  headerTintColor: '#FFFFFF',  // White icons over dark content
  // Transition: transparent at top → blur when scrolling
  scrollEdgeEffects: { top: 'automatic' },
  headerLeft: () => <GlassBackButton />,
  headerRight: () => <GlassShareButton />,
}
```

**Screens that should use immersive:**

| Screen | Hero Content | Status |
|--------|-------------|--------|
| Dispatch map view | Full-screen map | 🔴 Screen missing |
| Incident map view | Full-screen map | 🔴 Screen missing |
| Photo preview | Full-screen image | 🔴 Screen missing |
| QR scanner | Camera view | 🔴 Screen missing |
| Analytics chart full-screen | Expanded chart | 🔴 Screen missing |

---

## MISSING: Header Components

### NativeHeaderActionButton
**EZXS-OS Reference:** `NativeHeaderActionButton.tsx`
**Status:** 🔴 Missing

A 44pt touch target header button with SF Symbol icon. Used for all header right/left action buttons.

```typescript
interface NativeHeaderActionButtonProps {
  icon: string;           // SF Symbol name
  onPress: () => void;
  badge?: number;         // Badge count overlay
  destructive?: boolean;  // Red tint for delete actions
  disabled?: boolean;
}
```

**Why 44pt matters:** Apple HIG requires 44×44pt minimum touch targets. Native header buttons that are smaller cause App Store review rejections and accessibility failures.

---

### NativeHeaderActionGroup
**EZXS-OS Reference:** `NativeHeaderActionGroup.tsx`
**Status:** 🔴 Missing

Groups multiple header action buttons with proper spacing. Used when header right has 2–3 buttons.

```typescript
// Usage:
headerRight: () => (
  <NativeHeaderActionGroup>
    <NativeHeaderActionButton icon="magnifyingglass" onPress={onSearch} />
    <NativeHeaderActionButton icon="line.3.horizontal.decrease" onPress={onFilter} />
    <NativeHeaderActionButton icon="plus" onPress={onCreate} />
  </NativeHeaderActionGroup>
)
```

---

### HeaderLeft Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **BackButton** | Standard back chevron | ✅ Native default |
| **CloseButton** | × for dismissing modals | 🟡 Exists in `native-header-items.tsx`, verify styling |
| **CancelButton** | "Cancel" text for forms | 🔴 Missing (text-style button) |
| **OrgLogoButton** | Organization logo in dashboard header | 🔴 Missing |
| **UserAvatarButton** | User avatar with tap → profile | 🔴 Missing |
| **GlassBackButton** | Glass-material back button for immersive headers | 🔴 Missing |

### HeaderRight Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **NotificationBell** | Bell icon with unread count badge | 🔴 Missing |
| **SaveButton** | "Save" or checkmark for forms, with loading state | 🔴 Missing |
| **ShareButton** | Share icon for detail screens | 🔴 Missing |
| **EditButton** | Pencil icon for detail → edit transition | 🔴 Missing |
| **FilterButton** | Funnel icon with active filter count badge | 🔴 Missing |
| **SearchButton** | Magnifying glass to activate search | 🔴 Missing |
| **MoreButton** | Ellipsis (…) for context menu | 🔴 Missing |
| **AddButton** | + icon for create actions | 🔴 Missing |
| **MapToggleButton** | Toggle between list and map views | 🔴 Missing |
| **SettingsGearButton** | Gear icon for settings | 🔴 Missing |

---

## MISSING: Tab Bar Enhancements

### iOS 26 Liquid Glass Tab Bar

The tab bar on iOS 26 should use native liquid glass material automatically via `NativeTabs` from `expo-router`. Verify:

| Feature | Status | Notes |
|---------|--------|-------|
| Liquid glass material | 🟡 Verify | `NativeTabs` should handle this natively |
| SF Symbol tab icons | 🟡 Verify | Defined in `tab-specs.ts`, verify rendering |
| Filled icon for selected tab | 🔴 Missing | Selected: `house.fill`, Unselected: `house` |
| Badge count on tabs | 🔴 Missing | Incidents (active count), notifications (unread) |
| Long-press context menu | 🔴 Missing | Quick actions per tab |
| Tab bar haptic | 🔴 Missing | Light haptic on tab switch |
| Scroll-to-top on re-tap | 🔴 Missing | Re-tapping active tab scrolls content to top |
| Tab bar hide on scroll | 🔴 Missing | Optional — hide tab bar when scrolling down, show on scroll up |

### SF Symbol Mapping (Verify in `tab-specs.ts`)

| Tab | Unselected Symbol | Selected Symbol | Status |
|-----|-------------------|-----------------|--------|
| Dashboard | `square.grid.2x2` | `square.grid.2x2.fill` | 🟡 Verify |
| Daily Log | `note.text` | `note.text.fill` | 🟡 Verify |
| Incidents | `exclamationmark.triangle` | `exclamationmark.triangle.fill` | 🟡 Verify |
| Dispatch | `antenna.radiowaves.left.and.right` | `antenna.radiowaves.left.and.right.fill` | 🟡 Verify |
| Personnel | `person.2` | `person.2.fill` | 🟡 Verify |
| Analytics | `chart.bar` | `chart.bar.fill` | 🟡 Verify |
| Reports | `doc.text` | `doc.text.fill` | 🟡 Verify |
| More | `ellipsis.circle` | `ellipsis.circle.fill` | 🟡 Verify |

---

## MISSING: ScreenTitleStrip Usage

`ScreenTitleStrip` exists in `src/components/ui/glass/ScreenTitleStrip.tsx`. Every tab root and standalone list must use it.

### Pattern

```typescript
// In every list screen:
<ScreenTitleStrip
  title="Incidents"
  subtitle="12 active"
  rightAction={<FilterChips ... />}
/>
```

**Screens needing ScreenTitleStrip implementation:**

| Screen | Title | Subtitle | Right Content | Status |
|--------|-------|----------|---------------|--------|
| Dashboard | "Dashboard" | Org name | Date | 🔴 Not using |
| Daily Log | "Daily Log" | Shift name | Category chips | 🔴 Not using |
| Incidents | "Incidents" | "{n} active" | Status chips | 🔴 Not using |
| Dispatch | "Dispatch" | "{n} active" | Priority chips | 🔴 Not using |
| Personnel | "Personnel" | "{n} on duty" | Role chips | 🔴 Not using |
| Analytics | "Analytics" | Date range | Time range picker | 🔴 Not using |
| Reports | "Reports" | None | Report type filter | 🔴 Not using |
| More | "More" | User name | None | 🔴 Not using |
| All standalone lists | Module name | Count | Filter chips | 🔴 Not using |
| All detail screens | Record title | Record # or status | None | 🔴 Not using |

---

## MISSING: Toolbar / Bottom Bar Patterns

### Contextual Bottom Toolbar

Some screens need a bottom toolbar (above the tab bar) for contextual actions.

| Screen | Toolbar Content | Status |
|--------|----------------|--------|
| Incident detail | "Update Status" button + "Add Note" button | 🔴 |
| Dispatch detail | Status stepper (Created → Dispatched → En Route → On Scene → Resolved) | 🔴 |
| Case detail | "Add Task" + "Add Evidence" buttons | 🔴 |
| Any list with selection | "Delete ({n})" + "Archive ({n})" bulk actions | 🔴 |

### Form Bottom Bar (GlassCTA)

Create/edit screens need a sticky bottom bar with the primary action button.

```typescript
<GlassCTA
  label="Save Incident"
  onPress={handleSave}
  isLoading={isSaving}
  disabled={!isValid}
/>
```

**Status:** 🔴 `GlassCTA` component not yet built for EZTrack

---

## MISSING: Status Bar Handling

| Scenario | Status Bar Style | Status |
|----------|-----------------|--------|
| Light mode screens | Dark content (`.darkContent`) | 🔴 Not configured |
| Dark mode screens | Light content (`.lightContent`) | 🔴 Not configured |
| Immersive/map screens | Light content (white over dark background) | 🔴 Not configured |
| Modal overlays | Inherit from presenting screen | 🔴 Not configured |
| During transitions | Smooth transition between styles | 🔴 Not configured |

---

## MISSING: Search Header Integration

`useIOSNativeSearchHeader.ts` exists but needs to be wired into screens.

| Screen | Search Scope | Status |
|--------|-------------|--------|
| Incidents list | Search title, description, participant names | 🔴 Not wired |
| Dispatch list | Search description, unit, code | 🔴 Not wired |
| Daily Log list | Search entry text, author | 🔴 Not wired |
| Personnel list | Search name, role, badge number | 🔴 Not wired |
| Cases list | Search case number, title, officer | 🔴 Not wired |
| All standalone lists | Module-specific search | 🔴 Not wired |
| More tab | Search module names for quick navigation | 🔴 Not wired |

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Header Components (2–3 days)
1. Build `NativeHeaderActionButton` and `NativeHeaderActionGroup`
2. Build header-left components (CancelButton, OrgLogoButton, UserAvatarButton)
3. Build header-right components (NotificationBell, SaveButton, FilterButton, AddButton, MoreButton)
4. Apply blur root header to all 8 tab roots

### Phase 2: ScreenTitleStrip Rollout (1–2 days)
1. Add ScreenTitleStrip to all tab root screens with correct titles/subtitles
2. Add ScreenTitleStrip to all standalone list screens
3. Add ScreenTitleStrip to all detail screens

### Phase 3: Tab Bar Polish (1–2 days)
1. Verify liquid glass rendering on iOS 26
2. Add badge counts (incidents, notifications)
3. Add tab switch haptics
4. Implement scroll-to-top on re-tap
5. Verify SF Symbol selected/unselected states

### Phase 4: Form Headers (1 day)
1. Apply solid/seamless pattern to all create/edit screens
2. Wire Cancel + Save buttons with loading/disabled states
3. Add unsaved changes warning on Cancel

### Phase 5: Bottom Toolbars (2 days)
1. Build `GlassCTA` for forms
2. Build contextual bottom toolbar for detail screens
3. Build bulk action toolbar for list multi-select

### Phase 6: Search & Status Bar (1–2 days)
1. Wire native search header to all list screens
2. Configure status bar styles per screen type
3. Test transitions between status bar styles

**Total estimated: 8–12 days**
