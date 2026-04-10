# Phase 5: Core Modules — Daily Log, Incidents, Dispatch

> **Goal:** Build the three most critical operational modules. These are the heart of EZTrack — used constantly during live events by field staff, dispatchers, and supervisors.
> **Duration:** 5–7 days
> **Prerequisites:** Phase 1–4 complete (foundation, theme, auth, navigation)
> **Priority:** This is the most important phase. Get these right and the app is immediately useful.

---

## 5.1 Shared Module Patterns

Every module follows the same screen architecture. Define it once, apply everywhere.

### Screen Types per Module

| Screen | Route Pattern | Presentation | Header |
|--------|--------------|--------------|--------|
| List | `(tabs)/[module]/index.tsx` | Tab root | Blur tab header |
| Detail | `(detail)/[module]/[id].tsx` | Card push | Seamless header |
| Create | `(create)/[module].tsx` | Full-screen modal | Seamless + Cancel/Save |
| Edit | `(create)/[module].tsx?id=X` | Full-screen modal | Seamless + Cancel/Save |

### List Screen Pattern

```
┌──────────────────────────────┐
│  [Native Blur Header]        │  ← Glass/blur, minimal
│                              │
│  Daily Log                   │  ← ScreenTitleStrip (large title)
│  132 entries                 │  ← Subtitle with count
│                              │
│  [Search] [Filter] [Sort]    │  ← FilterBar component
│                              │
│  ┌─────────────────────────┐ │
│  │ DL-0042  High Priority  │ │  ← DataCard (FlatList item)
│  │ Stage 3 – Medical...    │ │
│  │ 10:42 AM  John D.       │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ DL-0041  Medium         │ │
│  │ Gate A – Crowd issue... │ │
│  │ 10:38 AM  Sarah K.      │ │
│  └─────────────────────────┘ │
│                              │
│              [+]             │  ← GlassFAB (create new)
└──────────────────────────────┘
```

### DataCard Component

```typescript
// src/components/data/DataCard.tsx
interface DataCardProps {
  recordNumber: string;
  title: string;
  subtitle?: string;
  status: UniversalStatus;
  priority?: string;
  timestamp: string;
  assignee?: string;
  onPress: () => void;
}
```

### FilterBar Component

```typescript
// src/components/data/FilterBar.tsx
interface FilterBarProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
  filters: FilterConfig[];      // Status, priority, location dropdowns
  activeFilters: FilterState;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
}
```

### Filter Store (shared across modules)

```typescript
// src/stores/filterStore.ts
import { create } from "zustand";
import type { FilterState } from "@eztrack/shared";

interface FilterStoreState {
  filters: Record<string, FilterState>;  // keyed by module name
  setFilter: (module: string, key: keyof FilterState, value: any) => void;
  clearFilters: (module: string) => void;
}
```

---

## 5.2 Daily Log Module

The most-used module. Field staff create log entries throughout shifts — quick, rapid entry.

### Screens

**List Screen: `app/(tabs)/daily-log/index.tsx`**

- FlatList of daily log entries, newest first
- Filter by: status (open/pending/high_prio/closed), priority, date range
- Search by topic or synopsis
- Pull-to-refresh
- FAB → create new entry
- Tap row → push to detail

**Detail Screen: `app/(detail)/daily-log/[id].tsx`**

- Full log entry with all fields
- Status badge, priority badge
- Location display
- Synopsis text
- Creator info + timestamp
- Action buttons: Edit, Change Status, Escalate to Incident

**Create Screen: `app/(create)/daily-log.tsx`**

- Form fields:
  - Topic (text input, required)
  - Location (select from org locations tree)
  - Synopsis (multiline textarea, required)
  - Priority (segmented control: low/medium/high)
  - Status (defaults to "open")
- Validation: `DailyLogSchema` from `@eztrack/shared`
- On submit: Supabase insert + haptic success + navigate back
- Offline: Queue action if no network

### Data Flow

```
useCreateDailyLog() mutation
  → validate with DailyLogSchema (Zod)
  → supabase.rpc("next_record_number", { p_prefix: "DL" })
  → supabase.from("daily_logs").insert(...)
  → invalidate queryKey: ["daily-logs", "list", orgId]
  → haptic: success notification
  → router.back()
```

### Quick Entry Optimization

Daily log is the "quick note" of the app. Optimize for speed:
- Pre-select most recent location
- Auto-set priority to "medium"
- Large touch targets for all inputs
- Keyboard auto-focus on "Topic" field
- Submit with single tap (no confirmation dialog)

---

## 5.3 Incidents Module

The critical safety module. Full lifecycle management with narratives, participants, and financial tracking.

### Screens

**List Screen: `app/(tabs)/incidents/index.tsx`**

- FlatList with incident cards showing: record number, type, severity, status, location, time
- Color-coded severity indicator (critical=red, high=orange, medium=yellow, low=blue)
- Filter by: type (16 incident types), severity, status, date range
- Search by record number, synopsis
- Real-time updates via Supabase subscription
- Badge on tab showing open incident count

**Detail Screen: `app/(detail)/incidents/[id].tsx`**

Tabbed detail view (horizontal ScrollView tabs):

| Tab | Content |
|-----|---------|
| Overview | Type, severity, status, location, synopsis, reported by, created by, timestamps |
| Narrative | Chronological narrative entries (text log) — each with author + timestamp |
| Participants | Involved persons: name, role (witness/victim/suspect), contact info |
| Financials | Savings & losses: type, amount, description |
| Media | Photos, documents attached to incident |
| Activity | Audit trail of all changes |

Action buttons (role-gated):
- Edit (Staff+)
- Change Status (Dispatcher+)
- Add Narrative (Staff+)
- Add Participant (Staff+)
- Attach Media (Staff+ — opens camera or photo picker)
- Assign (Dispatcher+)

**Create Screen: `app/(create)/incident.tsx`**

Multi-step wizard (3 steps):

1. **Type & Severity**
   - Incident type (select from 16 options)
   - Severity (segmented: low/medium/high/critical)
   - Location (select from location tree)

2. **Details**
   - Synopsis (multiline, required, max 10000 chars)
   - Reported by (text input, optional)

3. **Review & Submit**
   - Summary card showing all entered data
   - Submit button with confirmation

Validation: `IncidentSchema` from `@eztrack/shared`

### Real-time Updates

```typescript
// In incidents list screen:
useRealtimeSubscription({
  table: "incidents",
  filter: `org_id=eq.${orgId}`,
  onInsert: (record) => {
    queryClient.invalidateQueries({ queryKey: incidentKeys.list(orgId) });
    // Show toast: "New incident: INC-0043"
  },
  onUpdate: (record) => {
    queryClient.invalidateQueries({ queryKey: incidentKeys.list(orgId) });
    queryClient.invalidateQueries({ queryKey: incidentKeys.detail(record.id) });
  },
});
```

---

## 5.4 Dispatch Module

The real-time operations center. Dispatchers manage the active dispatch board, assign officers, and track responses.

### Screens

**Board Screen: `app/(tabs)/dispatch/index.tsx`**

The dispatch board is **not a standard list**. It's a live operations view:

```
┌──────────────────────────────┐
│  [Native Blur Header]        │
│                              │
│  Dispatch Board              │
│  4 active · 2 pending        │
│                              │
│  ┌─ ACTIVE ──────────────┐   │
│  │ C3 — Emergency         │   │  ← Red border (critical)
│  │ Stage 2 · Medical      │   │
│  │ 🟢 Officer: Jane D.    │   │
│  │ On scene · 3m ago      │   │
│  └────────────────────────┘   │
│  ┌─ ACTIVE ──────────────┐   │
│  │ C2 — Urgent            │   │  ← Orange border (high)
│  │ Gate B · Security       │   │
│  │ 🔵 Officer: Mike R.    │   │
│  │ Dispatched · 5m ago    │   │
│  └────────────────────────┘   │
│                              │
│  ─── PENDING (2) ─────────   │
│  ┌────────────────────────┐   │
│  │ C1 — Routine           │   │
│  │ Parking Lot A · Check   │   │
│  │ Unassigned · 8m ago    │   │
│  └────────────────────────┘   │
│                              │
│        [+ New Dispatch]       │
└──────────────────────────────┘
```

**Sections:**
- Active dispatches (assigned, in progress, on scene) — sorted by priority
- Pending dispatches (unassigned) — sorted by age
- Cleared dispatches (collapsed, tap to expand)

**Real-time:** This screen is 100% live. Every change to the dispatch table triggers a re-render.

**Detail Screen: `app/(detail)/dispatch/[id].tsx`**

- Dispatch code, priority, status
- Location
- Description
- Assigned officer (with status badge)
- Timeline: created → dispatched → on scene → cleared
- Actions: Assign, Reassign, Clear, Escalate to Incident

**Create Screen: `app/(create)/dispatch.tsx`**

- Dispatch code (select from DISPATCH_CODES constant)
- Location (select)
- Description (text)
- Priority (auto-set from dispatch code, can override)
- Assign officer (optional — select from available personnel)

### Officer Status Cards

Show available officers below the dispatch board:

```
┌─── Available Officers ───────┐
│ 🟢 Jane D.    Available      │
│ 🟡 Mike R.    On Break       │
│ 🔵 Sam T.     Dispatched     │
│ ⚫ Alex P.    Off Duty       │
└──────────────────────────────┘
```

### Dispatch Actions (Bottom Sheet)

When tapping a dispatch card, show a GlassSheet with actions:

```
┌──────────────────────────────┐
│ Dispatch C3-0012             │
│ ─────────────────────────    │
│ 👤 Assign Officer            │
│ ✓  Mark On Scene             │
│ ✓  Clear Dispatch            │
│ ⚠️ Escalate to Incident      │
│ ✏️ Edit Details               │
│ ─────────────────────────    │
│ Cancel                       │
└──────────────────────────────┘
```

---

## 5.5 Shared Components for Core Modules

### LocationPicker

Bottom sheet with nested location tree:
```
Property: Magnetic World Music Festival
├── Gate A
├── Gate B
├── Stage 1
│   ├── Front of House
│   ├── Backstage
│   └── Sound Booth
├── Stage 2
├── VIP Area
├── Medical Tent
└── Parking Lot A
```

### StatusChangeSheet

Bottom sheet for changing record status with optional note:
```
┌──────────────────────────────┐
│ Change Status                │
│                              │
│ Current: Open                │
│                              │
│ ○ Assigned                   │
│ ● In Progress  ←            │
│ ○ Follow Up                  │
│ ○ Completed                  │
│ ○ Closed                     │
│                              │
│ Note (optional):             │
│ ┌──────────────────────────┐ │
│ │ Officer arrived on scene │ │
│ └──────────────────────────┘ │
│                              │
│ [Update Status]              │
└──────────────────────────────┘
```

### PersonnelPicker

Select from available staff with status indicators:
- Show name, role, current status
- Filter by: available only, role
- Search by name

---

## 5.6 Camera & Media Integration

Incidents need photo capture. Use `expo-camera` and `expo-image-picker`:

```typescript
// src/hooks/useMediaCapture.ts
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { getSupabase } from "@/lib/api/client";

export function useMediaCapture(entityType: string, entityId: string) {
  const capturePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await uploadMedia(uri, entityType, entityId);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      for (const asset of result.assets) {
        await uploadMedia(asset.uri, entityType, entityId);
      }
    }
  };

  return { capturePhoto, pickFromGallery };
}

async function uploadMedia(uri: string, entityType: string, entityId: string) {
  const supabase = getSupabase();
  const fileName = `${entityType}/${entityId}/${Date.now()}.jpg`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, decode(base64), {
      contentType: "image/jpeg",
    });

  if (!error) {
    // Insert media record linking to entity
    await supabase.from("media").insert({
      entity_type: entityType,
      entity_id: entityId,
      file_path: fileName,
      media_type: "image",
    });
  }
}
```

---

## 5.7 Verification Checklist

### Daily Log
- [ ] List loads with real data from Supabase
- [ ] Pull-to-refresh works
- [ ] Filters narrow results (status, priority)
- [ ] Search finds entries by topic/synopsis
- [ ] Create form validates with DailyLogSchema
- [ ] New entry appears at top of list after creation
- [ ] Detail screen shows all fields correctly
- [ ] Status change works with haptic feedback
- [ ] Offline: entry queues when no network

### Incidents
- [ ] List shows severity color coding
- [ ] Tab badge shows open incident count
- [ ] Detail tabs all render (Overview, Narrative, Participants, Financials, Media)
- [ ] Create wizard flows through 3 steps
- [ ] Real-time: new incidents appear without manual refresh
- [ ] Photo capture works from detail screen
- [ ] Role gating: Viewer can't create; Staff can create; Dispatcher can assign

### Dispatch
- [ ] Board shows active/pending sections
- [ ] Cards color-coded by priority
- [ ] Officer status cards show real-time availability
- [ ] Assign officer updates board immediately
- [ ] Clear dispatch moves to cleared section
- [ ] Escalate to incident creates linked incident
- [ ] Real-time: board updates within 2 seconds of changes
- [ ] Action sheet shows correct options per role

---

**Previous:** [← Phase 4 — Navigation Shell](./04-NAVIGATION-SHELL.md)
**Next:** [Phase 6 — Secondary Modules →](./06-SECONDARY-MODULES.md)
