# Phase 11: Advanced Patterns — Learned from EZXS-OS Production App

> **Goal:** Apply battle-tested production patterns from the EZXS-OS mobile app that were not covered in Phases 1–10. These are the patterns that separate a prototype from a production app.
> **Priority:** Integrate these into the relevant phases during implementation.

---

## 11.1 Coach Marks / First-Use Onboarding Tour

EZXS-OS has a sophisticated `CoachMark` component (487 lines) that creates spotlight tours for new users.

### Why EZTrack Needs This
Field staff arrive at events and need to learn the app fast. A guided tour through the dispatch board, daily log quick-entry, and incident creation saves training time.

### Implementation Pattern

```typescript
// src/components/ui/CoachMark.tsx
interface CoachMarkStep {
  targetRef: React.RefObject<View>;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";  // Auto-adjusts if clipped
}

interface CoachMarkProps {
  steps: CoachMarkStep[];
  onComplete: () => void;
  onSkip: () => void;
  storageKey: string;  // Persisted to MMKV — only show once
}
```

### Key Features (from EZXS-OS):
- **Dynamic target measurement** via `measureInWindow()` — handles scrolled/moved elements
- **Smart positioning** — tries preferred position, falls back if clipped by screen edge
- **Spotlight cutout** with padding around target element
- **Step dots + navigation** (Next, Skip, Back)
- **Blur/dim overlay** around spotlight
- **Haptic on step change**
- **MMKV persistence** — show once per user, reset-able from settings
- **Re-measures target on step change** for moved elements

### Tour Sequences for EZTrack

| Tour | Trigger | Steps |
|------|---------|-------|
| Welcome Tour | First login | Dashboard → Quick Actions → Tab Bar → FAB |
| Dispatch Tour | First visit to Dispatch | Board sections → Create button → Assign flow → Clear flow |
| Incident Tour | First visit to Incidents | List view → Create button → Severity picker → Photo capture |
| Settings Tour | First visit to Settings | Profile → Appearance → Org settings (if admin) |

---

## 11.2 Global Search (Command Palette Equivalent)

The web app has Cmd+K search. Mobile needs a dedicated search experience.

### Implementation

```
┌──────────────────────────────┐
│  🔍 Search EZTrack           │  ← Auto-focused text input
│  [                        ]  │
│                              │
│  ── Recent ─────────────── │
│  INC-0043 Medical Emergency  │
│  DSP-0018 Code 3 Stage 2    │
│  John Smith (Patron)         │
│                              │
│  ── Results ──────────────  │
│  📋 Incidents (3)            │
│    INC-0043 Medical...       │
│    INC-0041 Theft at...      │
│    INC-0039 Disturbance...   │
│  📡 Dispatches (1)           │
│    DSP-0020 Code 2 Gate B    │
│  👤 Patrons (2)              │
│    John Smith ⚠️ Warning     │
│    Jane Doe 🔴 Banned        │
│  👷 Personnel (1)            │
│    Officer Mike R.           │
└──────────────────────────────┘
```

### Data Sources (Parallel Search)

```typescript
async function globalSearch(query: string, orgId: string) {
  const supabase = getSupabase();
  const term = `%${query}%`;

  const [incidents, dispatches, patrons, personnel, dailyLogs] = await Promise.all([
    supabase.from("incidents")
      .select("id, record_number, incident_type, status, synopsis")
      .eq("org_id", orgId).is("deleted_at", null)
      .or(`record_number.ilike.${term},synopsis.ilike.${term},incident_type.ilike.${term}`)
      .limit(5),
    supabase.from("dispatches")
      .select("id, record_number, dispatch_code, status, description")
      .eq("org_id", orgId).is("deleted_at", null)
      .or(`record_number.ilike.${term},description.ilike.${term},dispatch_code.ilike.${term}`)
      .limit(5),
    supabase.from("patrons")
      .select("id, first_name, last_name, flag")
      .eq("org_id", orgId)
      .or(`first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term}`)
      .limit(5),
    supabase.from("profiles")
      .select("id, full_name, role")
      .eq("org_id", orgId)
      .ilike("full_name", term)
      .limit(5),
    supabase.from("daily_logs")
      .select("id, record_number, topic, status")
      .eq("org_id", orgId).is("deleted_at", null)
      .or(`record_number.ilike.${term},topic.ilike.${term}`)
      .limit(5),
  ]);

  return { incidents, dispatches, patrons, personnel, dailyLogs };
}
```

### Recent Search Store

```typescript
// src/stores/recentSearchStore.ts (from EZXS-OS pattern)
const MAX_RECENT = 10;

interface RecentSearchState {
  recentQueries: string[];
  recentResults: Array<{ type: string; id: string; label: string; route: string }>;
  addQuery: (query: string) => void;
  addResult: (result: RecentResult) => void;
  clear: () => void;
}
```

---

## 11.3 QR Code Scanner for Check-In

EZTrack handles event entry with ticket scanning. EZXS-OS has a production-grade scanner with offline-first support.

### Scanner Architecture

```typescript
// src/components/scanner/CheckInScanner.tsx
interface ScannerProps {
  eventId: string;
  onScanSuccess: (ticket: TicketInfo) => void;
  onScanError: (error: ScanError) => void;
  mode: "check-in" | "validate-only";
}
```

### Offline Check-In (from EZXS-OS checkInStore)

```typescript
// Pre-cache guest list before going to venue
async function prefetchGuestList(eventId: string) {
  const guests = await fetchAllTicketsForEvent(eventId);
  checkInStore.getState().setCachedGuests(eventId, guests);
}

// Scan offline — validate against cached list
function offlineScan(ticketId: string, eventId: string): ScanResult {
  const guests = checkInStore.getState().cachedGuests[eventId];
  const ticket = guests?.find(g => g.ticketId === ticketId);

  if (!ticket) return { status: "invalid", message: "Ticket not found" };
  if (ticket.checkedIn) return { status: "duplicate", message: "Already checked in" };

  // Queue for server sync
  checkInStore.getState().addToOfflineQueue({
    ticketId,
    eventId,
    scannedAt: new Date().toISOString(),
    synced: false,
  });

  return { status: "success", ticket };
}
```

### Scanner Settings (from EZXS-OS scannerSettingsStore)

Per-event scanner configuration:
- `scanBehavior`: check-in, validate-only, check-out
- `autoCheckIn`: auto-confirm without manual tap
- `rapidScanMode`: minimize delay between scans
- Haptic + sound feedback per scan result

---

## 11.4 Skeleton Loading Pattern

EZXS-OS uses `useDataWithSkeletonRecovery` — a sophisticated loading state manager.

### Pattern

```typescript
// src/hooks/useDataWithSkeletonRecovery.ts
function useDataWithSkeletonRecovery<T>(query: UseQueryResult<T>) {
  const [showSkeleton, setShowSkeleton] = useState(true);

  // States: loading → ready | error | recovering
  // On error + retry: show skeleton again (800ms minimum)
  // On refetch (pull-to-refresh): silent (no skeleton)
  // On first load: skeleton until data arrives

  return {
    data: query.data,
    showSkeleton,
    isError: query.isError,
    retry: () => { setShowSkeleton(true); query.refetch(); },
    refresh: () => query.refetch(),  // Silent refresh
  };
}
```

### Skeleton Components

Build module-specific skeletons:

```typescript
// src/components/skeletons/
IncidentCardSkeleton    // Matches incident DataCard layout
DispatchCardSkeleton    // Matches dispatch board card
DailyLogCardSkeleton    // Matches daily log row
KpiCardSkeleton         // Dashboard KPI card
DetailSkeleton          // Full-page detail view placeholder
```

Each skeleton uses a shimmer animation (Reanimated `withRepeat` + `withTiming`).

---

## 11.5 Map Integration for Dispatches

Live dispatch map showing officer positions and active incidents.

### Implementation

```typescript
// Using react-native-maps
import MapView, { Marker, Callout } from "react-native-maps";

function DispatchMap({ dispatches, officers }: DispatchMapProps) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={eventVenueRegion}
      showsUserLocation
    >
      {/* Active dispatch markers */}
      {dispatches.map(d => (
        <Marker
          key={d.id}
          coordinate={d.location.coordinates}
          pinColor={getPriorityColor(d.priority)}
        >
          <Callout>
            <Text>{d.record_number} — {d.dispatch_code}</Text>
            <Text>{d.status}</Text>
          </Callout>
        </Marker>
      ))}

      {/* Officer position markers */}
      {officers.map(o => (
        <Marker key={o.id} coordinate={o.lastKnownLocation}>
          <View style={styles.officerMarker}>
            <Avatar size="sm" name={o.full_name} />
          </View>
        </Marker>
      ))}
    </MapView>
  );
}
```

### Requirements
- Venue map with predefined zones/gates
- Officer GPS tracking (with permission)
- Incident pins color-coded by severity
- Dispatch pins color-coded by priority
- Tap marker → navigate to record detail

---

## 11.6 Biometric Authentication

Face ID / Touch ID for app unlock and sensitive operations.

### Implementation

```typescript
import * as LocalAuthentication from "expo-local-authentication";

async function authenticateWithBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to access EZTrack",
    cancelLabel: "Use Password",
    disableDeviceFallback: false,
  });

  return result.success;
}
```

### Use Cases
- App unlock after background (configurable timeout: 1min, 5min, 15min, never)
- Sensitive operations: delete patron, change role, access evidence chain
- Settings change confirmation

### Store Integration

```typescript
// In uiStore:
biometricLockEnabled: boolean;
biometricTimeout: number;  // minutes
lastAuthenticatedAt: number | null;  // timestamp

function shouldRequireBiometric(): boolean {
  if (!state.biometricLockEnabled) return false;
  if (!state.lastAuthenticatedAt) return true;
  const elapsed = Date.now() - state.lastAuthenticatedAt;
  return elapsed > state.biometricTimeout * 60 * 1000;
}
```

---

## 11.7 Advanced Error Recovery

EZXS-OS has a sophisticated auth recovery system. EZTrack needs similar resilience.

### Session Recovery Gate

```typescript
// src/lib/auth/sessionRecovery.ts
const CRITICAL_AUTH_FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 60_000;

interface AuthRecoveryState {
  failureCount: number;
  windowStart: number;
  isRecovering: boolean;
}

function handleAuthFailure(error: ApiError): "retry" | "logout" | "ignore" {
  if (error.status !== 401) return "ignore";

  const state = getRecoveryState();
  state.failureCount++;

  if (state.failureCount >= CRITICAL_AUTH_FAILURE_THRESHOLD) {
    // Too many 401s in window — force logout
    authStore.getState().clearAuth();
    return "logout";
  }

  // Try token refresh
  return "retry";
}
```

### API Error Toast Policy

```typescript
// Different screens need different error handling:
type ErrorToastPolicy = "default" | "silent" | "critical-only";

// Dashboard: show all errors (user needs to know)
// Background refresh: silent (don't interrupt)
// Form submission: always show (user is waiting)
```

### Conflict Resolution (409 Handling)

```typescript
// When two devices update the same record:
if (error.status === 409) {
  showToast(
    "This record was updated by someone else. Refreshing...",
    "warning"
  );
  queryClient.invalidateQueries({ queryKey: [module, "detail", id] });
  // Re-fetch latest version
}
```

---

## 11.8 Swipe Actions on List Items

EZXS-OS and iOS native apps use swipe gestures for quick actions.

### Implementation with react-native-gesture-handler

```typescript
import { Swipeable } from "react-native-gesture-handler";

function SwipeableDataCard({ item, onStatusChange, onDelete }) {
  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <Pressable style={[styles.action, { backgroundColor: colors.warning }]}
        onPress={() => onStatusChange(item.id)}>
        <Text>Status</Text>
      </Pressable>
      <Pressable style={[styles.action, { backgroundColor: colors.error }]}
        onPress={() => onDelete(item.id)}>
        <Text>Delete</Text>
      </Pressable>
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.leftActions}>
      <Pressable style={[styles.action, { backgroundColor: colors.success }]}
        onPress={() => onAssign(item.id)}>
        <Text>Assign</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
    >
      <DataCard {...item} />
    </Swipeable>
  );
}
```

### Module-Specific Swipe Actions

| Module | Swipe Left | Swipe Right |
|--------|-----------|-------------|
| Daily Log | Change Status | — |
| Incidents | Change Status | Assign |
| Dispatch | Clear | Assign Officer |
| Personnel | Change Status | — |
| Work Orders | Change Status | Assign |
| Lost & Found | Mark Returned | — |
| Visitors | Sign Out | — |

---

## 11.9 Haptic Feedback System

EZXS-OS wraps haptics in a safe, preference-gated utility.

### `src/lib/safeHaptics.ts`

```typescript
import * as Haptics from "expo-haptics";
import { uiStore } from "@/stores/uiStore";

function isHapticsEnabled(): boolean {
  return uiStore.getState().sensoryEnabled;
}

export const safeHaptics = {
  // Interactions
  light: () => isHapticsEnabled() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => isHapticsEnabled() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => isHapticsEnabled() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // Outcomes
  success: () => isHapticsEnabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => isHapticsEnabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => isHapticsEnabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  // Selection
  selection: () => isHapticsEnabled() && Haptics.selectionAsync(),
};
```

### When to Use Each Type

| Action | Haptic |
|--------|--------|
| Button press, tab change | `light` |
| Form submit, status change | `medium` |
| Delete confirmation, critical alert | `heavy` |
| Record created successfully | `success` |
| Validation error | `warning` |
| API failure | `error` |
| Picker scroll, segmented control | `selection` |
| Mode switch begin | `medium` |

---

## 11.10 Accessibility Utilities

EZXS-OS has a dedicated accessibility utility module. EZTrack needs one adapted for security ops.

### `src/lib/accessibility/operations.ts`

```typescript
import { AccessibilityInfo, Platform } from "react-native";

// Screen reader detection
export async function isScreenReaderActive(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

// Announce changes to screen readers
export function announce(message: string, assertive = false) {
  AccessibilityInfo.announceForAccessibility(message);
}

// Generate accessible labels for status badges
export function statusLabel(status: string): string {
  return `Status: ${status.replace(/_/g, " ")}`;
}

// Generate accessible labels for priority badges
export function priorityLabel(priority: string): string {
  const levels = { critical: "Critical priority", high: "High priority", medium: "Medium priority", low: "Low priority" };
  return levels[priority] ?? `Priority: ${priority}`;
}

// Announce dispatch board changes
export function announceDispatchUpdate(action: string, recordNumber: string) {
  announce(`Dispatch ${recordNumber} ${action}`);
}

// Heading level enforcement
export function headingProps(level: 1 | 2 | 3) {
  return {
    accessibilityRole: "header" as const,
    accessibilityLevel: level,
  };
}

// Live region for dynamic content
export function liveRegionProps(assertive = false) {
  return {
    accessibilityLiveRegion: (assertive ? "assertive" : "polite") as const,
  };
}
```

---

## 11.11 Home Screen Quick Actions (3D Touch / Haptic Touch)

```typescript
// In app.config.ts:
ios: {
  shortcutItems: [
    {
      type: "new_daily_log",
      title: "New Daily Log",
      subtitle: "Quick entry",
      icon: "compose",
    },
    {
      type: "new_incident",
      title: "Report Incident",
      subtitle: "Create incident report",
      icon: "alarm",
    },
    {
      type: "dispatch_board",
      title: "Dispatch Board",
      subtitle: "View active dispatches",
      icon: "location",
    },
  ],
},
```

Handle in root layout:
```typescript
import * as QuickActions from "expo-quick-actions";

useEffect(() => {
  QuickActions.addListener((action) => {
    switch (action.type) {
      case "new_daily_log": router.push("/(create)/daily-log"); break;
      case "new_incident": router.push("/(create)/incident"); break;
      case "dispatch_board": router.push("/(tabs)/dispatch"); break;
    }
  });
}, []);
```

---

## 11.12 Pull-to-Refresh with Branded Animation

EZXS-OS has a custom `RefreshProgressStrip` with butterfly animation. EZTrack should have branded refresh.

```typescript
// Custom RefreshControl with EZTrack branding
function EZTrackRefreshControl({ refreshing, onRefresh }: Props) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={brand.primary}          // Cyan spinner on iOS
      colors={[brand.primary]}            // Android spinner colors
      progressBackgroundColor={colors.surface}  // Android spinner background
      title={refreshing ? "Updating..." : ""}   // iOS text below spinner
      titleColor={colors.textSecondary}
    />
  );
}
```

---

## 11.13 Keyboard Handling for Forms

```typescript
// src/hooks/useKeyboardAware.ts
import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  return height;
}
```

### Form-Specific Patterns
- Use `KeyboardAvoidingView` with `behavior="padding"` on iOS
- Scroll to focused input on form screens
- Dismiss keyboard on scroll in list screens
- Return key progression: Next → Next → Done (submit)
- Auto-dismiss keyboard on form submit

---

## 11.14 Data Export from Mobile

```typescript
// CSV Export
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

async function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row =>
    Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers, ...rows].join("\n");

  const path = `${FileSystem.documentDirectory}${filename}.csv`;
  await FileSystem.writeAsStringAsync(path, csv);
  await Sharing.shareAsync(path, { mimeType: "text/csv" });
}

// PDF Export (see Phase 8)
// Share sheet integration for all exports
```

---

## 11.15 Performance Monitoring (Dev Only)

From EZXS-OS's `usePerformanceMonitor`:

```typescript
// src/hooks/usePerformanceMonitor.ts (DEV ONLY)

export function useMountTime(screenName: string) {
  if (__DEV__) {
    const start = useRef(Date.now());
    useEffect(() => {
      const elapsed = Date.now() - start.current;
      if (elapsed > 1500) {
        console.warn(`[Perf] ${screenName} mount took ${elapsed}ms (> 1500ms threshold)`);
      }
    }, []);
  }
}

export function useRenderCount(componentName: string) {
  if (__DEV__) {
    const count = useRef(0);
    count.current++;
    if (count.current % 10 === 0) {
      console.log(`[Perf] ${componentName} rendered ${count.current} times`);
    }
  }
}
```

---

**Back to Index:** [00-INDEX.md](./00-INDEX.md)
