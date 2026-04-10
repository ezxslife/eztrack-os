# Phase 7: Support Modules — Visitors, Vehicles, Contacts, Work Orders, Briefings

> **Goal:** Build the five supporting modules that round out EZTrack's operational capability. These are used less frequently than core/secondary modules but are essential for complete event operations.
> **Duration:** 4–5 days
> **Prerequisites:** Phase 5–6 complete (shared patterns established)

---

## 7.1 Visitors Module

Pre-registration, sign-in/out tracking, NDA management, and badge printing.

### Screens

**List:** Visitor log with real-time sign-in/out status
- Tabs: "Expected Today" | "On Site" | "Signed Out"
- Show: name, purpose (VIP/vendor/contractor/media/performer), host, status
- Filter by: purpose, status, date
- Search by name

**Detail:** `app/(detail)/visitors/[id].tsx`
- Visitor info: name, company, email, phone
- Purpose badge (color-coded by type)
- Host (staff member who invited)
- Sign-in/out timestamps
- NDA status (signed/not signed)
- Badge number
- Vehicle info (if registered)
- Visit history (previous visits)

**Create:** Sign-in flow

```
Step 1: Visitor Info
  - Name, company, phone, email
  - Purpose (select: VIP, Vendor, Contractor, Media, Performer, Guest)
  - Host (personnel picker)

Step 2: Credentials
  - NDA acknowledgment (checkbox + digital signature)
  - Badge number assignment
  - Vehicle (optional: plate, make, model)

Step 3: Confirmation
  - Summary card
  - Photo capture (visitor badge photo)
  - [Complete Sign-In]
```

### Quick Actions

- **Sign In**: From expected list, tap → pre-filled form → confirm
- **Sign Out**: From on-site list, swipe or tap → timestamp recorded → haptic confirmation
- **Emergency Roster**: Button to view all currently on-site visitors (for evacuation)

---

## 7.2 Vehicles Module

Vehicle registry with plate lookups, owner linking, and incident association.

### Screens

**List:** Vehicle registry
- Show: plate number, make/model, color, status, linked owner
- Filter by: status, type
- Search by plate number or owner name

**Detail:** `app/(detail)/vehicles/[id].tsx`
- Plate number (large, prominent)
- Make, model, year, color
- Owner (linked patron or visitor)
- Status (active/flagged/towed)
- Photo
- Linked incidents
- Location last seen
- Notes

**Create:** `app/(create)/vehicle.tsx`
- Plate number (text input, auto-uppercase)
- Make, model, year, color
- Owner (patron picker, optional)
- Photo (camera capture)
- Notes

### Plate Lookup Flow

Quick plate check from dispatch or incident screens:

```
┌──────────────────────────────┐
│ 🔍 Plate Lookup              │
│                              │
│ [ABC 1234          ] [Search]│
│                              │
│ ── Result ──                 │
│ 2022 Toyota Camry (Silver)   │
│ Owner: John Smith ⚠️ Warning │
│ Linked: INC-0023, INC-0041   │
│                              │
│ [View Full Record]           │
└──────────────────────────────┘
```

---

## 7.3 Contacts Module

External contacts directory — vendors, law enforcement, medical services, fire department.

### Screens

**List:** Contacts directory grouped by category
- Sections: Law Enforcement, Medical, Fire, Vendors, Management, Other
- Show: name, organization, role, phone
- Search by name or organization
- Tap phone number → native call sheet

**Detail:** `app/(detail)/contacts/[id].tsx`
- Name, organization, title/role
- Phone (tappable → call)
- Email (tappable → compose)
- Address
- Category
- Notes
- Action buttons: Call, Message, Email

**Create:** `app/(create)/contact.tsx`
- Name, organization, title
- Category (select)
- Phone, email, address
- Notes

### Quick Contact Actions

From the list, each row has a phone icon that directly initiates a call:

```typescript
import { Linking } from "react-native";

function callContact(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

function messageContact(phone: string) {
  Linking.openURL(`sms:${phone}`);
}

function emailContact(email: string) {
  Linking.openURL(`mailto:${email}`);
}
```

---

## 7.4 Work Orders Module

Maintenance request tracking, assignment, scheduling, and cost tracking.

### Screens

**List:** Work orders with priority and status
- Show: record number, title, priority, status, assigned to, due date
- Filter by: status, priority, category, assigned to
- Sort by: priority (default), due date, created date
- Overdue indicator for past-due orders

**Detail:** `app/(detail)/work-orders/[id].tsx`
- Title, description
- Category (plumbing, electrical, structural, cleanup, etc.)
- Priority badge + status badge
- Location
- Assigned to (personnel)
- Due date
- Cost estimate / actual cost
- Photos (before/after)
- Notes/updates timeline
- Actions: Assign, Update Status, Add Note, Attach Photo

**Create:** `app/(create)/work-order.tsx`
- Title (required)
- Description (textarea)
- Category (select)
- Priority (segmented)
- Location (picker)
- Assign to (personnel picker, optional)
- Due date (date picker)
- Cost estimate (currency input, optional)

### Work Order Status Flow

```
Open → Assigned → In Progress → Completed → Closed
              ↘ On Hold ↗
```

Each transition requires a note explaining the change.

---

## 7.5 Briefings Module

Shift handoffs, announcements, and acknowledgment tracking.

### Screens

**List:** Briefings sorted by date
- Show: title, priority, created by, date, acknowledgment status
- Unacknowledged briefings highlighted with accent color
- Filter by: priority, date range

**Detail:** `app/(detail)/briefings/[id].tsx`
- Title (headline typography)
- Content (rich text body — rendered as markdown or plain text)
- Priority badge
- Created by + timestamp
- Acknowledgment status:
  - "Read by 8 of 12 staff" with progress bar
  - List of readers with timestamps
  - Unread staff listed
- Action: Acknowledge (for current user)

**Create:** (Manager+ only) `app/(create)/briefing.tsx`
- Title (required)
- Content (multiline textarea)
- Priority (segmented: low/medium/high)
- Target audience (all staff, specific roles, specific zones)

### Acknowledgment Flow

When a staff member opens a briefing they haven't acknowledged:

```
┌──────────────────────────────┐
│ Shift Briefing — April 7     │
│                              │
│ Key points for tonight:      │
│ • VIP section opens at 8pm   │
│ • Extra security at Gate B   │
│ • Medical tent relocated     │
│ • Weather: rain expected 10pm│
│                              │
│ Created by: Mgr. Sarah K.   │
│ 6:00 PM                      │
│                              │
│ ┌──────────────────────────┐ │
│ │  ✓ I've read this        │ │  ← Primary button
│ │    briefing               │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Tapping "I've read this" records acknowledgment with timestamp.

### Unread Briefing Badge

The app should badge the Briefings menu item (and potentially the tab bar) when unread briefings exist.

---

## 7.6 Anonymous Reports (Public Tip Submission)

This is unique — it's a **public-facing** feature. External users submit tips without authentication.

### Implementation

This could be a separate deep link or a minimal standalone screen:

**Route:** `app/anonymous-report.tsx` (accessible without auth)

**Form:**
- Category (security concern, suspicious activity, noise complaint, safety hazard, other)
- Description (textarea, required)
- Location (text description — no org location picker for anonymous users)
- Contact info (optional — phone or email for follow-up)
- Photo (optional camera/gallery)
- Submit → "Thank you" confirmation

**Admin Review:**
In the main app (authenticated), anonymous reports appear in the alerts/notifications feed with a "Review" action.

---

## 7.7 Verification Checklist

### Visitors
- [ ] Expected/On Site/Signed Out tabs filter correctly
- [ ] Sign-in flow creates visit record with timestamp
- [ ] Sign-out records departure time
- [ ] NDA acknowledgment checkbox works
- [ ] Emergency roster shows all on-site visitors

### Vehicles
- [ ] Plate lookup returns matching vehicle
- [ ] Linked owner shows flag status
- [ ] Photo capture for vehicle registration
- [ ] Linked incidents display correctly

### Contacts
- [ ] Grouped by category
- [ ] Tap phone → native call
- [ ] Tap email → compose
- [ ] Search finds by name or organization

### Work Orders
- [ ] Priority sorting works
- [ ] Overdue indicators show for past-due items
- [ ] Status change requires note
- [ ] Before/after photo comparison on detail

### Briefings
- [ ] Unacknowledged briefings highlighted
- [ ] Acknowledge button records with timestamp
- [ ] Progress bar shows read ratio
- [ ] Manager+ can create new briefings

### Anonymous Reports
- [ ] Accessible without authentication
- [ ] Submit creates record in database
- [ ] Admin review flow works
- [ ] Optional photo upload works

---

**Previous:** [← Phase 6 — Secondary Modules](./06-SECONDARY-MODULES.md)
**Next:** [Phase 8 — Analytics, Reports & Settings →](./08-ANALYTICS-REPORTS-SETTINGS.md)
