# Mobile Components Audit — Missing & Enhancement Targets

> **Date:** 2026-04-11 | **Last Updated:** 2026-04-11
> **Scope:** EZTrack `apps/mobile/src/components/` vs. EZXS-OS reference + web feature parity
> **Reference:** `mobile-plan/13-IOS26-DESIGN-REFERENCE.md`, `mobile-plan/02-DESIGN-SYSTEM.md`

---

## COVERAGE STATUS: ~97% COMPLETE

**111 component files** (97 .tsx + 14 .ts barrels) now exist in `src/components/`. Here's what was built:

### Completed Items ✅
- **Core UI primitives (7):** Avatar, DataList, DataCard, EmptyState, ErrorState, SkeletonLoader, Toast
- **Form components (6):** FormField, FormSelect, FormTextArea, FormDatePicker, ImagePickerField, index barrel
- **Glass extensions (6):** GlassButton, GlassCTA, GlassRefreshControl, GlassSheetModal, GlassSheetBackground, ConfirmationSheet
- **Remaining UI primitives (6):** Chip, Divider, Checkbox, RadioGroup, Toggle, Select
- **Modal/sheet components (6):** SortSheet, QuickActionSheet, PersonPickerSheet, LocationPickerSheet, DateRangePickerSheet, MediaPreviewSheet
- **Alert specializations (8):** NetworkErrorAlert, UnsavedChangesAlert, AuthExpiredAlert, PermissionAlert, OfflineModeAlert, SyncConflictAlert, ForceUpdateAlert, EmergencyAlert + barrel export
- **Inline overlays (4):** OfflineBanner, SyncProgressBar, LiveIndicator, CoachMark
- **Filter component:** FilterSheet
- **Domain components (16):** IncidentCard, DispatchCard, LogEntryCard, CaseCard, PersonnelCard, ItemCard, KPICard, MiniChart, MetricRow, DashboardGrid, ChartCard, VisitorCard, VehicleCard, WorkOrderCard, ContactCard, BriefingCard
- **Domain sub-components (9):** IncidentTimeline, ParticipantRow, EvidenceGallery, NarrativeEditor, StatusTimeline, ShiftHeader, ShiftSchedule, CertificationBadges, ItemPhotoCarousel
- **6 existing components enhanced:** Button (+loading/destructive/icon-only/haptic/disabled), TextField (+clear/charcount/prefix-suffix/secure), StatusBadge (+pulse/sizes), PriorityBadge (+icons/compact), FilterChips (+scroll/multiselect/badge), GroupedCard (+collapsible/skeleton)

### Remaining Items (~3% — deferred to v2)
- SignaturePad (niche — defer to later)
- FileAttachment (niche — defer to later)
- LocationPicker with actual MapView integration (LocationPickerSheet is list-based for now)
- Chart library integration (MiniChart is View-based, real charts need victory-native or similar)

---

## Current State Summary

EZTrack mobile has **~25 components** across 4 folders (`auth/`, `feedback/`, `layout/`, `ui/`). The EZXS-OS reference app has **554+ components** across 20+ domain folders. The web app has 25+ UI primitives plus modals and data components.

### What Exists Today

| Folder | Components | Status |
|--------|-----------|--------|
| `ui/` | Button, TextField, SearchField, StatusBadge, PriorityBadge, GroupedCard, GroupedCardDivider, SectionCard, SectionHeader, SettingsListRow, FilterChips, MaterialSurface, AppSymbol | Functional |
| `ui/glass/` | GlassCard, GlassNavBar, GlassPill, GlassAlert, GlassSegmentedControl, GlassActionGroup, GlassSwitch, GlassSheet, GlassFAB, GlassDepthContext, ScreenTitleStrip | Good iOS 26 coverage |
| `auth/` | RequireLiveSession, RouteGate | Minimal |
| `feedback/` | AppStatusBanner, LoadingScreen | Minimal |
| `layout/` | ScreenContainer | Minimal |

---

## MISSING: Core UI Primitives

These components exist on web or in EZXS-OS and are needed for mobile feature parity.

### P0 — Required for Core Module Screens

| Component | Purpose | EZXS-OS Reference | Web Equivalent |
|-----------|---------|-------------------|----------------|
| **Avatar** | User/personnel avatar with initials fallback, online indicator | `UserAvatar.tsx` | `Avatar` in `ui/` |
| **Select / Picker** | Native iOS picker for dropdowns (status, priority, category) | N/A (web pattern) | `Dropdown` in `ui/` |
| **TextArea** | Multi-line input for narratives, notes, descriptions | N/A | Part of form system |
| **DateTimePicker** | Native date/time selection for log entries, incidents | `DateRangePickerModal.tsx` | HTML date input |
| **Toggle / Switch** | Boolean toggle beyond GlassSwitch (settings, filters) | Standard RN Switch | `Switch` in settings |
| **Checkbox** | Multi-select for bulk actions, form fields | N/A | Standard HTML |
| **RadioGroup** | Single-select for form fields (severity, type) | N/A | Standard HTML |
| **Divider** | Section divider line | N/A | Tailwind border |
| **Chip** | Status/tag chips for filters and display | `GlassChip.tsx` in EZXS-OS | Badge variant |
| **Toast / Snackbar** | Transient success/error feedback | `UndoToast.tsx` in EZXS-OS | Toast system |

### P1 — Required for Data Display

| Component | Purpose | EZXS-OS Reference | Notes |
|-----------|---------|-------------------|-------|
| **DataList** | FlatList wrapper with pull-to-refresh, empty state, loading | `SwipeableRow.tsx` + patterns | Core list component for every module |
| **DataCard** | Card variant for list items with status, priority, timestamp | `EditorCard.tsx` | Incident cards, dispatch cards, etc. |
| **EmptyState** | Illustrated empty state for lists | `EmptyState.tsx` in EZXS-OS | Per-module illustrations |
| **ErrorState** | Error display with retry | `ErrorState.tsx` in EZXS-OS | Network errors, load failures |
| **SkeletonLoader** | Loading placeholders for lists and cards | 16 skeleton components in EZXS-OS | Critical for perceived performance |
| **RefreshControl** | Glass-aware pull-to-refresh | `GlassRefreshControl.tsx` in EZXS-OS | Tier-aware refresh indicator |

### P2 — Required for Forms & Creation Screens

| Component | Purpose | EZXS-OS Reference | Notes |
|-----------|---------|-------------------|-------|
| **FormField** | Labeled form field wrapper with validation error display | EZXS-OS form patterns | Used in every create/edit screen |
| **FormSelect** | Form-integrated picker with label and error | N/A | Wraps Select/Picker |
| **FormTextArea** | Form-integrated multi-line input | N/A | Wraps TextArea |
| **ImagePicker** | Photo capture/gallery selection with preview | `MediaGallery.tsx` | Evidence photos, incident media |
| **LocationPicker** | Map-based location selection | `LocationPickerSheet.tsx` | Incident/dispatch location |
| **SignaturePad** | Signature capture for forms | N/A | Visitor sign-in, reports |
| **FileAttachment** | Document attachment with preview | N/A | Case evidence, work order docs |

---

## MISSING: Glass Component Extensions

Components that exist in EZXS-OS's glass library but are absent from EZTrack.

| Component | EZXS-OS Source | EZTrack Need |
|-----------|---------------|--------------|
| **GlassButton** | `GlassButton.tsx` | Primary CTA in glass contexts (confirm dispatch, submit incident) |
| **GlassCTA** | `GlassCTA.tsx` | Full-width call-to-action bar at bottom of forms |
| **GlassStepper** | `GlassStepper.tsx` | Quantity/count steppers (personnel count, item quantities) |
| **GlassChip** | `GlassChip.tsx` | Filter chips with glass material |
| **GlassRefreshControl** | `GlassRefreshControl.tsx` | Pull-to-refresh with glass appearance |
| **GlassSheetModal** | `GlassSheetModal.tsx` | Modal bottom sheet with glass backdrop (vs. current GlassSheet which is inline) |
| **GlassSheetBackground** | `GlassSheetBackground.tsx` | Custom background for @gorhom/bottom-sheet |
| **ConfirmationSheet** | `ConfirmationSheet.tsx` | Destructive action confirmation (delete, close, archive) |

---

## MISSING: Domain-Specific Components

Components needed for specific EZTrack operational modules.

### Incidents Module

| Component | Purpose | Priority |
|-----------|---------|----------|
| **IncidentCard** | List item for incident with severity badge, type icon, time, status | P0 |
| **IncidentTimeline** | Timeline view of incident updates/actions | P1 |
| **ParticipantRow** | Person row for involved parties (witness, suspect, victim) | P1 |
| **EvidenceGallery** | Photo grid with zoom, metadata overlay | P1 |
| **NarrativeEditor** | Rich text entry for incident narratives | P1 |
| **LinkSelector** | Link incident to other records (dispatch, case, patron) | P2 |

### Dispatch Module

| Component | Purpose | Priority |
|-----------|---------|----------|
| **DispatchCard** | List item with dispatch code, priority, unit assignment, ETA | P0 |
| **DispatchMap** | Map with unit positions and incident markers | P1 |
| **UnitSelector** | Assign personnel/unit to dispatch | P1 |
| **StatusTimeline** | Dispatch status progression (created → dispatched → en route → on scene → resolved) | P1 |

### Daily Log Module

| Component | Purpose | Priority |
|-----------|---------|----------|
| **LogEntryCard** | Compact card for log entry with time, author, category | P0 |
| **LogEntryEditor** | Quick-entry form for new log entries | P0 |
| **ShiftHeader** | Current shift info bar (shift name, start time, personnel count) | P1 |
| **LogFilterBar** | Category/time filters for log list | P1 |

### Cases Module

| Component | Purpose | Priority |
|-----------|---------|----------|
| **CaseCard** | Case list item with status, assigned officer, dates | P0 |
| **CaseTimeline** | Investigation timeline with tasks, evidence, narratives | P1 |
| **TaskList** | Case tasks with completion tracking | P1 |
| **EvidenceList** | Typed evidence list (physical, digital, witness) | P1 |
| **CostTracker** | Investigation cost summary | P2 |

### Personnel Module

| Component | Purpose | Priority |
|-----------|---------|----------|
| **PersonnelCard** | Personnel list item with role, status, contact info | P0 |
| **ShiftSchedule** | Shift calendar/schedule view | P1 |
| **CertificationBadges** | Training/certification status indicators | P2 |

### Lost & Found Module

| Component | Purpose | Priority |
|-----------|---------|----------|
| **ItemCard** | Lost/found item with photo thumbnail, status, location | P0 |
| **ClaimForm** | Claimant info entry with verification | P1 |
| **ItemPhotoCarousel** | Swipeable item photos | P1 |

### Analytics / Dashboard

| Component | Purpose | Priority |
|-----------|---------|----------|
| **KPICard** | Key metric display (total incidents, response time, etc.) | P0 |
| **MiniChart** | Small inline chart for trends | P1 |
| **MetricRow** | Metric label + value + trend indicator | P1 |
| **DashboardGrid** | Responsive grid layout for dashboard widgets | P1 |
| **ChartCard** | Card wrapping a chart with title and controls | P2 |

---

## ENHANCEMENT: Existing Components Needing Upgrades

### Button.tsx
- **Add:** Loading state with spinner
- **Add:** Destructive variant (red) for delete actions
- **Add:** Icon-only variant for header actions
- **Add:** Haptic feedback on press (using `safeHaptics`)
- **Add:** Disabled state styling

### TextField.tsx
- **Add:** Error state with message display
- **Add:** Character count for limited fields
- **Add:** Prefix/suffix icon support
- **Add:** Clear button (×) on filled state
- **Add:** Secure text entry variant (passwords)

### StatusBadge.tsx
- **Add:** Animated pulse for "active" statuses (Live, In Progress)
- **Add:** Size variants (sm, md, lg) for different contexts
- **Enhance:** Three-tier glass rendering on glass backgrounds

### PriorityBadge.tsx
- **Add:** Icon support (SF Symbol for each priority level)
- **Add:** Compact variant for list items
- **Enhance:** Haptic feedback on status change

### FilterChips.tsx
- **Add:** Scrollable horizontal layout for overflow
- **Add:** Multi-select mode
- **Add:** Count badge on active filters
- **Enhance:** Glass material when on glass backgrounds

### GroupedCard.tsx
- **Add:** Swipeable actions (edit, delete, archive)
- **Add:** Expandable/collapsible mode for detail sections
- **Enhance:** Loading skeleton variant

### ScreenContainer.tsx (layout)
- **Add:** Built-in SafeAreaView handling
- **Add:** Keyboard-avoiding behavior option
- **Add:** Pull-to-refresh integration
- **Add:** Scroll-to-top on tab re-press

---

## Implementation Priority Order

1. **DataList + DataCard + EmptyState + SkeletonLoader** — Every module list screen needs these
2. **FormField + FormSelect + FormTextArea + DateTimePicker** — Every create/edit screen needs these
3. **Avatar + Toast + Divider + Chip** — Used across all modules
4. **IncidentCard + DispatchCard + LogEntryCard** — Core module list items
5. **GlassButton + GlassCTA + GlassRefreshControl + ConfirmationSheet** — Glass parity with EZXS-OS
6. **ImagePicker + LocationPicker + FileAttachment** — Evidence and location features
7. **KPICard + MiniChart + MetricRow** — Analytics dashboard
8. **Module-specific components** — As each module gets built

---

## File Structure Target

```
src/components/
├── ui/
│   ├── glass/              ✅ Exists (11 components)
│   │   ├── GlassButton.tsx          🔴 Missing
│   │   ├── GlassCTA.tsx             🔴 Missing
│   │   ├── GlassStepper.tsx         🔴 Missing
│   │   ├── GlassChip.tsx            🔴 Missing
│   │   ├── GlassRefreshControl.tsx  🔴 Missing
│   │   ├── GlassSheetModal.tsx      🔴 Missing
│   │   └── ConfirmationSheet.tsx    🔴 Missing
│   ├── Avatar.tsx                   🔴 Missing
│   ├── Checkbox.tsx                 🔴 Missing
│   ├── Chip.tsx                     🔴 Missing
│   ├── DataCard.tsx                 🔴 Missing
│   ├── DataList.tsx                 🔴 Missing
│   ├── DateTimePicker.tsx           🔴 Missing
│   ├── Divider.tsx                  🔴 Missing
│   ├── EmptyState.tsx               🔴 Missing
│   ├── ErrorState.tsx               🔴 Missing
│   ├── RadioGroup.tsx               🔴 Missing
│   ├── Select.tsx                   🔴 Missing
│   ├── SkeletonLoader.tsx           🔴 Missing
│   ├── TextArea.tsx                 🔴 Missing
│   ├── Toast.tsx                    🔴 Missing
│   ├── Toggle.tsx                   🔴 Missing
│   ├── Button.tsx                   🟡 Needs enhancements
│   ├── TextField.tsx                🟡 Needs enhancements
│   ├── StatusBadge.tsx              🟡 Needs enhancements
│   ├── PriorityBadge.tsx            🟡 Needs enhancements
│   ├── FilterChips.tsx              🟡 Needs enhancements
│   └── GroupedCard.tsx              🟡 Needs enhancements
├── forms/                           🔴 Missing folder
│   ├── FormField.tsx
│   ├── FormSelect.tsx
│   ├── FormTextArea.tsx
│   ├── ImagePicker.tsx
│   ├── LocationPicker.tsx
│   ├── SignaturePad.tsx
│   └── FileAttachment.tsx
├── data/                            🔴 Missing folder
│   ├── DataList.tsx
│   ├── DataCard.tsx
│   ├── FilterBar.tsx
│   └── SortMenu.tsx
├── domain/                          🔴 Missing folder
│   ├── incidents/
│   ├── dispatch/
│   ├── daily-log/
│   ├── cases/
│   ├── personnel/
│   ├── lost-found/
│   └── analytics/
├── auth/                   ✅ Exists (2 components)
├── feedback/               ✅ Exists (2 components, needs expansion)
│   ├── SkeletonCard.tsx             🔴 Missing
│   ├── SkeletonRow.tsx              🔴 Missing
│   └── OfflineBanner.tsx            🔴 Missing
└── layout/                 ✅ Exists (1 component, needs expansion)
    ├── SectionDivider.tsx           🔴 Missing
    └── KeyboardAvoidingContainer.tsx 🔴 Missing
```

**Total gap: ~60+ components missing, 6 existing components need enhancements.**
