# Phase 6: Secondary Modules — Cases, Patrons, Personnel, Lost & Found

> **Goal:** Build the four secondary operational modules that support investigations, person tracking, staff management, and property recovery.
> **Duration:** 4–5 days
> **Prerequisites:** Phase 5 complete (core modules establish the shared patterns)

---

## 6.1 Cases Module

Investigation case management with evidence chain-of-custody and task tracking.

### Screens

**List:** `app/(detail)/cases/index.tsx` (accessed from More menu)
- Cases sorted by status then date
- Filter by: status (open/on_hold/closed/archived), case type
- Show: record number, type, status, lead investigator, created date

**Detail:** `app/(detail)/cases/[id].tsx`

Tabbed view:

| Tab | Content |
|-----|---------|
| Overview | Case type, status, synopsis, lead investigator, linked incidents |
| Tasks | Checklist of investigation tasks with assignees and due dates |
| Evidence | Chain-of-custody log: item description, custodian, transfer history |
| Narratives | Investigation notes chronologically |
| Activity | Audit trail |

**Create:** `app/(create)/case.tsx`
- Case type (select)
- Synopsis (textarea)
- Lead investigator (personnel picker)
- Link to incident (optional — incident picker)
- Priority

### Evidence Chain-of-Custody

Critical for legal proceedings. Every evidence item tracks:
- Description, category, storage location
- Current custodian
- Transfer log: from → to, timestamp, reason, signature acknowledgment
- Photos of evidence

```
┌─ Evidence Item ──────────────┐
│ EVD-001: iPhone 14 Pro       │
│ Category: Personal Property   │
│ Status: In Custody            │
│ Custodian: Det. Smith         │
│                              │
│ Transfer History:             │
│ ├ Found by: Officer Jane D.  │
│ │  → 10:42 AM, Stage 2      │
│ ├ Transferred to: Evidence   │
│ │  → 11:15 AM, Det. Smith   │
│ └ Current holder             │
└──────────────────────────────┘
```

---

## 6.2 Patrons Module

Person-of-interest database with flag/ban management and encounter history.

### Screens

**List:** Searchable patron directory
- Search by name, phone, email
- Filter by flag (none/watch/banned/vip/warning)
- Color-coded flag indicators:
  - 🟢 None (gray)
  - 🟡 Watch (yellow)
  - 🔴 Banned (red)
  - ⭐ VIP (blue)
  - ⚠️ Warning (orange)

**Detail:** `app/(detail)/patrons/[id].tsx`
- Photo (large, tappable)
- Name, contact info
- Flag badge (prominent)
- Notes
- Linked incidents
- Encounter history (visits, incidents involving this person)
- Action: Change flag, Edit, Link to incident

**Create:** `app/(create)/patron.tsx`
- First name, last name (required)
- Email, phone (optional)
- Flag (segmented control)
- Photo (camera capture or gallery)
- Notes (textarea)

### Quick Flag Change

From the list view, long-press a patron to show a quick-action sheet:

```
┌──────────────────────────────┐
│ John Smith                   │
│ ─────────────────────────    │
│ ○ No Flag                    │
│ ○ Watch                      │
│ ● Banned  ←                 │
│ ○ VIP                        │
│ ○ Warning                    │
│ ─────────────────────────    │
│ Reason (required for ban):   │
│ ┌──────────────────────────┐ │
│ │ Aggressive behavior near │ │
│ │ Stage 1 on 4/6           │ │
│ └──────────────────────────┘ │
│ [Update Flag]                │
└──────────────────────────────┘
```

---

## 6.3 Personnel Module

Staff roster with real-time status tracking and availability management.

### Screens

**List:** `app/(tabs)/personnel/index.tsx` (tab for Managers) or More menu
- Group by status: Available, On Break, Dispatched, On Scene, Off Duty
- Show: avatar, name, role, status badge, current zone
- Filter by: role, status, zone
- Search by name

**Detail:** `app/(detail)/personnel/[id].tsx`
- Avatar (large)
- Full name, role, email, phone
- Current status (with timestamp of last change)
- Current zone/location assignment
- Shift info
- Recent activity (dispatches handled, incidents involved)
- Action: Change status, Reassign zone, Contact (call/message)

**Status Board View**

Alternative to list — a real-time grid showing all staff positions:

```
┌─── On Duty (12) ─────────────┐
│ 🟢 Jane D.    Gate A         │
│ 🟢 Mike R.    Stage 1        │
│ 🔵 Sam T.     → Stage 2     │  (dispatched, en route)
│ 🟡 Alex P.    Break Room     │  (on break)
│ ...                          │
├─── Off Duty (5) ─────────────┤
│ ⚫ Tom B.                    │
│ ⚫ Lisa M.                   │
└──────────────────────────────┘
```

### Status Quick-Change

Managers and supervisors can quickly update staff status from the list:

```typescript
// Long-press or swipe action on personnel row
const statusOptions = [
  { value: "available", label: "Available", color: "#10B981" },
  { value: "on_break", label: "On Break", color: "#A855F7" },
  { value: "dispatched", label: "Dispatched", color: "#3B82F6" },
  { value: "on_scene", label: "On Scene", color: "#3B82F6" },
  { value: "off_duty", label: "Off Duty", color: "#6B7280" },
];
```

---

## 6.4 Lost & Found Module

Item intake, auto-matching, claim/release, and disposal workflow.

### Screens

**List:** Split view — Found Items + Lost Reports
- Tabs: "Found Items" | "Lost Reports"
- Filter by: status (stored/pending_return/returned/disposed), category, date
- Search by description

**Detail:** `app/(detail)/lost-found/[id].tsx`
- Photo (if available)
- Description
- Category (electronics, clothing, bags, personal items, etc.)
- Location found
- Found by (officer name)
- Status badge
- If matched: link to lost report or claim
- Timeline: found → stored → claimed/returned/disposed

**Create:** `app/(create)/lost-found.tsx`
- Type: Found Item or Lost Report
- Description (required)
- Category (select)
- Location (where found / where lost)
- Photo (camera capture for found items)
- Contact info (for lost reports)

### Disposal Workflow

Items stored beyond retention period (configurable per org, typically 30 days):

```
┌──────────────────────────────┐
│ ⚠️ Overdue Items (3)         │
│                              │
│ Black iPhone case            │
│ Stored: 32 days              │
│ [Mark Disposed] [Extend]     │
│                              │
│ Blue water bottle            │
│ Stored: 45 days              │
│ [Mark Disposed] [Extend]     │
└──────────────────────────────┘
```

---

## 6.5 Shared Patterns for Secondary Modules

### Linking Between Modules

Many records link to each other. Build a `LinkedRecordCard` component:

```typescript
interface LinkedRecordCardProps {
  type: "incident" | "case" | "patron" | "dispatch";
  recordNumber: string;
  title: string;
  status: UniversalStatus;
  onPress: () => void;  // Navigate to linked record
}
```

### Timeline Component

Several detail screens show chronological events:

```typescript
interface TimelineEntry {
  id: string;
  timestamp: string;
  author: string;
  action: string;      // "Created", "Status changed to In Progress", etc.
  detail?: string;     // Optional note
}

// Renders vertical timeline with dots and connecting lines
function Timeline({ entries }: { entries: TimelineEntry[] }) { ... }
```

### Bulk Actions (Manager+)

From list screens, managers can select multiple records:
- Long-press to enter selection mode
- Checkboxes appear on each card
- Bottom bar shows: "3 selected" + [Change Status] [Assign] [Archive]

---

## 6.6 Verification Checklist

### Cases
- [ ] List loads with status filtering
- [ ] Detail shows all tabs (Overview, Tasks, Evidence, Narratives)
- [ ] Evidence chain-of-custody logs transfers correctly
- [ ] Can link case to existing incident
- [ ] Task checklist toggles work

### Patrons
- [ ] Search finds patrons by name/phone
- [ ] Flag colors render correctly (5 flag types)
- [ ] Quick flag change from long-press works
- [ ] Patron photo capture and display works
- [ ] Encounter history links to related incidents

### Personnel
- [ ] List groups by status correctly
- [ ] Real-time status updates appear within seconds
- [ ] Status quick-change works for Managers+
- [ ] Call/message action opens native dialer/messages
- [ ] Role filter narrows personnel list

### Lost & Found
- [ ] Split tabs: Found Items vs Lost Reports
- [ ] Photo capture for found items
- [ ] Status workflow: stored → pending_return → returned
- [ ] Overdue items surface with disposal options
- [ ] Search finds items by description

---

**Previous:** [← Phase 5 — Core Modules](./05-CORE-MODULES.md)
**Next:** [Phase 7 — Support Modules →](./07-SUPPORT-MODULES.md)
