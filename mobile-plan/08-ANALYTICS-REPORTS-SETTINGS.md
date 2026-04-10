# Phase 8: Analytics, Reports & Settings

> **Goal:** Build the analytics dashboards, report generation, and organization settings that give managers and admins operational visibility and configuration control.
> **Duration:** 3–4 days
> **Prerequisites:** Phase 5–7 complete (all data modules feeding analytics)

---

## 8.1 Dashboard (KPI Home Screen)

The dashboard is the first thing users see. It provides an operational snapshot.

### `app/(tabs)/dashboard/index.tsx`

```
┌──────────────────────────────┐
│  [Native Blur Header]        │
│                              │
│  Dashboard                   │
│  Magnetic World Music Fest   │
│                              │
│  ┌────────┐  ┌────────┐     │
│  │   12   │  │  3:42  │     │
│  │ Active │  │  Avg   │     │
│  │Incidents│  │Response│     │
│  └────────┘  └────────┘     │
│  ┌────────┐  ┌────────┐     │
│  │    5   │  │   18   │     │
│  │ Active │  │  Staff │     │
│  │Dispatch│  │On Duty │     │
│  └────────┘  └────────┘     │
│                              │
│  ── Quick Actions ────────   │
│  [+ Daily Log] [+ Incident]  │
│  [+ Dispatch]  [📋 Briefing] │
│                              │
│  ── Recent Activity ──────   │
│  • INC-0043 created (2m ago) │
│  • DL-0132 closed (5m ago)   │
│  • DSP-0018 cleared (8m ago) │
│  • Patron flagged (12m ago)  │
└──────────────────────────────┘
```

### KPI Cards

```typescript
interface KpiCardProps {
  value: string | number;
  label: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;  // "+12% vs yesterday"
  color?: string;       // Accent color for critical KPIs
}
```

### Data Sources

```typescript
// src/lib/api/hooks/useDashboard.ts
export function useDashboard() {
  const orgId = organizationStore((s) => s.currentOrg?.id);

  return useQuery({
    queryKey: ["dashboard", orgId],
    queryFn: async () => {
      const supabase = getSupabase();

      // Parallel fetch all KPIs
      const [incidents, dispatches, personnel, dailyLogs, recentActivity] = await Promise.all([
        supabase.from("incidents").select("id", { count: "exact", head: true })
          .eq("org_id", orgId).in("status", ["open", "assigned", "in_progress"]).is("deleted_at", null),
        supabase.from("dispatches").select("id", { count: "exact", head: true })
          .eq("org_id", orgId).in("status", ["pending", "in_progress", "on_scene"]).is("deleted_at", null),
        supabase.from("staff_status").select("id", { count: "exact", head: true })
          .eq("org_id", orgId).eq("status", "available"),
        supabase.from("daily_logs").select("id", { count: "exact", head: true })
          .eq("org_id", orgId).gte("created_at", todayStart()).is("deleted_at", null),
        supabase.from("activity_log").select("*")
          .eq("org_id", orgId).order("created_at", { ascending: false }).limit(10),
      ]);

      return {
        activeIncidents: incidents.count ?? 0,
        activeDispatches: dispatches.count ?? 0,
        onDutyStaff: personnel.count ?? 0,
        todayLogEntries: dailyLogs.count ?? 0,
        recentActivity: recentActivity.data ?? [],
      };
    },
    refetchInterval: 30_000, // Refresh every 30 seconds
  });
}
```

---

## 8.2 Analytics Screen

### `app/analytics/index.tsx`

Module-level analytics with charts. Since React Native doesn't have native charting, use one of:

**Option A:** `react-native-chart-kit` (lightweight, SVG-based)
**Option B:** `victory-native` (more feature-rich, Reanimated-powered)
**Option C:** Custom SVG components (most control, best performance)

**Recommended:** `victory-native` for production quality.

### Analytics Sections

```
┌──────────────────────────────┐
│  Analytics                   │
│                              │
│  [Incidents] [Dispatch] [All]│  ← Segmented control
│                              │
│  ── Incidents by Type ─────  │
│  ┌──────────────────────────┐│
│  │ ████████████ Injury  (24)││  ← Horizontal bar chart
│  │ █████████ Security   (18)││
│  │ ███████ Theft        (14)││
│  │ █████ Disturbance    (10)││
│  │ ████ Medical          (8)││
│  └──────────────────────────┘│
│                              │
│  ── Status Distribution ───  │
│  ┌──────────────────────────┐│
│  │    [Donut Chart]         ││
│  │  Open: 32%               ││
│  │  In Progress: 28%        ││
│  │  Closed: 40%             ││
│  └──────────────────────────┘│
│                              │
│  ── Trend (7 Days) ────────  │
│  ┌──────────────────────────┐│
│  │  📈 Line chart            ││
│  │  incidents over time      ││
│  └──────────────────────────┘│
│                              │
│  ── Response Time ─────────  │
│  Avg: 3:42  Median: 2:15    │
│  ████████████████░░░░ 78%    │
│  under 5min target           │
└──────────────────────────────┘
```

### Analytics Data Hooks

```typescript
// src/lib/api/hooks/useAnalytics.ts
export function useIncidentAnalytics(orgId: string, dateRange: DateRange) {
  return useQuery({
    queryKey: ["analytics", "incidents", orgId, dateRange],
    queryFn: async () => {
      const supabase = getSupabase();

      const { data } = await supabase
        .from("incidents")
        .select("incident_type, severity, status, created_at")
        .eq("org_id", orgId)
        .gte("created_at", dateRange.from)
        .lte("created_at", dateRange.to)
        .is("deleted_at", null);

      return {
        byType: groupAndCount(data, "incident_type"),
        byStatus: groupAndCount(data, "status"),
        bySeverity: groupAndCount(data, "severity"),
        timeline: groupByDate(data, "created_at"),
        total: data?.length ?? 0,
      };
    },
  });
}
```

---

## 8.3 Reports Screen

### `app/reports/index.tsx`

Generate exportable reports by module with date filtering.

```
┌──────────────────────────────┐
│  Reports                     │
│                              │
│  ── Date Range ────────────  │
│  [Apr 1, 2026] → [Apr 7]    │
│                              │
│  ── Generate Report ───────  │
│  ┌──────────────────────────┐│
│  │ 📋 Incident Summary      ││
│  │ All incidents in range    ││
│  │ [Generate PDF] [CSV]     ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 📋 Dispatch Log          ││
│  │ All dispatches in range   ││
│  │ [Generate PDF] [CSV]     ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 📋 Daily Activity        ││
│  │ Daily log entries         ││
│  │ [Generate PDF] [CSV]     ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 📋 Personnel Report      ││
│  │ Staff hours and activity  ││
│  │ [Generate PDF] [CSV]     ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

### Report Generation

Two approaches:

**Option A: Client-side PDF generation**
- Use `expo-print` to render HTML → PDF
- Build report template in HTML/CSS
- Save to device with `expo-sharing`

**Option B: Server-side generation**
- Supabase Edge Function generates PDF
- Client downloads via signed URL

**Recommended:** Option A for speed; Option B for complex reports.

```typescript
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

async function generateIncidentReport(incidents: Incident[], dateRange: DateRange) {
  const html = buildReportHTML(incidents, dateRange);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Incident Report ${dateRange.from} - ${dateRange.to}`,
  });
}
```

---

## 8.4 Settings Screens

### `app/settings/index.tsx` — Settings Hub

```
┌──────────────────────────────┐
│  Settings                    │
│                              │
│  ── Account ───────────────  │
│  👤 Profile                  │
│  🔐 Change Password          │
│  🌙 Appearance (Dark/Light)  │
│  📳 Haptics                  │
│                              │
│  ── Organization ──────────  │  ← Manager+ only
│  🏢 Organization Info        │
│  📍 Properties & Locations   │
│  👥 Team Members             │
│  🎚️ Roles & Permissions     │
│  📝 Custom Dropdowns         │
│  📋 Form Templates           │
│  🔔 Notification Rules       │
│  🔗 Integrations             │
│                              │
│  ── About ─────────────────  │
│  ℹ️ About EZTrack            │
│  📄 Terms of Service         │
│  🔒 Privacy Policy           │
│                              │
│  [Sign Out]                  │
└──────────────────────────────┘
```

### Profile Screen

```typescript
// app/settings/profile.tsx
- Avatar (tappable to change — camera/gallery picker)
- Full name (editable)
- Email (read-only)
- Phone (editable)
- Role (read-only, displayed as badge)
- Organization (read-only)
- Property assignment (read-only)
```

### Appearance Settings

```typescript
// Inline in settings, not a separate screen
- Theme: [System] [Light] [Dark]  ← Segmented control
- Haptic feedback: [Toggle]
```

### Organization Settings (Admin+ only)

**Locations Management:**
- Tree view of properties → locations → sub-locations
- Add/edit/reorder locations
- Drag-to-reorder (react-native-gesture-handler)

**Team Management:**
- List of team members with roles
- Invite new member (email)
- Change role
- Deactivate member

**Custom Dropdowns:**
- Manage dropdown options for each module
- Add/remove/reorder values
- Used in: incident types, dispatch categories, work order categories, etc.

---

## 8.5 Alerts & Notifications

### Alerts Screen: `app/alerts/index.tsx`

Real-time alerts from the system:

```
┌──────────────────────────────┐
│  Alerts                      │
│                              │
│  🔴 CRITICAL                 │
│  ┌──────────────────────────┐│
│  │ Medical Emergency         ││
│  │ Stage 2 – Code MED       ││
│  │ 2 min ago                 ││
│  │ [Acknowledge]             ││
│  └──────────────────────────┘│
│                              │
│  🟡 WARNING                  │
│  ┌──────────────────────────┐│
│  │ Break Overdue: Mike R.   ││
│  │ On break for 42 min      ││
│  │ 5 min ago                 ││
│  │ [Acknowledged ✓]         ││
│  └──────────────────────────┘│
│                              │
│  🔵 INFO                     │
│  ┌──────────────────────────┐│
│  │ Briefing posted           ││
│  │ Night shift handoff       ││
│  │ 15 min ago                ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

### Notifications Screen: `app/notifications/index.tsx`

Personal notifications (assigned to you, mentions, status changes):

```
┌──────────────────────────────┐
│  Notifications               │
│                              │
│  • You were assigned to      │
│    INC-0043 (2m ago)         │
│                              │
│  • DSP-0018 status changed   │
│    to On Scene (5m ago)      │
│                              │
│  • New briefing: Night shift │
│    handoff (15m ago)         │
│                              │
│  [Mark All Read]             │
└──────────────────────────────┘
```

---

## 8.6 Verification Checklist

### Dashboard
- [ ] KPI cards show accurate counts
- [ ] Quick action buttons navigate to create screens
- [ ] Recent activity feed loads real data
- [ ] Auto-refreshes every 30 seconds
- [ ] Real-time updates via subscription

### Analytics
- [ ] Charts render with real data
- [ ] Segmented control switches between modules
- [ ] Date range filter works
- [ ] Horizontal bar charts, donut charts, line charts all render

### Reports
- [ ] Date range picker works
- [ ] PDF generation creates valid file
- [ ] Share sheet opens with generated PDF
- [ ] CSV export works

### Settings
- [ ] Profile displays current user info
- [ ] Avatar change works (camera + gallery)
- [ ] Theme toggle persists across app restarts
- [ ] Organization settings hidden for non-admin roles
- [ ] Sign out clears all stores and navigates to login
- [ ] Location tree renders correctly

### Alerts & Notifications
- [ ] Alerts grouped by severity
- [ ] Acknowledge button works
- [ ] Notification count badge on tab bar
- [ ] Mark all read clears badge

---

**Previous:** [← Phase 7 — Support Modules](./07-SUPPORT-MODULES.md)
**Next:** [Phase 9 — Real-time, Notifications & Offline →](./09-REALTIME-NOTIFICATIONS-OFFLINE.md)
