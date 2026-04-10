# Phase 10: Polish, Testing & App Store Release

> **Goal:** Harden the app for production — accessibility, performance optimization, comprehensive testing, and App Store submission.
> **Duration:** 3–4 days
> **Prerequisites:** All previous phases complete

---

## 10.1 Accessibility (WCAG AA + iOS Accessibility)

### Requirements

EZTrack is used by security professionals in high-stress situations. Accessibility isn't optional — it's operational necessity.

**Color Contrast:**
- Body text: 4.5:1 minimum
- Large text (title1+): 3:1 minimum
- Status badges: Already verified in Phase 2 (shared constants have high-contrast text/bg pairs)
- Interactive elements: 3:1 against adjacent colors

**Touch Targets:**
- All tappable elements: minimum 44x44 points (iOS HIG standard)
- Already enforced via `controlHeights.xl = 44`
- Buttons, list rows, action items all must meet this

**Screen Reader:**
- Every interactive element needs `accessibilityLabel`
- Status badges: "Status: In Progress" not just "In Progress"
- Priority badges: "Priority: Critical" with `accessibilityRole="text"`
- Charts: provide text summary alternative
- Dispatch board: announce card content when focused

**Dynamic Type:**
- Typography system uses `fontSize` values that respect iOS Dynamic Type when combined with `allowFontScaling: true` (default)
- Test with accessibility settings → larger text sizes
- Ensure layouts don't break at 200% text size

**Reduce Motion:**
- All animations gated on `useReducedMotion()` hook
- When reduced motion is on, skip entering/exiting animations
- Haptic feedback still works (separate from visual motion)

### Implementation Checklist

```typescript
// Example: StatusBadge with full accessibility
<View
  accessible
  accessibilityRole="text"
  accessibilityLabel={`Status: ${displayLabel}`}
  style={[styles.badge, { backgroundColor: style.bg }]}
>
  <Text style={{ color: style.text }}>{displayLabel}</Text>
</View>

// Example: Dispatch card with full context
<Pressable
  accessible
  accessibilityRole="button"
  accessibilityLabel={`Dispatch ${recordNumber}. ${dispatchCode}. Priority: ${priority}. Status: ${status}. Location: ${location}. ${assignedTo ? `Assigned to ${assignedTo}` : 'Unassigned'}`}
  accessibilityHint="Double tap to view dispatch details"
  onPress={onPress}
>
```

---

## 10.2 Performance Optimization

### FlatList Optimization

Every list screen must follow these patterns:

```typescript
<FlatList
  data={filteredItems}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  // Performance props:
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index,
    index,
  })}
  // Pull to refresh:
  refreshControl={
    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
  }
/>
```

### Image Optimization

- Use `expo-image` (not React Native `Image`) for caching and progressive loading
- Resize images before upload: max 1200px width, 0.8 quality
- Implement thumbnail generation for list views

### Bundle Size

- Tree-shake `lucide-react-native` — import individual icons, not the whole library
- Lazy load heavy screens (analytics charts, report generation)
- Use `React.lazy()` + `Suspense` for chart library

### Memory Management

- Unsubscribe realtime channels on screen blur (not just unmount)
- Clear stale React Query cache: `gcTime: 30 * 60 * 1000`
- Limit offline queue to 100 actions (prevent unbounded growth)

### Startup Performance

- Measure with `expo-dev-tools` → Performance tab
- Target: < 2 seconds cold start to interactive
- Splash screen stays until `_hasHydrated` and first data loads
- Defer non-critical subscriptions until after first render

---

## 10.3 Testing Strategy

### Unit Tests (Vitest)

Test shared logic that doesn't depend on React Native:

```
packages/shared/
├── __tests__/
│   ├── validation.test.ts     # All Zod schemas validate correctly
│   ├── enums.test.ts          # Enum values match expected strings
│   └── constants.test.ts      # Status/priority colors all defined
```

### Component Tests (React Native Testing Library)

```
apps/mobile/src/__tests__/
├── components/
│   ├── StatusBadge.test.tsx   # Renders all 10 statuses correctly
│   ├── PriorityBadge.test.tsx # Renders all 4 priorities
│   ├── DataCard.test.tsx      # Displays all fields
│   └── FilterBar.test.tsx     # Filter interactions work
├── hooks/
│   ├── useRoleGate.test.ts    # Role hierarchy correct
│   └── useFormState.test.ts   # Validation flows correct
└── stores/
    ├── authStore.test.ts      # FSM transitions valid
    └── uiStore.test.ts        # Color scheme persistence
```

### Integration Tests

Test full flows end-to-end with mocked Supabase:

```
apps/mobile/src/__tests__/flows/
├── auth.test.tsx              # Login → dashboard → sign out
├── createIncident.test.tsx    # Form → validate → submit → list update
├── dispatchAssign.test.tsx    # Board → assign → status change
└── offlineSync.test.tsx       # Queue action → reconnect → sync
```

### Manual Testing Matrix

| Feature | iPhone 16 Pro (iOS 26) | iPhone 13 (iOS 18) | iPad Air | Android Pixel |
|---------|----------------------|--------------------|---------|--------------|
| Glass components | Liquid glass | Blur fallback | Blur fallback | Opaque |
| Tab bar | NativeTabs | NativeTabs | NativeTabs | Custom Tabs |
| Headers | Scroll-edge glass | System blur | System blur | Solid |
| Haptics | ✓ | ✓ | ✓ | ✓ |
| Dark mode | ✓ | ✓ | ✓ | ✓ |
| Push notifications | ✓ | ✓ | ✓ | ✓ |
| Offline mode | ✓ | ✓ | ✓ | ✓ |
| Camera/photos | ✓ | ✓ | ✓ | ✓ |

### Edge Cases to Test

- Network timeout during form submission
- App killed during offline queue flush
- Token refresh failure → recovery
- Two devices updating same record simultaneously
- Very long text in synopsis fields
- 100+ items in a list (pagination/performance)
- Back navigation from deep link
- Rotation to landscape (should stay portrait or handle gracefully)

---

## 10.4 Error Handling & Crash Reporting

### Global Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to crash reporting service
    reportCrash(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <Button title="Try Again" onPress={() => this.setState({ hasError: false })} />
        </View>
      );
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// Consistent error handling across all mutations:
onError: (error) => {
  if (error.status === 401) {
    // Session expired — trigger re-auth
    authStore.getState().transitionLifecycle("error");
  } else if (error.status === 403) {
    showToast("You don't have permission for this action", "error");
  } else if (error.status === 409) {
    showToast("This record was modified by someone else. Please refresh.", "warning");
  } else {
    showToast("Something went wrong. Please try again.", "error");
  }
}
```

---

## 10.5 App Store Submission

### Pre-submission Checklist

- [ ] App icon: 1024x1024 (no alpha channel)
- [ ] Launch screen: separate light/dark assets
- [ ] Screenshots: iPhone 6.7" (required), iPhone 6.1", iPad 12.9" (if supporting iPad)
- [ ] App description: highlight key features for event security professionals
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App category: Business or Utilities
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Export compliance: No encryption beyond standard HTTPS (ITSAppUsesNonExemptEncryption = false)

### EAS Submit

```bash
# Build production binary
eas build --profile production --platform ios

# Submit to App Store Connect
eas submit --platform ios --latest
```

### App Store Metadata

```
Name: EZTrack - Event Security
Subtitle: Incident & Dispatch Management
Category: Business
Keywords: event security, incident management, dispatch, event operations,
          safety, guard tour, incident reporting, event management

Description:
EZTrack is a comprehensive event security and incident management platform
designed for live events, festivals, and venues. Replace paper logs and radio
chatter with a real-time digital operations center.

Key Features:
• Real-time dispatch board with officer tracking
• Incident reporting with photos, narratives, and financial tracking
• Daily activity logging with instant priority escalation
• Patron management with flag/ban system
• Case investigation with evidence chain-of-custody
• Push notifications for critical alerts
• Offline-first — works in low-connectivity environments
• Analytics and reporting with PDF export
```

### TestFlight Distribution

Before App Store review:
1. Build preview: `eas build --profile preview --platform ios`
2. Upload to TestFlight
3. Internal testing (team)
4. External beta testing (select clients)
5. Fix critical feedback
6. Submit for App Store review

---

## 10.6 Post-Launch

### Monitoring

- Crash reporting: Sentry or Bugsnag integration
- Analytics: Track screen views, feature usage, error rates
- Performance: Monitor API response times, app startup time
- User feedback: In-app feedback mechanism

### Update Strategy

- OTA updates via EAS Update for JS-only changes
- Native builds for SDK upgrades or new native modules
- Version pinning: minimum supported version enforced via API

### Feature Flags (Future)

Consider adding feature flags for gradual rollout:
```typescript
const features = {
  OFFLINE_SYNC: true,
  PUSH_NOTIFICATIONS: true,
  ANALYTICS_CHARTS: true,
  WALL_DISPLAY_MODE: false,  // Future
  BIOMETRIC_AUTH: false,     // Future
};
```

---

## 10.7 Final Verification Checklist

### Functionality
- [ ] All 16 modules functional with CRUD operations
- [ ] Real-time updates working across all critical screens
- [ ] Push notifications delivered for all configured triggers
- [ ] Offline mode works for critical operations
- [ ] Deep links navigate to correct screens
- [ ] Role-based access enforced (7 roles × all screens)

### Quality
- [ ] No TypeScript errors: `npx tsc --noEmit` passes
- [ ] No console errors in release build
- [ ] All unit tests passing
- [ ] Manual testing matrix complete (4 device targets)
- [ ] Performance: < 2s cold start, < 100ms list scrolling
- [ ] Memory: no leaks after 30min continuous use

### Design
- [ ] iOS 26 liquid glass renders on supported devices
- [ ] Blur fallback on iOS 18–25
- [ ] Opaque fallback on Android
- [ ] Dark/light mode both polished
- [ ] All status/priority colors match web app
- [ ] Typography follows iOS HIG scale
- [ ] Haptic feedback on all primary actions

### Release
- [ ] App icon and launch screen assets ready
- [ ] App Store screenshots captured
- [ ] Privacy policy and terms published
- [ ] TestFlight beta tested by internal team
- [ ] EAS production build succeeds
- [ ] App Store submission accepted

---

**Previous:** [← Phase 9 — Real-time, Notifications & Offline](./09-REALTIME-NOTIFICATIONS-OFFLINE.md)
**Back to Index:** [00-INDEX.md](./00-INDEX.md)
