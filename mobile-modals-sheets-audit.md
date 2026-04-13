# Mobile Modals & Sheets Audit — Missing Overlays & Interactions

> **Date:** 2026-04-11
> **Scope:** Bottom sheets, modal screens, action sheets, alerts, confirmation dialogs
> **Reference:** `mobile-plan/13-IOS26-DESIGN-REFERENCE.md` §13.22, EZXS-OS glass sheet patterns

---

## Current State

EZTrack mobile has basic sheet infrastructure via `@gorhom/bottom-sheet` and glass components:

| Component | Location | Status |
|-----------|----------|--------|
| `GlassSheet` | `src/components/ui/glass/GlassSheet.tsx` | ✅ Inline sheet |
| `GlassAlert` | `src/components/ui/glass/GlassAlert.tsx` | ✅ Alert overlay |
| `GlassActionGroup` | `src/components/ui/glass/GlassActionGroup.tsx` | ✅ Action group |

### What's Missing vs. EZXS-OS

EZXS-OS has a rich sheet/modal system with 6+ sheet types and contextual overlays. EZTrack needs these for operational workflows.

---

## MISSING: Bottom Sheet Types

### 1. GlassSheetModal — Full Modal Bottom Sheet
**EZXS-OS Reference:** `GlassSheetModal.tsx`
**Priority:** P0

A modal bottom sheet that slides up from the bottom with a glass backdrop, dismiss handle, and snap points. Different from `GlassSheet` which is inline.

**Use cases in EZTrack:**
- Filter panel for any list screen
- Quick-add log entry
- Status change picker
- Assign personnel picker
- Location picker

**Implementation spec:**
```typescript
interface GlassSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints: (string | number)[];  // e.g., ['40%', '80%']
  title?: string;
  children: React.ReactNode;
  enableDismissOnBackdropPress?: boolean;
  enablePanDownToClose?: boolean;
}
```

**Three-tier rendering:**
- Glass: `GlassView` background with `expo-glass-effect`
- Blur: `BlurView` with `systemChromeMaterial` tint
- Opaque: Solid `colors.surface` with top border

---

### 2. GlassSheetBackground — Custom Sheet Background
**EZXS-OS Reference:** `GlassSheetBackground.tsx`
**Priority:** P0

Custom background component for `@gorhom/bottom-sheet` that applies glass material.

```typescript
// Usage with @gorhom/bottom-sheet:
<BottomSheetModal
  backgroundComponent={GlassSheetBackground}
  // ...
>
```

---

### 3. ConfirmationSheet — Destructive Action Confirmation
**EZXS-OS Reference:** `ConfirmationSheet.tsx`
**Priority:** P0

Bottom sheet for confirming destructive or important actions. Includes title, description, confirm button (destructive red), and cancel button.

**Use cases:**
- Delete incident / dispatch / case / any record
- Archive record
- Close/resolve incident
- Transfer record to another officer
- End shift
- Clear offline queue
- Revoke access
- Cancel pending dispatch

**Implementation spec:**
```typescript
interface ConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;      // e.g., "Delete Incident"
  confirmVariant: 'destructive' | 'warning' | 'primary';
  isLoading?: boolean;
}
```

---

### 4. FilterSheet — Advanced Filter Panel
**Not in EZXS-OS (new for EZTrack)**
**Priority:** P0

Multi-section filter panel presented as a bottom sheet. Every list screen needs this.

**Sections per module:**

| Module | Filter Sections |
|--------|----------------|
| Incidents | Status, Severity, Type, Date range, Location, Assigned officer |
| Dispatch | Status, Priority, Unit, Date range |
| Daily Log | Category, Shift, Author, Date range |
| Cases | Status, Assigned officer, Date range, Priority |
| Personnel | Role, Status (active/inactive), Certifications |
| Lost & Found | Status (found/claimed/returned), Category, Date range |
| Work Orders | Status, Priority, Assigned to, Location |
| Visitors | Check-in status, Date, Host |

**Implementation spec:**
```typescript
interface FilterSheetProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: T) => void;
  onReset: () => void;
  activeFilterCount: number;
  children: React.ReactNode;  // Filter section components
}
```

---

### 5. SortSheet — Sort Options
**Priority:** P1

Simple bottom sheet with sort options for list screens.

**Common sort options:**
- Date (newest first / oldest first)
- Priority (highest / lowest)
- Status
- Alphabetical (name)
- Recently updated

---

### 6. QuickActionSheet — Contextual Actions
**Priority:** P1

Appears on long-press of a list item or via "..." menu button. Shows contextual actions for a record.

**Per-module actions:**

| Module | Actions |
|--------|---------|
| Incidents | View, Edit, Change status, Assign, Escalate to case, Share, Delete |
| Dispatch | View, Edit, Update status, Reassign, Cancel, Delete |
| Daily Log | View, Edit, Add photo, Delete |
| Cases | View, Edit, Add task, Add evidence, Transfer, Close, Delete |
| Personnel | View, Call, Message, View schedule |
| Lost & Found | View, Edit, Mark as claimed, Print label, Delete |
| Work Orders | View, Edit, Update status, Add note, Delete |

---

### 7. MediaPreviewSheet — Photo/Video Preview
**Priority:** P1

Full-screen or large sheet for previewing media attachments. Supports zoom, swipe between images, and share.

**Features needed:**
- Pinch-to-zoom on images
- Swipe left/right for gallery
- Share button
- Delete button (with confirmation)
- Metadata overlay (date, location, file size)
- Video playback for video attachments

---

### 8. PersonPickerSheet — Personnel/Contact Selector
**Priority:** P1

Bottom sheet with searchable list for selecting a person (personnel, contact, patron).

**Use cases:**
- Assign officer to incident
- Assign unit to dispatch
- Select participant for incident
- Select host for visitor
- Assign work order

**Features:**
- Search field at top
- Recently selected section
- Alphabetical list with section headers
- Avatar + name + role display
- Multi-select mode for team assignments

---

### 9. LocationPickerSheet — Location Selector
**Priority:** P1

Bottom sheet with map and search for selecting a location.

**Features:**
- Map view with pin placement
- Search field for address/place
- "Current Location" button
- Saved locations list (from org settings)
- Zone/area selection within venue

---

### 10. DateRangePickerSheet — Date Range Selection
**Priority:** P1

Bottom sheet for selecting date ranges. Used in filters, analytics, and report generation.

**Presets:**
- Today
- Yesterday
- This week
- Last 7 days
- This month
- Last 30 days
- Custom range (calendar picker)

---

## MISSING: Alert Dialogs

### Beyond GlassAlert — Specialized Alerts

| Alert Type | Purpose | Status |
|------------|---------|--------|
| **NetworkErrorAlert** | Shown when API call fails, with retry button | 🔴 |
| **AuthExpiredAlert** | Session expired, prompt re-login | 🔴 |
| **PermissionAlert** | Camera/location/notification permission request | 🔴 |
| **UnsavedChangesAlert** | Warn before navigating away from unsaved form | 🔴 |
| **OfflineModeAlert** | Notify user they're working offline | 🔴 |
| **SyncConflictAlert** | Two users edited same record, resolve conflict | 🔴 |
| **ForceUpdateAlert** | App version too old, must update | 🔴 |
| **EmergencyAlert** | High-priority alert (red, with haptic) for emergency dispatches | 🔴 |

---

## MISSING: Full-Screen Modal Flows

These are presented as `fullScreenModal` via Expo Router.

### 1. Report Generator Modal
```
Select report type → Configure parameters → Preview → Export/Share
```
**Status:** 🔴

### 2. QR Scanner Modal
```
Camera view → Scan QR → Process result → Navigate to record or action
```
**Use cases:** Visitor check-in, lost & found item lookup, equipment scan
**Status:** 🔴

### 3. Global Search Modal
```
Search field → Live results grouped by module → Tap to navigate
```
**Status:** 🔴

### 4. Photo Capture Modal
```
Camera view → Capture → Review/retake → Add caption → Attach to record
```
**Status:** 🔴

### 5. Shift Handoff Modal
```
Review shift summary → Add handoff notes → Confirm handoff → End shift
```
**Status:** 🔴

---

## MISSING: Toast & Snackbar System

EZXS-OS uses `UndoToast` and a `ToastProvider`. EZTrack needs:

| Toast Type | Trigger | Duration | Action |
|------------|---------|----------|--------|
| **Success** | Record created/updated/deleted | 3s | "View" link |
| **Error** | API failure | 5s | "Retry" button |
| **Undo** | Record deleted/archived | 5s | "Undo" button |
| **Info** | Background sync complete | 3s | None |
| **Offline** | Network lost | Persistent | "Retry" when back |
| **Sync** | Offline queue syncing | Until complete | Progress indicator |

**Implementation needs:**
- `ToastProvider` wrapping app
- `useToast()` hook
- Queue system (max 1 visible, queue remaining)
- Haptic feedback on show
- Swipe-to-dismiss
- Glass material background (tier-aware)

---

## MISSING: Inline Overlays

| Overlay | Purpose | Status |
|---------|---------|--------|
| **CoachMark** | First-time feature hints (tap here to...) | 🔴 |
| **FeatureAnnouncement** | New feature spotlight overlay | 🔴 |
| **OfflineBanner** | Persistent banner when offline | 🔴 |
| **SyncProgressBar** | Progress bar during offline sync | 🔴 |
| **LiveIndicator** | Pulsing dot for real-time data connections | 🔴 |

---

## iOS 26 GLASS REQUIREMENTS FOR ALL SHEETS

Every bottom sheet and modal must follow the three-tier pattern:

### Tier 1: Glass (iOS 26+)
```typescript
backgroundComponent: () => (
  <GlassView glassEffect="regular" style={StyleSheet.absoluteFill} />
)
```

### Tier 2: Blur (iOS 18–25)
```typescript
backgroundComponent: () => (
  <BlurView
    tint="systemChromeMaterial"
    intensity={80}
    style={StyleSheet.absoluteFill}
  />
)
```

### Tier 3: Opaque (Android / older)
```typescript
backgroundComponent: () => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
)
```

### Sheet Handle Styling
- Glass tier: No visible handle (system glass handle)
- Blur tier: Semi-transparent white handle bar
- Opaque tier: Solid gray handle bar with rounded ends

### Backdrop
- Glass/Blur: `rgba(0,0,0,0.3)` dimming
- Opaque: `rgba(0,0,0,0.5)` dimming
- Always dismissible via backdrop tap (except confirmation sheets)

---

## IMPLEMENTATION PRIORITY

| Priority | Components | Effort |
|----------|-----------|--------|
| **P0** | GlassSheetModal, GlassSheetBackground, ConfirmationSheet, FilterSheet | 3–4 days |
| **P0** | Toast system (ToastProvider + useToast + GlassToast) | 2 days |
| **P0** | Alert specializations (NetworkError, AuthExpired, UnsavedChanges) | 1 day |
| **P1** | QuickActionSheet, PersonPickerSheet, DateRangePickerSheet | 3 days |
| **P1** | LocationPickerSheet, MediaPreviewSheet, SortSheet | 3 days |
| **P1** | Full-screen modals (Search, QR Scanner, Photo Capture) | 4 days |
| **P2** | Report Generator, Shift Handoff modal | 3 days |
| **P2** | Coach marks, feature announcements, inline overlays | 2 days |

**Total estimated: ~21 days of modal/sheet work**
