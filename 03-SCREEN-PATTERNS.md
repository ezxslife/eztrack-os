# Phase 3 — Screen Patterns & Layouts

> Port EZXS-OS's screen scaffolds, scroll patterns, keyboard handling, and state management to EZTrack.

---

## 1. The Universal Screen Structure

Every screen in EZXS-OS follows the same bones:

```
View (flex: 1, backgroundColor: colors.background)
└── ScrollView (or FlatList)
    ├── refreshControl: GlassRefreshControl
    ├── contentContainerStyle:
    │   ├── paddingTop: topInset + 8  (for transparent headers)
    │   └── paddingBottom: 100        (for tab bar clearance)
    ├── showsVerticalScrollIndicator: false
    ├── automaticallyAdjustContentInsets: false
    └── [screen content]
```

**There is no card container.** The page background IS the surface. Content goes directly on it with horizontal padding.

---

## 2. Screen Types & Their Patterns

### 2a. Tab Root Screen (Home, Dashboard, Discover)

```typescript
export default function HomeScreen() {
  const colors = useThemeColors()
  const topInset = useBlurHeaderInset()
  const [refreshing, setRefreshing] = useState(false)

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        refreshControl={
          <GlassRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingTop: topInset + 8,
          paddingBottom: 100,  // tab bar + safe area
        }}
      >
        {/* Section headers + content */}
        <SectionHeader title="Upcoming Events" action={{ label: 'See All', onPress }} />
        <EventsTimelineSection />
        
        <SectionHeader title="Organizations" />
        <OrganizationRail />
      </ScrollView>
      
      <RefreshProgressStrip topOffset={topInset} />
    </View>
  )
}
```

**Key traits:**
- `paddingTop: topInset + 8` — content starts below transparent header
- `paddingBottom: 100` — clears tab bar (52px) + safe area + breathing room
- `GlassRefreshControl` — branded pull-to-refresh (not native spinner)
- `RefreshProgressStrip` — animated progress bar below header
- No horizontal padding on root — sections manage their own

### 2b. List Screen (Tickets, Orders)

```typescript
export default function TicketsScreen() {
  const colors = useThemeColors()
  const topInset = useBlurHeaderInset()

  return (
    <View style={{ flex: 1, paddingTop: topInset, backgroundColor: colors.background }}>
      <SegmentedControl
        segments={['Upcoming', 'Past']}
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
        style={{ marginHorizontal: 16, marginBottom: 8 }}
      />
      
      <FlatList
        data={tickets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FullBleedTicketCard ticket={item} />}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        refreshControl={<GlassRefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<EmptyState registryKey="tickets" tier="screen" />}
      />
    </View>
  )
}
```

**Key traits:**
- `paddingTop: topInset` on root View (not in scroll content)
- `FlatList` instead of ScrollView for virtualized lists
- `GlassSegmentedControl` for tab switching
- `EmptyState` component for empty lists
- `contentContainerStyle.paddingBottom: 100` still applies

### 2c. Settings/Form Screen

```typescript
export default function AccountScreen() {
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: Math.max(insets.bottom + 110, 128),
      }}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader title="BASIC INFO" />
      <GroupedCard>
        <SettingsListRow label="Name" value={user.name} onPress={editName} />
        <GroupedCardDivider />
        <SettingsListRow label="Email" value={user.email} onPress={editEmail} />
        <GroupedCardDivider />
        <SettingsListRow label="Phone" value={user.phone} onPress={editPhone} />
      </GroupedCard>

      <SectionHeader title="PREFERENCES" />
      <GroupedCard>
        <SettingsListRow label="Appearance" trailing={<GlassChip label="System" />} onPress={goAppearance} />
        <GroupedCardDivider />
        <SettingsListRow label="Notifications" onPress={goNotifications} />
      </GroupedCard>
    </ScrollView>
  )
}
```

**Key traits:**
- `paddingHorizontal: 16` on entire scroll content
- `GroupedCard` wraps related rows (iOS Settings pattern)
- `GroupedCardDivider` between rows inside a card
- `SettingsListRow` for each row (44px min-height, 58px with subtitle)
- `SectionHeader` uses uppercase 13px/600 text
- `keyboardShouldPersistTaps="handled"` for form inputs
- Bottom padding: `Math.max(insets.bottom + 110, 128)` — generous clearance

### 2d. Organizer Screen (Scaffold Pattern)

```typescript
export default function DashboardScreen() {
  return (
    <OrganizerScreenScaffold scroll headerInset gutter="standard">
      <MetricsGrid />
      <RecentActivity />
      <QuickActions />
    </OrganizerScreenScaffold>
  )
}
```

The `OrganizerScreenScaffold` component abstracts the common wrapper:

```typescript
interface OrganizerScreenScaffoldProps {
  scroll?: boolean         // ScrollView vs static View
  headerInset?: boolean    // Add topInset padding for transparent header
  gutter?: 'standard' | 'compact' | 'none'  // 16px / 12px / 0px horizontal padding
  children: ReactNode
}
```

### 2e. Wizard/Form Flow Screen

```typescript
export default function EventCreateScreen() {
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form fields */}
      </ScrollView>

      {/* Sticky footer pinned to bottom */}
      <StickyActionBar
        primaryLabel="Next"
        primaryOnPress={handleNext}
        secondaryLabel="Cancel"
        secondaryOnPress={handleCancel}
      />
    </KeyboardAvoidingView>
  )
}
```

---

## 3. Padding & Spacing Constants

| Context | Horizontal | Top | Bottom |
|---------|-----------|-----|--------|
| Tab root screen | `0` (sections manage own) | `topInset + 8` | `100px` |
| List screen | `0` (FlatList manages) | `topInset` (on root View) | `100px` |
| Settings screen | `16px` | Default (solid header, no inset needed) | `max(insets.bottom + 110, 128)` |
| Organizer screen | `16px` (standard) / `12px` (compact) | `topInset + 16` | `100px` |
| Wizard/form | `16px` | Default | `StickyActionBar` height + safe area |
| Section gap | — | `18px` between sections | — |
| Group header | `16px horizontal` | `28px top, 8px bottom` | — |

---

## 4. Safe Area Handling

### The Hook

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const insets = useSafeAreaInsets()
// insets.top — status bar (47px on modern iPhones)
// insets.bottom — home indicator (34px on modern iPhones)
```

### Rules

1. **Top inset:** Handled by `useBlurHeaderInset()` for transparent headers. Solid headers handle it automatically via native navigation.

2. **Bottom inset:** Applied manually to scroll content bottom padding and sticky action bars:
   ```typescript
   paddingBottom: Math.max(insets.bottom, 16)  // at least 16px
   ```

3. **Never use `SafeAreaView`** as a wrapper. Use `useSafeAreaInsets()` hook for manual padding. SafeAreaView doesn't compose well with transparent headers and keyboard avoidance.

---

## 5. Keyboard Handling

### Pattern

```typescript
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  // Android handles keyboard avoidance natively via windowSoftInputMode
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* inputs */}
  </ScrollView>
</KeyboardAvoidingView>
```

### Bottom Sheet Keyboards

For inputs inside bottom sheets, use `BottomSheetTextInput` from gorhom (not regular `TextInput`):

```typescript
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'

// Sheet config
keyboardBehavior="interactive"      // sheet moves with keyboard
keyboardBlurBehavior="restore"      // sheet restores position when keyboard hides
```

---

## 6. State Handling Components

### Empty State

Registry-based empty states for consistent messaging:

```typescript
<EmptyState
  registryKey="tickets"        // looks up title, message, icon from registry
  tier="screen"                // 'screen' = full page, 'section' = within page, 'inline' = compact
  action={{ label: 'Browse Events', onPress: goDiscover }}
/>
```

**Tiers:**
- `screen` — centered on page, large icon, title + message + action button
- `section` — smaller, within a section, icon + message + optional action
- `inline` — minimal, just text, within a list or card

### Loading State (Skeletons)

```typescript
if (isLoading) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  )
}
```

Skeleton variants: `FullBleedTicketSkeleton`, `SkeletonMetricCard`, etc. Match the shape of the real content.

### Error State

Type-based errors with appropriate messaging and retry:

```typescript
<ErrorState
  type="network"              // 'network' | 'timeout' | '404' | '403' | '500' | '429' | 'auth' | 'payment' | 'scan'
  onRetry={refetch}
/>
```

**Types map to specific illustrations, titles, and descriptions.** The `onRetry` prop adds a "Try Again" button.

---

## 7. Sticky Action Bar

For screens with primary actions (forms, wizards, checkouts):

```typescript
// src/components/ui/StickyActionBar.tsx

<StickyActionBar
  primaryLabel="Save"
  primaryOnPress={handleSave}
  primaryDisabled={!isValid}
  secondaryLabel="Cancel"
  secondaryOnPress={handleCancel}
/>
```

### Styling

| Property | Value |
|----------|-------|
| Position | `absolute`, bottom: 0, left: 0, right: 0 |
| Padding top | `12px` |
| Padding horizontal | `16px` |
| Padding bottom | `Math.max(insets.bottom, 16)` |
| Background | `colors.background` with top border or subtle shadow |
| Primary button | `GlassPill variant="filled" size="lg"` |
| Secondary button | `GlassPill variant="outline" size="lg"` |

---

## 8. Pull-to-Refresh

EZXS-OS replaces the native `RefreshControl` with a branded version:

```typescript
<ScrollView
  refreshControl={
    <GlassRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  }
>
```

Plus a `RefreshProgressStrip` positioned below the header for visual feedback:

```typescript
<RefreshProgressStrip topOffset={topInset} />
```

This strip shows an animated butterfly + shimmer bar during refresh.

---

## 9. EZTrack Adaptation Checklist

- [ ] Adopt the universal screen structure: `View(flex:1) → ScrollView` with no card containers
- [ ] Create `OrganizerScreenScaffold` (or equivalent) for admin screens
- [ ] Use `useBlurHeaderInset()` for top padding on all transparent-header screens
- [ ] Set `paddingBottom: 100` on all tab screen scroll content
- [ ] Set `paddingBottom: max(insets.bottom + 110, 128)` on all settings screens
- [ ] Use `FlatList` for all list screens (virtualized)
- [ ] Use `KeyboardAvoidingView` wrapping all form screens
- [ ] Use `keyboardShouldPersistTaps="handled"` on all ScrollViews with inputs
- [ ] Port `EmptyState` component with registry pattern
- [ ] Port `ErrorState` component with type-based messaging
- [ ] Port skeleton loading components matching real content shapes
- [ ] Port `StickyActionBar` for form/wizard screens
- [ ] Port `GlassRefreshControl` for branded pull-to-refresh
- [ ] Remove all card-container screen wrappers
- [ ] Set `showsVerticalScrollIndicator={false}` on all scroll views
- [ ] Set `automaticallyAdjustContentInsets={false}` on all scroll views
